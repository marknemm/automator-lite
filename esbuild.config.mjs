import { TsconfigPathsPlugin } from '@esbuild-plugins/tsconfig-paths';
import { typecheckPlugin } from '@jgoz/esbuild-plugin-typecheck';
import esbuild from 'esbuild';
import copy from 'esbuild-plugin-copy';
import eslintPlugin from 'esbuild-plugin-eslint';
import inlineImportPlugin from 'esbuild-plugin-inline-import';
import { sassPlugin } from 'esbuild-sass-plugin';
import { rm, writeFile } from 'fs/promises';
import * as sass from 'sass';

// Resolve the environment and build options
const prod = ['production', 'prod'].includes(process.env.NODE_ENV ?? '');
const analyze = process.argv.includes('--analyze');
const minify = process.argv.includes('--minify') || prod;
const watch = process.argv.includes('--watch');

/** Auto resolved paths for SASS imports (e.g. can directly `@use "base" as *`) */
const sassLoadPaths = [
  './src/shared/styles',
  './src/shared/components',
];

// Clean the output directory before building
await rm('dist', { recursive: true, force: true });

// Create the esbuild context with the specified entry points and plugins.
const ctx = await esbuild.context({
  entryPoints: {
    'background/background': 'src/background/background.ts',
    'content/content': 'src/content/content.ts',
    'popup/popup': 'src/popup/popup.ts',
  },
  external: [
    // Exclude font files from being bundled.
    '*.woff2',
    '*.woff',
    '*.ttf',
    '*.svg',
    // Exclude lazy loaded JS scripts from being bundled - built and bundled separately.
    'lazy/*',
  ],
  define: {
    'process.env.NODE_ENV': JSON.stringify(prod ? 'production' : 'development'),
  },
  bundle: true,
  write: true,
  logLevel: 'info',
  outdir: 'dist',
  target: 'es2022',
  tsconfig: 'tsconfig.json',
  metafile: analyze,
  plugins: [
    TsconfigPathsPlugin({}),
    typecheckPlugin({
      omitStartLog: true,
      watch,
    }),
    eslintPlugin({
      throwOnError: true,
      filter: /src\/.*\.(js|ts|tsx|jsx)$/,
    }),
    inlineImportPlugin({ // Inline imports ending with '?inline' as strings.
      filter: /\?inline$/,
      transform: async (contents, args) => new Promise(async (resolve) => { // Transpile SASS to CSS.
        if (!args.path.match(/.s[ac]ss|.less$/)) return resolve(contents);
        const result = await sass.compileStringAsync(contents, { loadPaths: sassLoadPaths });
        resolve(result.css.toString());
      }),
    }),
    {
      name: 'font-external',
      setup(build) {
        build.onResolve({ filter: /\.(woff2|woff|ttf|svg)(\?.*)?$/ }, args => ({
          path: args.path,
          external: true,
        }));
      },
    },
    sassPlugin({ // Transpile & Bundle SASS/CSS into single file (minimized in PROD build to remove duplicated styles).
      type: 'css',
      filter: /(.s[ac]ss|.less|.css)$/,
      loadPaths: sassLoadPaths,
    }),
    copy({
      assets: {
        from: ['./src/**/*.{html,json,png,jpg,jpeg,gif,webp}'],
        to: ['.'],
      },
      watch,
    }),
    copy({
      assets: {
        from: ['./public/**/*'],
        to: ['./public'],
      },
      watch,
    }),
  ],
  treeShaking: true,
  sourcemap: !minify ? 'inline' : false,
  minify,
});

// Perform build or watch based on the command line arguments.
try {
  if (analyze) {
    const buildResult = await ctx.rebuild();
    await ctx.dispose();
    if (buildResult.metafile) {
      await writeFile('dist/meta.json', JSON.stringify(buildResult.metafile, null, 2));
      const { visualizer } = await import('esbuild-visualizer');
      const visualizerResult = await visualizer(buildResult.metafile);
      await writeFile('dist/visualizer.html', visualizerResult);
    }
  } else if (watch) {
    await ctx.watch();
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
} catch (error) {
  console.error('Error during build process:', error);
  process.exit(1);
}
