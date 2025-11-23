import { defineConfig } from "astro/config";

import svelte from "@astrojs/svelte";

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
    site: "https://connorbroad.github.io",
    base: "/github-pages-test",

    devToolbar: {
        enabled: false,
    },

    integrations: [svelte()],
    server: { port: 4200 },

    vite: {
        plugins: [tailwindcss()],
    },
});
