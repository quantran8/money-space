/**
 * Design system v4.2 tokens (see ../design/01-foundations.md).
 *
 * The web declares these as CSS variables under Tailwind v4's `@theme`;
 * NativeWind v4 runs on Tailwind v3, which has no `@theme` and no CSS
 * variables at runtime — so the same palette is restated here as plain values.
 * When a token changes, both files change.
 *
 * v4.2 renames the web's `--accent` to `interactive` and lifts `ink3` to
 * #707780 so micro text clears AA. There is no dark mode in v4.
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Three surfaces, separated by lightness only — no borders, no shadows.
        app: '#EEF1F3',
        panel: '#FFFFFF',
        sunk: '#F5F7F8',

        ink: '#15181C',
        ink2: '#525860',
        ink3: '#707780',
        hair: '#E5E9EC',

        // Interaction is separate from data direction (v4.2 §3).
        interactive: '#0A6B47',
        'interactive-soft': '#E3EFEA',

        // Colour marks what needs action, nothing else. No blue, no second green.
        attention: '#9A6818',
        'attention-soft': '#F6EDDC',
        alert: '#B23A26',

        // Neutral weights for composition bars — liquidity by weight, not hue.
        committed: '#D2D6DA',
        protect: '#A9B0B8',
      },
      borderRadius: {
        panel: '14px',
        sunk: '10px',
        control: '8px',
      },
      fontFamily: {
        // Every Vietnamese string. Weights 400/500/600.
        sans: ['BeVietnamPro-Regular'],
        medium: ['BeVietnamPro-Medium'],
        semibold: ['BeVietnamPro-SemiBold'],
        // ASCII only — mono must never touch accented Vietnamese (§5, hard constraint).
        mono: ['IBMPlexMono-Regular'],
      },
    },
  },
  plugins: [],
}
