/**
 * Design system v5 tokens (see ../design/01-foundations.md).
 *
 * The web declares these as CSS variables under Tailwind v4's `@theme`;
 * NativeWind v4 runs on Tailwind v3, which has no `@theme` and no CSS
 * variables at runtime — so the same palette is restated here as plain values.
 * When a token changes, both this file and `src/theme/tokens.ts` change.
 *
 * v5 splits interaction from data semantics: `action` (ink) is what you can
 * press, `data-primary` (blue) is what a chart draws with, and green means a
 * good consequence — never "this is clickable". Cards lost their shadow and
 * separate from the canvas by lightness alone. There is no dark mode.
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Surfaces, separated by lightness only — no borders, no shadows.
        canvas: '#EDF3F8',
        card: '#FFFFFF',
        wash: '#E3ECF2',
        divider: '#EEF1F2',
        // The hero card is the only surface allowed to wear this.
        hero: '#B5CDE8',
        'hero-deep': '#ACC6E3',
        'field-disabled': '#F7F9FA',

        ink: '#0F1011',
        ink2: '#596268',
        ink3: '#6B767C',

        // Interaction is ink, never green (§4).
        action: '#0F1011',
        'action-inverse': '#FFFFFF',
        'action-soft': '#EEF1F2',
        'data-primary': '#73A4D7',

        // Fill tones: a dot, a bar, a tick, a destructive background.
        positive: '#8FCDA4',
        attention: '#E1BE68',
        'attention-soft': '#F6EDDC',
        alert: '#E8A39A',

        // Text-safe counterparts (>=4.5:1 on a white card). Anything that has to
        // be READ — a figure, a warning line, an error border — takes these.
        'positive-ink': '#4E855F',
        'data-ink': '#356FA8',
        'alert-ink': '#A9544D',
        'attention-ink': '#8C6817',

        committed: '#D8E0E4',
        protect: '#AFC0C7',

        // v4 aliases -> v5 values, so a screen mid-migration still resolves.
        app: '#EDF3F8',
        panel: '#FFFFFF',
        sunk: '#E3ECF2',
        hair: '#EEF1F2',
        interactive: '#0F1011',
        'interactive-soft': '#EEF1F2',
      },
      borderRadius: {
        hero: '28px',
        card: '22px',
        control: '14px',
        pill: '999px',
        // v4 aliases.
        panel: '22px',
        sunk: '14px',
      },
      fontFamily: {
        // Urbanist carries the whole UI at 300/400/500 (§5.1). v5 drops
        // Be Vietnam Pro; `semibold` is gone with it — 500 is the top weight.
        light: ['Urbanist_300Light'],
        sans: ['Urbanist_400Regular'],
        medium: ['Urbanist_500Medium'],
        // ASCII only — mono must never touch accented Vietnamese (§5, hard constraint).
        mono: ['IBMPlexMono_400Regular'],
      },
    },
  },
  plugins: [
    /**
     * The type scale as classes, v5 §5.2-5.3 — the same eleven steps the web
     * ships in `web/src/index.css`, so a figure reads at the same rank on both
     * clients and neither drifts into a hand-set size.
     *
     * A step carries size, weight and tracking together. `font-medium` on top
     * of one is emphasis WITHIN a step and is allowed; a raw `text-[17px]` is
     * not a step and should not appear.
     *
     * NativeWind resolves `lineHeight` in px, not the unitless ratio the web
     * uses, so each step states the product.
     */
    function ({ addUtilities }) {
      addUtilities({
        '.t-display': {
          fontSize: '72px',
          fontFamily: 'Urbanist_500Medium',
          lineHeight: '73px',
          letterSpacing: '-2.52px',
        },
        '.t-hero': {
          fontSize: '56px',
          fontFamily: 'Urbanist_400Regular',
          lineHeight: '59px',
          letterSpacing: '-2.24px',
        },
        '.t-figure': {
          fontSize: '40px',
          fontFamily: 'Urbanist_400Regular',
          lineHeight: '44px',
          letterSpacing: '-1.4px',
        },
        '.t-metric': {
          fontSize: '28px',
          fontFamily: 'Urbanist_400Regular',
          lineHeight: '32px',
          letterSpacing: '-0.84px',
        },
        '.t-title': {
          fontSize: '24px',
          fontFamily: 'Urbanist_500Medium',
          lineHeight: '31px',
          letterSpacing: '-0.48px',
        },
        '.t-subtitle': {
          fontSize: '20px',
          fontFamily: 'Urbanist_500Medium',
          lineHeight: '27px',
          letterSpacing: '-0.2px',
        },
        '.t-subhead': {
          fontSize: '20px',
          fontFamily: 'Urbanist_400Regular',
          lineHeight: '26px',
        },
        '.t-body': {
          fontSize: '16px',
          fontFamily: 'Urbanist_300Light',
          lineHeight: '24px',
        },
        '.t-body-sm': {
          fontSize: '14px',
          fontFamily: 'Urbanist_300Light',
          lineHeight: '21px',
        },
        '.t-caption': {
          fontSize: '12px',
          fontFamily: 'Urbanist_300Light',
          lineHeight: '17px',
        },
        // The floor. Below this Vietnamese diacritics stop resolving at normal
        // viewing distance.
        '.t-caption-sm': {
          fontSize: '11px',
          fontFamily: 'Urbanist_300Light',
          lineHeight: '15px',
        },
      })
    },
  ],
}
