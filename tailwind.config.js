/** @type {import('tailwindcss').Config} */
const config = {
	darkMode: "class",
	content: ["./src/**/*.{html,js,svelte,ts}"],
	safelist: [],
	theme: {
		container: {
			center: true,
			padding: "2rem",
			screens: {
				"2xl": "1400px",
			},
		},
		extend: {
			fontFamily: {
				sans: ["Open Sans", "sans-serif"],
			},
		},
	},
	plugins: [
		// Keep plugins if you have them (e.g., forms, typography)
	],
};

export default config; 