/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            // Colors from design-system.css
            colors: {
                paper: 'rgb(var(--color-paper) / <alpha-value>)',
                ink: {
                    DEFAULT: 'rgb(var(--color-ink) / <alpha-value>)',
                    muted: 'rgb(var(--color-ink-muted) / <alpha-value>)',
                    subtle: 'rgb(var(--color-ink-subtle) / <alpha-value>)',
                },
                accent: {
                    DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
                    active: 'rgb(var(--color-accent-active) / <alpha-value>)',
                },
                border: 'rgb(var(--color-border) / <alpha-value>)',
                surface: 'rgb(var(--color-surface) / <alpha-value>)',
                'primary-dark': 'rgb(var(--color-primary-dark) / <alpha-value>)',
                logo: 'rgb(var(--color-logo) / <alpha-value>)',
                error: 'rgb(var(--color-error) / <alpha-value>)',
                success: 'rgb(var(--color-success) / <alpha-value>)',
            },
            // Typography from design-system.css
            fontFamily: {
                serif: ['Cormorant Garamond', 'serif'],
                body: ['Montserrat', 'Arial', 'sans-serif'],
            },
            // Spacing from design-system.css
            spacing: {
                'xs': 'var(--space-xs)',
                'sm': 'var(--space-sm)',
                'md': 'var(--space-md)',
                'lg': 'var(--space-lg)',
                'xl': 'var(--space-xl)',
                '2xl': 'var(--space-2xl)',
            },
            // Border radius from design-system.css
            borderRadius: {
                'sm': 'var(--radius-sm)',
                'md': 'var(--radius-md)',
                'lg': 'var(--radius-lg)',
                'xl': 'var(--radius-xl)',
                'full': 'var(--radius-full)',
            },
            // Shadows from design-system.css
            boxShadow: {
                'sm': 'var(--shadow-sm)',
                'md': 'var(--shadow-md)',
                'lg': 'var(--shadow-lg)',
                'floating-nav': 'var(--shadow-floating-nav)',
            },
            // Transitions from design-system.css
            transitionDuration: {
                'instant': 'var(--duration-instant)',
                'fast': 'var(--duration-fast)',
                'base': 'var(--duration-base)',
                'slow': 'var(--duration-slow)',
                'entrance': 'var(--duration-entrance)',
                'page': 'var(--duration-page)',
            },
            // Custom animations
            animation: {
                'page-enter': 'pageEnter var(--duration-page) var(--ease-out-quart) both',
                'fade-in': 'fadeIn var(--duration-entrance) var(--ease-out-quart) both',
                'slide-up': 'slideUp var(--duration-slow) var(--ease-out-quart) both',
                'scale-in': 'scaleIn var(--duration-base) var(--ease-spring) both',
                'bar-slide-up': 'barSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                'pulse-record': 'pulse 2s infinite',
                'slide-in': 'slideIn 0.3s ease-out',
                'backdrop-fade-in': 'backdropFadeIn var(--duration-base) var(--ease-out-quart) both',
                'modal-enter': 'modalEnter var(--duration-slow) var(--ease-out-quart) both',
                'pulse-k': 'pulse-k 1.2s ease-in-out infinite',
            },
            keyframes: {
                pageEnter: {
                    from: { opacity: '0', transform: 'translateY(16px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
                fadeIn: {
                    from: { opacity: '0', transform: 'translateY(8px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
                slideUp: {
                    from: { opacity: '0', transform: 'translateY(20px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
                scaleIn: {
                    from: { opacity: '0', transform: 'scale(0.96)' },
                    to: { opacity: '1', transform: 'scale(1)' },
                },
                barSlideUp: {
                    from: { transform: 'translate(-50%, 100%)', opacity: '0' },
                    to: { transform: 'translate(-50%, 0)', opacity: '1' },
                },
                pulse: {
                    '0%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(140, 47, 47, 0.7)' },
                    '70%': { transform: 'scale(1.1)', boxShadow: '0 0 0 10px rgba(140, 47, 47, 0)' },
                    '100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(140, 47, 47, 0)' },
                },
                slideIn: {
                    from: { opacity: '0', transform: 'translateY(20px) scale(0.8)' },
                    to: { opacity: '1', transform: 'translateY(0) scale(1)' },
                },
                backdropFadeIn: {
                    from: { opacity: '0' },
                    to: { opacity: '1' },
                },
                modalEnter: {
                    from: { opacity: '0', transform: 'scale(0.95) translateY(10px)' },
                    to: { opacity: '1', transform: 'scale(1) translateY(0)' },
                },
                'pulse-k': {
                    '0%, 100%': { opacity: '0.7', transform: 'scale(1)' },
                    '50%': { opacity: '1', transform: 'scale(1.05)' },
                },
            },
        },
    },
    plugins: [],
}
