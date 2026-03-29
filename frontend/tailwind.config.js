/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        headline: ['Manrope', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      colors: {
        // Primary
        primary: '#0052ae',
        'primary-container': '#006adc',
        'on-primary': '#ffffff',
        'on-primary-container': '#edf1ff',
        'primary-fixed': '#d7e2ff',
        'primary-fixed-dim': '#acc7ff',
        'on-primary-fixed': '#001a40',
        'on-primary-fixed-variant': '#004492',
        'inverse-primary': '#acc7ff',
        // Secondary
        secondary: '#006c49',
        'secondary-container': '#6cf8bb',
        'on-secondary': '#ffffff',
        'on-secondary-container': '#00714d',
        'secondary-fixed': '#6ffbbe',
        'secondary-fixed-dim': '#4edea3',
        'on-secondary-fixed': '#002113',
        'on-secondary-fixed-variant': '#005236',
        // Tertiary
        tertiary: '#3f40cd',
        'tertiary-container': '#595ce7',
        'on-tertiary': '#ffffff',
        'on-tertiary-container': '#f3f0ff',
        'tertiary-fixed': '#e1e0ff',
        'tertiary-fixed-dim': '#c0c1ff',
        'on-tertiary-fixed': '#07006c',
        'on-tertiary-fixed-variant': '#2f2ebe',
        // Surface
        background: '#f9f9ff',
        surface: '#f9f9ff',
        'surface-bright': '#f9f9ff',
        'surface-dim': '#d8d9e3',
        'surface-variant': '#e1e2ec',
        'surface-tint': '#005bbf',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f2f3fd',
        'surface-container': '#ecedf7',
        'surface-container-high': '#e6e8f2',
        'surface-container-highest': '#e1e2ec',
        // On-surface
        'on-surface': '#191c22',
        'on-surface-variant': '#414753',
        'on-background': '#191c22',
        // Inverse
        'inverse-surface': '#2d3038',
        'inverse-on-surface': '#eff0fa',
        // Outline
        outline: '#727785',
        'outline-variant': '#c1c6d6',
        // Error
        error: '#ba1a1a',
        'error-container': '#ffdad6',
        'on-error': '#ffffff',
        'on-error-container': '#93000a',
      },
    },
  },
  plugins: [],
}
