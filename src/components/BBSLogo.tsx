/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface BBSLogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
  textColor?: 'light' | 'dark';
}

/**
 * Official Bina Bangsa School Pictogram Logo (RGB-01).
 * Features the heraldic shield in Turquoise (#159899) and Dark Navy Blue (#031d3d),
 * the diagonal quartered field, center dark blue cross, open book with 培民,
 * and bold "BBS" letters.
 */
export const BBSLogo: React.FC<BBSLogoProps> = ({
  className = '',
  size = 48,
  showText = false,
  textColor = 'light',
}) => {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* Pictogram Shield Emblem */}
      <svg
        viewBox="0 0 500 500"
        width={size}
        height={size}
        className="shrink-0 drop-shadow-sm select-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <clipPath id="bbsShieldClip">
            <path d="M 95 65 L 405 65 L 405 285 C 405 380, 310 425, 250 445 C 190 425, 95 380, 95 285 Z" />
          </clipPath>
        </defs>

        {/* Shield Content clipped to boundary */}
        <g clipPath="url(#bbsShieldClip)">
          {/* Top-Left Quadrant: Turquoise */}
          <rect x="95" y="65" width="155" height="180" fill="#159899" />
          {/* Top-Right Quadrant: White */}
          <rect x="250" y="65" width="155" height="180" fill="#ffffff" />
          {/* Bottom-Left Quadrant: White */}
          <rect x="95" y="245" width="155" height="200" fill="#ffffff" />
          {/* Bottom-Right Quadrant: Turquoise */}
          <rect x="250" y="245" width="155" height="200" fill="#159899" />

          {/* Navy Cross */}
          {/* Horizontal Arm */}
          <rect x="95" y="175" width="310" height="70" fill="#031d3d" />
          {/* Vertical Arm */}
          <rect x="217" y="65" width="66" height="380" fill="#031d3d" />

          {/* "BBS" Serif Typography across bottom */}
          {/* Left 'B' (Dark Navy Blue) */}
          <text
            x="180"
            y="370"
            fontFamily="'Playfair Display', 'Times New Roman', Georgia, serif"
            fontSize="105"
            fontWeight="900"
            textAnchor="middle"
            fill="#031d3d"
            letterSpacing="-2"
          >
            B
          </text>

          {/* Center 'B' (White) on top of dark blue vertical cross */}
          <text
            x="250"
            y="370"
            fontFamily="'Playfair Display', 'Times New Roman', Georgia, serif"
            fontSize="105"
            fontWeight="900"
            textAnchor="middle"
            fill="#ffffff"
            letterSpacing="-2"
          >
            B
          </text>

          {/* Right 'S' (Dark Navy Blue) on top of turquoise */}
          <text
            x="316"
            y="370"
            fontFamily="'Playfair Display', 'Times New Roman', Georgia, serif"
            fontSize="105"
            fontWeight="900"
            textAnchor="middle"
            fill="#031d3d"
            letterSpacing="-2"
          >
            S
          </text>

          {/* Open Book in the center */}
          {/* Book dark navy backing outline */}
          <path
            d="M 248 150 L 165 130 L 165 242 L 248 260 L 252 260 L 335 242 L 335 130 L 252 150 Z"
            fill="#031d3d"
          />
          {/* Left White Page */}
          <path
            d="M 246 156 L 174 136 L 174 236 L 246 254 Z"
            fill="#ffffff"
          />
          {/* Right White Page */}
          <path
            d="M 254 156 L 326 136 L 326 236 L 254 254 Z"
            fill="#ffffff"
          />
          {/* Center Spine */}
          <line
            x1="250"
            y1="154"
            x2="250"
            y2="256"
            stroke="#031d3d"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* 培 on left page */}
          <text
            x="213"
            y="214"
            fontFamily="'Kaiti', 'STKaiti', 'KaiTi', 'Noto Serif SC', 'SimSun', 'Songti SC', 'PingFang SC', sans-serif"
            fontSize="34"
            fontWeight="bold"
            textAnchor="middle"
            fill="#031d3d"
          >
            培
          </text>

          {/* 民 on right page */}
          <text
            x="287"
            y="214"
            fontFamily="'Kaiti', 'STKaiti', 'KaiTi', 'Noto Serif SC', 'SimSun', 'Songti SC', 'PingFang SC', sans-serif"
            fontSize="34"
            fontWeight="bold"
            textAnchor="middle"
            fill="#031d3d"
          >
            民
          </text>
        </g>

        {/* Outer Turquoise Shield Frame */}
        <path
          d="M 95 65 L 405 65 L 405 285 C 405 380, 310 425, 250 445 C 190 425, 95 380, 95 285 Z"
          fill="none"
          stroke="#159899"
          strokeWidth="12"
          strokeLinejoin="round"
        />
      </svg>

      {/* Optional text lockup */}
      {showText && (
        <div className="flex flex-col">
          <span
            className={`font-serif font-bold text-base sm:text-lg lg:text-xl tracking-tight leading-tight ${
              textColor === 'light' ? 'text-white' : 'text-[#031d3d]'
            }`}
          >
            Bina Bangsa School
          </span>
          <span className="text-xs font-sans font-semibold tracking-wider text-cyan-400 uppercase">
            Pantai Indah Kapuk
          </span>
        </div>
      )}
    </div>
  );
};
