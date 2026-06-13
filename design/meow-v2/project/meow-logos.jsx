// meow-logos.jsx — app icon marks + wordmark lockups for "meow"
// All marks: dark glassy squircle, rainbow accent outline (ghost homage),
// purple→blue→pink inner glow (cloud homage). Sleek & premium.

// ---- shared defs (gradients + filters), injected once ----
function MeowDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        {/* rainbow accent stroke — green→cyan→blue→purple→pink */}
        <linearGradient id="mw-rainbow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#34d399" />
          <stop offset="0.26" stopColor="#22d3ee" />
          <stop offset="0.5" stopColor="#6366f1" />
          <stop offset="0.72" stopColor="#a855f7" />
          <stop offset="1" stopColor="#ec4899" />
        </linearGradient>

        {/* white glass interior (ghost-style) */}
        <radialGradient id="mw-glassWhite" cx="0.5" cy="0.28" r="0.95">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.55" stopColor="#f3f0ff" />
          <stop offset="1" stopColor="#d9d2f5" />
        </radialGradient>

        {/* colored glass interior (cloud-style glow) */}
        <radialGradient id="mw-glassColor" cx="0.42" cy="0.26" r="1.05">
          <stop offset="0" stopColor="#fbe3ff" />
          <stop offset="0.32" stopColor="#e9a9ff" />
          <stop offset="0.62" stopColor="#a855f7" />
          <stop offset="1" stopColor="#4f46e5" />
        </radialGradient>

        {/* dark squircle background */}
        <radialGradient id="mw-bg" cx="0.5" cy="0.36" r="0.9">
          <stop offset="0" stopColor="#1b1533" />
          <stop offset="0.55" stopColor="#0d0b18" />
          <stop offset="1" stopColor="#060509" />
        </radialGradient>

        {/* light squircle background */}
        <radialGradient id="mw-bgLight" cx="0.5" cy="0.32" r="0.95">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.6" stopColor="#f3eefe" />
          <stop offset="1" stopColor="#e4dcf6" />
        </radialGradient>

        {/* pink→purple, matched to the app wordmark */}
        <linearGradient id="mw-pinkPurple" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f472b6" />
          <stop offset="0.5" stopColor="#d946ef" />
          <stop offset="1" stopColor="#a855f7" />
        </linearGradient>

        {/* soft purple aura behind mascot */}
        <radialGradient id="mw-aura" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#a855f7" stopOpacity="0.55" />
          <stop offset="0.6" stopColor="#6d28d9" stopOpacity="0.18" />
          <stop offset="1" stopColor="#6d28d9" stopOpacity="0" />
        </radialGradient>

        {/* glass rim sheen */}
        <linearGradient id="mw-rim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="0.18" stopColor="#ffffff" stopOpacity="0.12" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        <filter id="mw-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="26" />
        </filter>
        <filter id="mw-soft" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>
    </svg>
  );
}

// ---- squircle shell ----
function Shell({ children, aura = true, tone = 'dark' }) {
  const bg = tone === 'light' ? 'url(#mw-bgLight)' : 'url(#mw-bg)';
  return (
    <svg viewBox="0 0 1024 1024" width="100%" height="100%" style={{ display: 'block' }}>
      <rect x="6" y="6" width="1012" height="1012" rx="236" fill={bg} />
      {aura && tone === 'dark' && <ellipse cx="512" cy="540" rx="360" ry="360" fill="url(#mw-aura)" />}
      {/* mascot space: drawn in 0..200, scaled into center */}
      <g transform="translate(206 214) scale(3.05)">{children}</g>
      {/* glass rim + top sheen */}
      <rect x="6" y="6" width="1012" height="1012" rx="236" fill="none"
        stroke="url(#mw-rim)" strokeWidth="3" opacity={tone === 'light' ? 0.4 : 0.9} />
      {tone === 'dark' && <rect x="22" y="20" width="980" height="430" rx="220" fill="url(#mw-rim)" opacity="0.06" />}
    </svg>
  );
}

// rainbow-stroked + glowing mascot wrapper
function Glowed({ d, fill, sw = 11 }) {
  return (
    <g>
      <path d={d} fill="none" stroke="url(#mw-rainbow)" strokeWidth={sw + 6}
        strokeLinejoin="round" strokeLinecap="round" filter="url(#mw-glow)" opacity="0.7" />
      <path d={d} fill={fill} stroke="none" />
      <path d={d} fill="none" stroke="url(#mw-rainbow)" strokeWidth={sw}
        strokeLinejoin="round" strokeLinecap="round" />
    </g>
  );
}

// =================== MARKS ===================

// helper: regular scalloped bottom (ghost wave), right→left
function scallop(xR, xL, y, n, depth) {
  const w = (xR - xL) / n;
  let d = '';
  for (let i = 0; i < n; i++) {
    const xs = xR - i * w, xe = xs - w;
    d += ` C ${xs} ${y + depth} ${xe} ${y + depth} ${xe} ${y}`;
  }
  return d;
}

const CAT_HEAD =
  'M50 72 C44 34 47 24 58 22 C73 31 83 46 89 59 C93 57 107 57 111 59 ' +
  'C117 46 127 31 142 22 C153 24 156 34 150 72 C169 86 176 106 173 129 ' +
  'C169 163 138 183 100 183 C62 183 31 163 27 129 C24 106 31 86 50 72 Z';

// 1 — Cat face silhouette, colored glass
function MarkCatFace() {
  return (
    <Shell>
      <Glowed d={CAT_HEAD} fill="url(#mw-glassColor)" />
    </Shell>
  );
}

// 2 — Cat + chat bubble
const BUBBLE =
  'M40 96 C40 76 41 70 45 64 L47 28 C47 23 52 21 56 25 L86 52 ' +
  'C93 50 107 50 114 52 L144 25 C148 21 153 23 153 28 L155 64 ' +
  'C159 70 160 76 160 96 L160 118 C160 137 149 149 129 150 L96 150 ' +
  'L64 181 L78 149 C57 147 40 136 40 118 Z';
function MarkChat() {
  return (
    <Shell>
      <Glowed d={BUBBLE} fill="url(#mw-glassColor)" />
    </Shell>
  );
}

// 3 — Abstract cat-ear glyph (sleek, no fill)
const GLYPH =
  'M38 132 C38 84 43 72 52 28 C53 23 59 23 63 31 C73 53 85 66 100 66 ' +
  'C115 66 127 53 137 31 C141 23 147 23 148 28 C157 72 162 84 162 132';

// flexible glyph icon — used for the chosen direction's refinement
function GlyphIcon({ sw = 11, stroke = 'url(#mw-rainbow)', glow = true, tone = 'dark', aura = true }) {
  return (
    <Shell tone={tone} aura={aura}>
      <g>
        {glow &&
          <path d={GLYPH} fill="none" stroke={stroke} strokeWidth={sw + 6}
            strokeLinejoin="round" strokeLinecap="round" filter="url(#mw-glow)" opacity="0.7" />}
        <path d={GLYPH} fill="none" stroke={stroke} strokeWidth={sw}
          strokeLinejoin="round" strokeLinecap="round" />
      </g>
    </Shell>
  );
}

function MarkGlyph() {
  return <GlyphIcon sw={11} />;
}

// 4 — Cat-ghost outline (closest ghost homage, white glass)
const GHOST =
  'M46 70 C44 36 48 24 58 22 C72 30 82 45 88 58 C93 56 107 56 112 58 ' +
  'C118 45 128 30 142 22 C152 24 156 36 154 70 C166 84 172 104 172 124' +
  ' L172 156' + scallop(172, 28, 156, 4, 20) + ' L28 124 C28 104 34 84 46 70 Z';
function MarkGhost() {
  return (
    <Shell>
      <Glowed d={GHOST} fill="url(#mw-glassWhite)" />
    </Shell>
  );
}

// 5 — Glassy volumetric blob cat (most 3D / cloud-like)
function MarkBlob() {
  return (
    <Shell>
      {/* big soft glow body */}
      <g filter="url(#mw-soft)">
        <path d={CAT_HEAD} fill="url(#mw-glassColor)" opacity="0.55"
          transform="translate(100 102) scale(1.16) translate(-100 -102)" />
      </g>
      <path d={CAT_HEAD} fill="url(#mw-glassColor)" />
      {/* glossy top highlight */}
      <ellipse cx="86" cy="86" rx="40" ry="26" fill="#fff" opacity="0.32" filter="url(#mw-soft)" />
      <path d={CAT_HEAD} fill="none" stroke="url(#mw-rainbow)" strokeWidth="6"
        strokeLinejoin="round" opacity="0.92" />
    </Shell>
  );
}

// =================== WORDMARK ===================
function Wordmark({ size = 64 }) {
  return (
    <span style={{
      fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: size,
      letterSpacing: '-0.02em', lineHeight: 1,
      background: 'linear-gradient(95deg,#f472b6 0%,#d946ef 45%,#a855f7 100%)',
      WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
    }}>meow</span>
  );
}

function IconBox({ children }) {
  return (
    <div style={{ width: '76%', aspectRatio: '1', filter: 'drop-shadow(0 24px 48px rgba(80,30,160,0.35))' }}>
      {children}
    </div>
  );
}

Object.assign(window, {
  MeowDefs, Shell, Glowed, Wordmark, IconBox, GlyphIcon, GLYPH,
  MarkCatFace, MarkChat, MarkGlyph, MarkGhost, MarkBlob,
});
