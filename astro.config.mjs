import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
	site: 'https://jeemainstimer.pages.dev/',
	integrations: [mdx(), sitemap()],
	output: 'server',
	adapter: cloudflare()
});
