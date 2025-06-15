import { TsconfigPathsPlugin } from '@esbuild-plugins/tsconfig-paths';
import { typecheckPlugin } from '@jgoz/esbuild-plugin-typecheck';
import esbuild from 'esbuild';
import copy from 'esbuild-plugin-copy';
import eslintPlugin from 'esbuild-plugin-eslint';
import { sassPlugin } from 'esbuild-sass-plugin';
import { rm } from 'fs/promises';

const prod = process.env.NODE_ENV === 'production';
const minify = process.argv.includes('--minify') || prod;
const watch = process.argv.includes('--watch');

await rm('dist', { recursive: true, force: true });

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
  plugins: [
    TsconfigPathsPlugin({}),
    typecheckPlugin({
      omitStartLog: true,
      watch,
    }),
    eslintPlugin({
      throwOnError: true,
    }),
    sassPlugin({
      type: 'css-text',
      filter: /\.shadow\.s?css$/,
      loadPaths: ['./src/shared/styles', './src/shared/components'],
    }),
    sassPlugin({
      type: 'css',
      filter: /\.s?css$/,
      loadPaths: ['./src/shared/styles', './src/shared/components'],
      sourceMap: !minify,
      sourceMapIncludeSources: !minify,
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
