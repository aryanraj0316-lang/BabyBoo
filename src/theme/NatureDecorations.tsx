import React from 'react';

interface NatureDecorationsProps {
  variant?: 'minimal' | 'full' | 'subtle' | 'playful' | 'gentle';
  className?: string;
}

/**
 * BABYBOO NATURE BACKGROUND ART
 * Subtle organic nature-inspired decorative elements:
 * - Small soft clouds
 * - Gentle rolling hills
 * - Tiny plants and leaves
 * - Gentle sun illustration
 * Sits quietly in the background and never competes with UI controls.
 */
export const NatureDecorations: React.FC<NatureDecorationsProps> = ({
  variant = 'full',
  className = '',
}) => {
  const isFull = variant === 'full' || variant === 'playful';
  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden select-none -z-0 ${className}`}
      aria-hidden="true"
    >
      {/* Gentle Sun: warm soft glow in top right */}
      <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-[#FEF9E7] opacity-60 blur-2xl" />
      <svg
        className="absolute top-4 right-6 w-12 h-12 text-[#F6D878] opacity-25"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="24" cy="24" r="10" fill="#F6D878" />
        <circle cx="24" cy="24" r="14" stroke="#F6D878" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
      </svg>

      {/* Small Soft Cloud (Top Left) */}
      <svg
        className="absolute top-8 left-5 w-20 h-10 text-white opacity-60"
        viewBox="0 0 80 40"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M18 32h46a10 10 0 002-19.8 14 14 0 00-26.4-4.8A12 12 0 0018 32z" />
      </svg>

      {/* Tiny Soft Cloud (Mid-Right) */}
      <svg
        className="absolute top-28 right-8 w-14 h-7 text-white opacity-45"
        viewBox="0 0 80 40"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M18 32h46a10 10 0 002-19.8 14 14 0 00-26.4-4.8A12 12 0 0018 32z" />
      </svg>

      {isFull && (
        <>
          {/* Subtle Floating Organic Leaves */}
          <svg
            className="absolute top-44 left-3 w-5 h-5 text-[#5D997C] opacity-20 -rotate-12"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.75C6.2 7.5 4.5 9.5 4 12c3.5-1 7.5-1.5 13-4z" />
          </svg>

          <svg
            className="absolute top-72 right-4 w-4 h-4 text-[#89B6D8] opacity-20 rotate-45"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.75C6.2 7.5 4.5 9.5 4 12c3.5-1 7.5-1.5 13-4z" />
          </svg>

          {/* Gentle Rolling Hills at Bottom Background */}
          <div className="absolute bottom-0 inset-x-0 h-32 opacity-40">
            <svg
              className="w-full h-full text-[#EBF4EF]"
              viewBox="0 0 400 120"
              preserveAspectRatio="none"
              fill="currentColor"
            >
              <path d="M0 70 Q 110 30 220 65 T 400 50 L 400 120 L 0 120 Z" />
            </svg>
            <svg
              className="absolute bottom-0 inset-x-0 w-full h-24 text-[#F5F2EB] opacity-60"
              viewBox="0 0 400 90"
              preserveAspectRatio="none"
              fill="currentColor"
            >
              <path d="M0 45 Q 160 10 300 40 T 400 30 L 400 90 L 0 90 Z" />
            </svg>
          </div>
        </>
      )}
    </div>
  );
};

export default NatureDecorations;
