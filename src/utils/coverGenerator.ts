/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Generates an SVG Data URL representing a luxurious school yearbook hardcover
 * for Bina Bangsa School-Pantai Indah Kapuk with rich typography, embossed borders,
 * school seal, and the official color palette (Dark Blue, Yellow, White, and Turquoise).
 */
export function generateCoverSvgDataUrl(
  year: string,
  title: string,
  themeColor: 'darkBlue' | 'turquoise' | 'navyYellow' | 'midnight' | 'whiteGold' | 'royal' = 'darkBlue'
): string {
  const colorMap = {
    darkBlue: {
      bg1: '#071630',
      bg2: '#020b18',
      spine: '#030d1d',
      accent: '#00c4cc',      // Turquoise accent
      foil: '#facc15',        // School Yellow / Gold
      textMuted: '#93c5fd',   // Light ice blue / white
      crest: '#ffffff',       // White
      badgeBorder: '#00c4cc',
    },
    turquoise: {
      bg1: '#0e4e59',
      bg2: '#06282e',
      spine: '#052126',
      accent: '#facc15',      // Yellow accent
      foil: '#2dd4bf',        // Bright Turquoise
      textMuted: '#ccfbf1',
      crest: '#ffffff',
      badgeBorder: '#facc15',
    },
    navyYellow: {
      bg1: '#0a1931',
      bg2: '#000b1a',
      spine: '#040d1c',
      accent: '#facc15',      // Yellow
      foil: '#ffd000',
      textMuted: '#e2e8f0',   // White
      crest: '#38bdf8',       // Turquoise
      badgeBorder: '#ffd000',
    },
    midnight: {
      bg1: '#081a3a',
      bg2: '#030c1c',
      spine: '#040f24',
      accent: '#38bdf8',      // Turquoise-sky
      foil: '#fde047',        // Bright Yellow
      textMuted: '#cbd5e1',   // White
      crest: '#ffffff',
      badgeBorder: '#38bdf8',
    },
    whiteGold: {
      bg1: '#112240',
      bg2: '#0a1931',
      spine: '#071428',
      accent: '#00c4cc',      // Turquoise
      foil: '#facc15',        // Yellow
      textMuted: '#f8fafc',   // Crisp White
      crest: '#ffffff',
      badgeBorder: '#00c4cc',
    },
    royal: {
      bg1: '#0d2552',
      bg2: '#05122b',
      spine: '#071636',
      accent: '#2dd4bf',      // Turquoise
      foil: '#facc15',        // Yellow
      textMuted: '#e0f2fe',
      crest: '#ffffff',
      badgeBorder: '#2dd4bf',
    },
  };

  const scheme = colorMap[themeColor] || colorMap.darkBlue;
  const safeYear = escapeXml(year);
  const safeTitle = escapeXml(title);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400" width="100%" height="100%">
    <defs>
      <linearGradient id="bbsBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${scheme.bg1}" />
        <stop offset="60%" stop-color="${scheme.bg2}" />
        <stop offset="100%" stop-color="#020712" />
      </linearGradient>
      <linearGradient id="bbsFoilGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95" />
        <stop offset="25%" stop-color="${scheme.foil}" />
        <stop offset="70%" stop-color="${scheme.accent}" />
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0.85" />
      </linearGradient>
      <linearGradient id="bbsSpineShadow" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#000000" stop-opacity="0.75" />
        <stop offset="25%" stop-color="#000000" stop-opacity="0.5" />
        <stop offset="85%" stop-color="#ffffff" stop-opacity="0.12" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0.6" />
      </linearGradient>
      <radialGradient id="bbsVignette" cx="50%" cy="50%" r="70%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.06" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0.7" />
      </radialGradient>
      <pattern id="bbsGrain" width="40" height="40" patternUnits="userSpaceOnUse">
        <circle cx="10" cy="10" r="0.8" fill="${scheme.foil}" opacity="0.1" />
        <circle cx="30" cy="25" r="0.8" fill="${scheme.accent}" opacity="0.08" />
        <circle cx="20" cy="35" r="0.6" fill="#ffffff" opacity="0.08" />
      </pattern>
    </defs>

    <!-- Landscape Hardcover Background -->
    <rect width="640" height="400" rx="10" fill="url(#bbsBgGrad)" />
    <rect width="640" height="400" rx="10" fill="url(#bbsGrain)" />
    <rect width="640" height="400" rx="10" fill="url(#bbsVignette)" />

    <!-- Left Album Spine Binding & Stitching -->
    <rect x="0" y="0" width="36" height="400" fill="url(#bbsSpineShadow)" />
    <line x1="34" y1="0" x2="34" y2="400" stroke="#000000" stroke-width="2.5" opacity="0.5" />
    <line x1="36" y1="0" x2="36" y2="400" stroke="${scheme.foil}" stroke-width="1" opacity="0.3" />

    <!-- Album Spine Rivets / Binding Accents -->
    <circle cx="18" cy="40" r="3.5" fill="${scheme.foil}" stroke="#000" stroke-width="1" opacity="0.85" />
    <circle cx="18" cy="120" r="3.5" fill="${scheme.foil}" stroke="#000" stroke-width="1" opacity="0.85" />
    <circle cx="18" cy="200" r="3.5" fill="${scheme.foil}" stroke="#000" stroke-width="1" opacity="0.85" />
    <circle cx="18" cy="280" r="3.5" fill="${scheme.foil}" stroke="#000" stroke-width="1" opacity="0.85" />
    <circle cx="18" cy="360" r="3.5" fill="${scheme.foil}" stroke="#000" stroke-width="1" opacity="0.85" />

    <!-- Right Page Gilded Edge Preview -->
    <rect x="634" y="8" width="6" height="384" rx="2" fill="#d4af37" opacity="0.75" />
    <line x1="636" y1="12" x2="636" y2="388" stroke="#ffffff" stroke-width="0.8" opacity="0.4" />

    <!-- Outer Decorative Border (Embossed Yellow Gold & Turquoise Frame) -->
    <rect x="50" y="22" width="570" height="356" rx="6" fill="none" stroke="url(#bbsFoilGrad)" stroke-width="2.2" opacity="0.9" />
    <rect x="56" y="28" width="558" height="344" rx="4" fill="none" stroke="${scheme.accent}" stroke-width="1" stroke-dasharray="3,3" opacity="0.65" />

    <!-- Corner Ornaments -->
    <g stroke="url(#bbsFoilGrad)" stroke-width="1.8" fill="none" opacity="0.95">
      <path d="M 60 40 L 78 40 M 60 40 L 60 58" />
      <path d="M 610 40 L 592 40 M 610 40 L 610 58" />
      <path d="M 60 360 L 78 360 M 60 360 L 60 342" />
      <path d="M 610 360 L 592 360 M 610 360 L 610 342" />
    </g>

    <!-- Left: Official BBS Pictogram Heraldic Crest Emblem -->
    <g transform="translate(145, 185) scale(0.24)">
      <defs>
        <clipPath id="coverShieldClip">
          <path d="M -155 -190 L 155 -190 L 155 30 C 155 125, 60 170, 0 190 C -60 170, -155 125, -155 30 Z" />
        </clipPath>
      </defs>

      <!-- Shield Background and Cross -->
      <g clip-path="url(#coverShieldClip)">
        <rect x="-155" y="-190" width="155" height="180" fill="#159899" />
        <rect x="0" y="-190" width="155" height="180" fill="#ffffff" />
        <rect x="-155" y="-10" width="155" height="200" fill="#ffffff" />
        <rect x="0" y="-10" width="155" height="200" fill="#159899" />

        <rect x="-155" y="-80" width="310" height="70" fill="#031d3d" />
        <rect x="-33" y="-190" width="66" height="380" fill="#031d3d" />

        <text x="-70" y="115" font-family="'Playfair Display', Georgia, serif" font-size="105" font-weight="900" text-anchor="middle" fill="#031d3d">B</text>
        <text x="0" y="115" font-family="'Playfair Display', Georgia, serif" font-size="105" font-weight="900" text-anchor="middle" fill="#ffffff">B</text>
        <text x="66" y="115" font-family="'Playfair Display', Georgia, serif" font-size="105" font-weight="900" text-anchor="middle" fill="#031d3d">S</text>

        <path d="M -2 -105 L -85 -125 L -85 -13 L -2 5 L 2 5 L 85 -13 L 85 -125 L 2 -105 Z" fill="#031d3d" />
        <path d="M -4 -99 L -76 -119 L -76 -19 L -4 -1 Z" fill="#ffffff" />
        <path d="M 4 -99 L 76 -119 L 76 -19 L 4 -1 Z" fill="#ffffff" />
        <line x1="0" y1="-101" x2="0" y2="1" stroke="#031d3d" stroke-width="2.5" />

        <text x="-37" y="-41" font-family="'Kaiti', 'STKaiti', 'KaiTi', 'Noto Serif SC', 'SimSun', serif" font-size="34" font-weight="bold" text-anchor="middle" fill="#031d3d">培</text>
        <text x="37" y="-41" font-family="'Kaiti', 'STKaiti', 'KaiTi', 'Noto Serif SC', 'SimSun', serif" font-size="34" font-weight="bold" text-anchor="middle" fill="#031d3d">民</text>
      </g>

      <path d="M -155 -190 L 155 -190 L 155 30 C 155 125, 60 170, 0 190 C -60 170, -155 125, -155 30 Z" fill="none" stroke="#159899" stroke-width="12" stroke-linejoin="round" />
    </g>

    <!-- Vertical separator line between crest and title info -->
    <line x1="225" y1="50" x2="225" y2="350" stroke="url(#bbsFoilGrad)" stroke-width="1.2" opacity="0.4" />
    <circle cx="225" cy="200" r="3" fill="${scheme.foil}" />

    <!-- Right: School Header Text -->
    <g transform="translate(245, 0)">
      <text x="0" y="70" font-family="'Cinzel', Georgia, serif" font-size="14" font-weight="800" letter-spacing="3" fill="#ffffff">
        BINA BANGSA SCHOOL
      </text>
      <text x="0" y="88" font-family="'Inter', sans-serif" font-size="10" font-weight="700" letter-spacing="2.5" fill="${scheme.accent}">
        PANTAI INDAH KAPUK CAMPUS
      </text>
      <text x="0" y="103" font-family="'Inter', sans-serif" font-size="8.5" font-weight="600" letter-spacing="1.5" fill="${scheme.foil}" opacity="0.9">
        COMMEMORATIVE YEARBOOK ALBUM
      </text>

      <!-- Center Academic Year Badge in Landscape -->
      <g transform="translate(0, 125)">
        <rect x="0" y="0" width="160" height="32" rx="16" fill="${scheme.bg1}" stroke="url(#bbsFoilGrad)" stroke-width="1.8" />
        <text x="80" y="21" text-anchor="middle" font-family="'Cinzel', Georgia, serif" font-size="16" font-weight="800" letter-spacing="2" fill="${scheme.foil}">
          ${safeYear}
        </text>
      </g>

      <!-- Main Album Title -->
      <text x="0" y="205" font-family="'Playfair Display', Georgia, serif" font-size="24" font-weight="800" fill="#ffffff" letter-spacing="0.5">
        ${truncateText(safeTitle, 28)}
      </text>

      <!-- Subtitle / Edition -->
      <text x="0" y="232" font-family="'Inter', sans-serif" font-size="10" font-weight="700" letter-spacing="3" fill="${scheme.accent}">
        OFFICIAL CERTIFIED ARCHIVE
      </text>

      <line x1="0" y1="250" x2="330" y2="250" stroke="url(#bbsFoilGrad)" stroke-width="1.2" opacity="0.75" />

      <!-- Bottom School Motto & Archival Badge -->
      <text x="0" y="285" font-family="'Playfair Display', Georgia, italic" font-size="12" font-weight="600" fill="#ffffff">
        "Gloria Dei Vivens Homo"
      </text>
      <text x="0" y="305" font-family="'Inter', sans-serif" font-size="9" letter-spacing="2" font-weight="600" fill="${scheme.accent}">
        HISTORICAL RECOLLECTION & STUDENT PORTFOLIO
      </text>
      <text x="0" y="322" font-family="'Inter', sans-serif" font-size="8.5" letter-spacing="1.5" font-weight="500" fill="#93c5fd" opacity="0.8">
        JAKARTA UTARA, INDONESIA
      </text>
    </g>
  </svg>`;

  try {
    if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
      const base64 = window.btoa(unescape(encodeURIComponent(svg)));
      return `data:image/svg+xml;base64,${base64}`;
    }
  } catch {
    // Fallback if btoa fails
  }

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function truncateText(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.substring(0, maxLen - 1) + '…';
}
