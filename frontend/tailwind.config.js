/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta Hazuki - Colores del sitio original
        hazuki: {
          // Gradiente principal
          orange: "#f08c33",      // Naranja primario
          amber: "#ed9f04",       // Amarillo/Ámbar
          red: "#f12e03",         // Rojo/Acento
          // Textos
          'text-dark': "#1a1a1a", // Texto oscuro
          'text-light': "#f8f9fa", // Texto claro
          // Grises
          'gray-light': "#e5e7eb",
          'gray-medium': "#6b7280",
          'gray-dark': "#374151",
          // Fondo base
          'bg-light': "#f0f0f0",  // Fondo claro
          'bg-white': "#ffffff",  // Blanco puro
        },
      },
      backgroundImage: {
        // Gradientes principales - Naranja → Amarillo → Rojo
        'gradient-hazuki': 'linear-gradient(to right, #f08c33, #ed9f04, #f12e03)',
        'gradient-hazuki-rev': 'linear-gradient(to right, #f12e03, #ed9f04, #f08c33)',
        // Overlay para hero
        'gradient-overlay': 'linear-gradient(135deg, rgba(240, 140, 51, 0.8), rgba(237, 159, 4, 0.8), rgba(241, 46, 3, 0.8))',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'slide-in': 'slideIn 0.6s ease-out',
      },
      keyframes: {
        fadeInUp: {
          '0%': {
            opacity: '0',
            transform: 'translateY(30px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        slideIn: {
          '0%': {
            opacity: '0',
            transform: 'translateX(-30px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
      },
      boxShadow: {
        'glow-orange': '0 0 20px rgba(240, 140, 51, 0.4)',
      },
    },
  },
  plugins: [],
}
