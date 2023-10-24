import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import cloudflare from "@astrojs/cloudflare";
import svelte from "@astrojs/svelte";
import react from "@astrojs/react";

import solidJs from "@astrojs/solid-js";

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), svelte(), react(), solidJs()],
  output: "server",
  adapter: cloudflare()
});