import { TsconfigPathsPlugin } from '@esbuild-plugins/tsconfig-paths';
import { typecheckPlugin } from '@jgoz/esbuild-plugin-typecheck';
import esbuild from 'esbuild';
import copy from 'esbuild-plugin-copy';
import eslintPlugin from 'esbuild-plugin-eslint';
import inlineImportPlugin from 'esbuild-plugin-inline-import';
import { sassPlugin } from 'esbuild-sass-plugin';
import { rm } from 'fs/promises';
import * as sass from 'sass';

// Resolve the environment and build options
const prod = process.env.NODE_ENV === 'production';
const minify = process.argv.includes('--minify') || prod;
const watch = process.argv.includes('--watch');

/** Auto resolved paths for SASS imports (e.g. can directly `@use "base"`) */
const sassLoadPaths = ['./src/shared/styles', './src/shared/components'];

// Clean the output directory before building
await rm('dist', { recursive: true, force: true });

// Create the esbuild context with the specified entry points and plugins.
const ctx = await esbuild.context({
  entryPoints: [
    'src/background/background.ts',
    'src/content/content.ts',
    'src/popup/popup.ts',
  ],
  bundle: true,
  write: true,
  logLevel: 'info',
  outdir: 'dist',
  target: 'es2022',
  tsconfig: 'tsconfig.json',
  plugins: [
    TsconfigPathsPlugin({}),
    typecheckPlugin({
      omitStartLog: true,
      watch,
    }),
    eslintPlugin({
      throwOnError: true,
    }),
    inlineImportPlugin({ // Inline imports ending with '?inline' as strings.
      filter: /\?inline$/,
      transform: async (contents, args) => new Promise(async (resolve) => { // Transpile SASS to CSS.
        if (!args.path.match(/.s[ac]ss|.less$/)) return resolve(contents);
        const result = await sass.compileStringAsync(contents, { loadPaths: sassLoadPaths });
        resolve(result.css.toString());
      }),
    }),
    sassPlugin({ // Transpile & Bundle SASS/CSS into single file (minimized in PROD build to remove duplicated styles).
      type: 'css',
      filter: /.s[ac]ss|.less|.css$/,
      loadPaths: sassLoadPaths,
    }),
    copy({
      assets: {
        from: ['./src/**/*.{html,json,svg,png,jpg,jpeg,gif,webp}'],
        to: ['.'],
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
  if (watch) {
    await ctx.watch();
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
} catch (error) {
  console.error('Error during build process:', error);
  process.exit(1);
}
