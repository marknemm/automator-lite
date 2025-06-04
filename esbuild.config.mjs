import esbuild from 'esbuild';
import { sassPlugin } from 'esbuild-sass-plugin';
import { typecheckPlugin } from '@jgoz/esbuild-plugin-typecheck';

const prod = process.env.NODE_ENV === 'production';
const minify = process.argv.includes('--minify') || prod;
const watch = process.argv.includes('--watch');

const ctx = await esbuild.context({
  entryPoints: [
    'src/background.ts',
    'src/content.ts',
    'src/popup.ts',
  ],
  bundle: true,
  write: true,
  logLevel: 'info',
  outdir: 'dist',
  plugins: [
    typecheckPlugin({
      omitStartLog: true,
      watch,
    }),
    sassPlugin({
      type: 'css-text',
      filter: /\.shadow\.scss$/,
    }),
    sassPlugin({
      type: 'css',
      filter: /\.s?css$/,
      sourceMap: !minify,
      sourceMapIncludeSources: !minify,
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
