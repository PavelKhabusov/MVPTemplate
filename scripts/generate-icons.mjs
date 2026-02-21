import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const assetsDir = path.join(__dirname, '..', 'apps', 'mobile', 'assets')

// Abstract tech-style design: overlapping circles with gradient feel
// Using SVG with radial/linear gradients

function createAppIconSVG(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f0c29"/>
      <stop offset="50%" style="stop-color:#302b63"/>
      <stop offset="100%" style="stop-color:#24243e"/>
    </linearGradient>
    <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea"/>
      <stop offset="100%" style="stop-color:#764ba2"/>
    </linearGradient>
    <linearGradient id="g2" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#f093fb"/>
      <stop offset="100%" style="stop-color:#f5576c"/>
    </linearGradient>
    <linearGradient id="g3" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#4facfe"/>
      <stop offset="100%" style="stop-color:#00f2fe"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="1024" height="1024" rx="224" fill="url(#bg)"/>
  <!-- Large circle bottom-right -->
  <circle cx="620" cy="600" r="280" fill="url(#g1)" opacity="0.85"/>
  <!-- Medium circle top-left -->
  <circle cx="400" cy="380" r="240" fill="url(#g2)" opacity="0.7"/>
  <!-- Small circle center-top -->
  <circle cx="540" cy="300" r="160" fill="url(#g3)" opacity="0.6"/>
  <!-- Intersection highlight -->
  <circle cx="500" cy="470" r="120" fill="white" opacity="0.12"/>
  <!-- Tiny accent dot -->
  <circle cx="380" cy="560" r="60" fill="white" opacity="0.08"/>
  <!-- Abstract line -->
  <line x1="280" y1="720" x2="744" y2="280" stroke="white" stroke-width="3" opacity="0.15"/>
  <line x1="300" y1="730" x2="764" y2="290" stroke="white" stroke-width="1.5" opacity="0.1"/>
</svg>`
}

function createAdaptiveIconSVG(size) {
  // Adaptive icon needs more padding (safe zone is inner 66%)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f0c29"/>
      <stop offset="50%" style="stop-color:#302b63"/>
      <stop offset="100%" style="stop-color:#24243e"/>
    </linearGradient>
    <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea"/>
      <stop offset="100%" style="stop-color:#764ba2"/>
    </linearGradient>
    <linearGradient id="g2" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#f093fb"/>
      <stop offset="100%" style="stop-color:#f5576c"/>
    </linearGradient>
    <linearGradient id="g3" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#4facfe"/>
      <stop offset="100%" style="stop-color:#00f2fe"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <!-- Centered and padded for adaptive icon safe zone -->
  <circle cx="580" cy="560" r="220" fill="url(#g1)" opacity="0.85"/>
  <circle cx="430" cy="430" r="190" fill="url(#g2)" opacity="0.7"/>
  <circle cx="520" cy="370" r="130" fill="url(#g3)" opacity="0.6"/>
  <circle cx="490" cy="480" r="95" fill="white" opacity="0.12"/>
  <circle cx="400" cy="540" r="50" fill="white" opacity="0.08"/>
  <line x1="330" y1="660" x2="694" y2="340" stroke="white" stroke-width="3" opacity="0.15"/>
</svg>`
}

function createSplashIconSVG(size) {
  // Just the abstract shapes on transparent background (no rounded rect)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea"/>
      <stop offset="100%" style="stop-color:#764ba2"/>
    </linearGradient>
    <linearGradient id="g2" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#f093fb"/>
      <stop offset="100%" style="stop-color:#f5576c"/>
    </linearGradient>
    <linearGradient id="g3" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#4facfe"/>
      <stop offset="100%" style="stop-color:#00f2fe"/>
    </linearGradient>
  </defs>
  <circle cx="310" cy="300" r="140" fill="url(#g1)" opacity="0.9"/>
  <circle cx="200" cy="190" r="120" fill="url(#g2)" opacity="0.75"/>
  <circle cx="270" cy="150" r="80" fill="url(#g3)" opacity="0.65"/>
  <circle cx="250" cy="235" r="60" fill="white" opacity="0.15"/>
  <line x1="140" y1="360" x2="372" y2="140" stroke="url(#g1)" stroke-width="3" opacity="0.3"/>
</svg>`
}

function createFaviconSVG(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 48 48">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f0c29"/>
      <stop offset="50%" style="stop-color:#302b63"/>
      <stop offset="100%" style="stop-color:#24243e"/>
    </linearGradient>
    <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea"/>
      <stop offset="100%" style="stop-color:#764ba2"/>
    </linearGradient>
    <linearGradient id="g2" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#f093fb"/>
      <stop offset="100%" style="stop-color:#f5576c"/>
    </linearGradient>
    <linearGradient id="g3" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#4facfe"/>
      <stop offset="100%" style="stop-color:#00f2fe"/>
    </linearGradient>
  </defs>
  <rect width="48" height="48" rx="10" fill="url(#bg)"/>
  <circle cx="29" cy="28" r="13" fill="url(#g1)" opacity="0.85"/>
  <circle cx="19" cy="18" r="11" fill="url(#g2)" opacity="0.7"/>
  <circle cx="25" cy="14" r="7.5" fill="url(#g3)" opacity="0.6"/>
</svg>`
}

async function generate() {
  const icons = [
    { name: 'icon.png', svg: createAppIconSVG(1024), size: 1024 },
    { name: 'adaptive-icon.png', svg: createAdaptiveIconSVG(1024), size: 1024 },
    { name: 'splash-icon.png', svg: createSplashIconSVG(512), size: 512 },
    { name: 'favicon.png', svg: createFaviconSVG(48), size: 48 },
  ]

  for (const { name, svg, size } of icons) {
    const outPath = path.join(assetsDir, name)
    await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toFile(outPath)
    console.log(`✓ ${name} (${size}x${size})`)
  }

  console.log('\nAll icons generated in apps/mobile/assets/')
}

generate().catch(console.error)
