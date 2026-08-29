import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://joshitmohanty.com',
  trailingSlash: 'ignore',
  build: { inlineStylesheets: 'auto' },
  image: {
    service: { entrypoint: 'astro/assets/services/sharp' },
  },
  integrations: [sitemap()],
  compressHTML: true,
});
