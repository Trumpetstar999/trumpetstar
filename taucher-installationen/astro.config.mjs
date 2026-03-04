import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.heizung-taucher.at',
  output: 'static',
  compressHTML: true,
});
