/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue,svelte}'],
	theme: {
		extend: {},
			screens: {
				'sm': {'max': '386px'},
				'md': {'max': '586px'},
				'lg': {'min': '586px', 'max': '786px'},
				'xl': {'min': '786px'},
			},
	},
	plugins: [require("daisyui")],
	daisyui: {
		themes: [
			"halloween",  // Default
			"cupcake",
			"retro",
			"coffee",
			"forest",
			"light",
			"valentine",
			 "nord",
            "lemonade",
            "pastel"
		],
	},
}
