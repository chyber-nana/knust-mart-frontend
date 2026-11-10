export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: { extend: {
    colors: {
      paper: "rgb(var(--color-paper) / <alpha-value>)",
      ink: "rgb(var(--color-ink) / <alpha-value>)",
      line: "rgb(var(--color-line) / <alpha-value>)",
      brand: "#1f5d3a",
      gold: "#9a6b00",
    },
    fontFamily: { sans: ['"Instrument Sans"', "system-ui", "sans-serif"], display: ['"Bricolage Grotesque"', "system-ui", "sans-serif"] },
  } },
  plugins: [],
};
