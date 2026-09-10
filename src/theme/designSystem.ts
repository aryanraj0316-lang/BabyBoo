/**
 * BABYBOO — PREMIUM PASTEL PARENTING APP DESIGN SYSTEM
 * 
 * Aesthetic: Warm, soft, premium pastel aesthetic inspired by modern children's wellness products.
 * Friendly and playful, but NOT childish, cartoonish, or overly decorative.
 * 
 * NOTE: The Buddy Mascot's colors, animation, shape, and style are strictly preserved.
 */

export const BABYBOO_THEME = {
  colors: {
    // Primary Background: Warm ivory / creamy off-white with subtle warm beige undertone
    bg: {
      primary: '#FAF8F5',
      creamy: '#FBF9F4',
      warmBeige: '#F5F2EB',
      card: '#FFFFFF',
      cardTint: '#FAF8F5',
      subtleOverlay: 'rgba(250, 248, 245, 0.95)',
    },

    // Primary Text: Deep navy-blue, almost charcoal (high contrast, softer than pure black)
    text: {
      primary: '#1A2436',     // Dominant deep navy
      secondary: '#475569',   // Softer slate for descriptions
      muted: '#64748B',       // Muted text for captions
      subtle: '#94A3B8',      // Inactive tab & disabled text
      inverse: '#FFFFFF',     // Pure white for dark-accent buttons
    },

    // Accent Colors: Muted & sophisticated pastels
    accents: {
      // Soft sage / mint green — PRIMARY ACTION COLOR
      sage: {
        DEFAULT: '#5D997C',
        hover: '#51876D',
        active: '#46745D',
        tint: '#EBF4EF',
        subtleBorder: '#D1E6DA',
        text: '#2D5441',
      },

      // Muted sky blue
      sky: {
        DEFAULT: '#89B6D8',
        tint: '#EBF3FA',
        subtleBorder: '#D0E3F2',
        text: '#295475',
      },

      // Soft butter yellow
      butter: {
        DEFAULT: '#F6D878',
        tint: '#FEF9E7',
        subtleBorder: '#F9ECC0',
        text: '#7A6216',
      },

      // Very light lavender
      lavender: {
        DEFAULT: '#C4B5FD',
        tint: '#F5F2FF',
        subtleBorder: '#E5DCFC',
        text: '#5B3F9B',
      },

      // Occasional peach accents
      peach: {
        DEFAULT: '#FBBF9C',
        tint: '#FDF3EE',
        subtleBorder: '#F9DFD2',
        text: '#8E4A25',
      },
    },

    // Borders & Dividers
    borders: {
      subtle: '#EAE5DE',
      medium: '#DFD9CE',
      highlight: '#D1C9BE',
    },

    // Soft Shadows
    shadows: {
      card: '0 2px 14px rgba(26, 36, 54, 0.04), 0 1px 3px rgba(26, 36, 54, 0.02)',
      cardHover: '0 6px 20px rgba(26, 36, 54, 0.07), 0 2px 6px rgba(26, 36, 54, 0.03)',
      button: '0 2px 8px rgba(93, 153, 124, 0.22)',
      modal: '0 16px 40px -8px rgba(26, 36, 54, 0.12)',
    },
  },

  // Corner Radii (20–28px rounded cards and pill buttons)
  radii: {
    card: '24px',
    cardLg: '28px',
    button: '18px',
    buttonPill: '9999px',
    input: '16px',
    chip: '14px',
  },

  // Typography definitions
  typography: {
    fontFamily: `'Nunito', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif`,
    headings: {
      hero: 'font-black tracking-tight text-[#1A2436]',
      h1: 'font-extrabold tracking-tight text-[#1A2436]',
      h2: 'font-bold tracking-tight text-[#1A2436]',
      h3: 'font-bold text-[#1A2436]',
    },
    body: {
      lead: 'font-medium text-[#475569] leading-relaxed',
      normal: 'font-normal text-[#475569] leading-normal',
      caption: 'font-medium text-[#64748B] text-xs',
      label: 'font-bold text-[#1A2436] text-xs tracking-wide uppercase',
    },
  },

  // Standard CSS class utilities
  classes: {
    // Large rounded cards: warm white, subtle border, airy shadow
    card: 'bg-white rounded-[24px] border border-[#EAE5DE] shadow-[0_2px_14px_rgba(26,36,54,0.04)] p-4 sm:p-5 transition-all duration-200',
    cardLight: 'bg-[#FAF8F5] rounded-[24px] border border-[#EAE5DE] shadow-[0_2px_10px_rgba(26,36,54,0.03)] p-4 transition-all duration-200',
    cardInteractive: 'bg-white rounded-[24px] border border-[#EAE5DE] shadow-[0_2px_14px_rgba(26,36,54,0.04)] p-4 sm:p-5 hover:border-[#D1C9BE] hover:shadow-[0_6px_20px_rgba(26,36,54,0.07)] active:scale-[0.99] transition-all duration-200 cursor-pointer',

    // Primary buttons: Solid muted sage green, subtle depth shadow, generous padding
    btnPrimary: 'inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#5D997C] hover:bg-[#51876D] active:bg-[#46745D] text-white font-bold text-sm sm:text-base rounded-full shadow-[0_2px_10px_rgba(93,153,124,0.25)] hover:shadow-[0_4px_14px_rgba(93,153,124,0.3)] active:scale-[0.98] transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',

    // Secondary buttons: White/cream background, thin pastel border, dark navy text
    btnSecondary: 'inline-flex items-center justify-center gap-2 px-5 py-3 bg-white hover:bg-[#FBF9F4] text-[#1A2436] border border-[#EAE5DE] hover:border-[#DFD9CE] font-bold text-sm rounded-full shadow-xs active:scale-[0.98] transition-all duration-150 cursor-pointer',

    // Selection buttons: Unselected vs Selected
    btnSelectionUnselected: 'bg-white hover:bg-[#FBF9F4] text-[#475569] border border-[#EAE5DE] hover:border-[#D1C9BE] rounded-2xl p-3 font-semibold transition-all duration-150 cursor-pointer',
    btnSelectionSelected: 'bg-[#EBF4EF] text-[#2D5441] border-2 border-[#5D997C] rounded-2xl p-3 font-bold shadow-xs transition-all duration-150 cursor-pointer',

    // Soft Pill Chips
    pillSage: 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF4EF] text-[#2D5441] border border-[#D1E6DA] text-xs font-bold',
    pillSky: 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF3FA] text-[#295475] border border-[#D0E3F2] text-xs font-bold',
    pillButter: 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEF9E7] text-[#7A6216] border border-[#F9ECC0] text-xs font-bold',
    pillLavender: 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5F2FF] text-[#5B3F9B] border border-[#E5DCFC] text-xs font-bold',
    pillPeach: 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FDF3EE] text-[#8E4A25] border border-[#F9DFD2] text-xs font-bold',
  },
} as const;

export default BABYBOO_THEME;
