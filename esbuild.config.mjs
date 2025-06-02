import esbuild from 'esbuild';
import { sassPlugin } from 'esbuild-sass-plugin';

const minify = process.argv.includes('--minify') || process.env.NODE_ENV === 'production';
const watch = process.argv.includes('--watch');

const ctx = await esbuild.context({
  entryPoints: [
    'src/background.ts',
    'src/content.ts',
    'src/popup.ts',
  ],
  bundle: true,
  outdir: 'dist',
  plugins: [
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
    {
      name: 'build-result-info',
      setup(build) {
        build.onEnd((result) => {
          console.log('Build completed: ', result);
        });
      }
    }
  ],
  treeShaking: true,
  sourcemap: !minify ? 'inline' : false,
  minify,
});

if (watch) {
  await ctx.watch();
  console.log('Watching for changes...');
} else {
  await ctx.rebuild();
  await ctx.dispose();
}
