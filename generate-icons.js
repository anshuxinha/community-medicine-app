/**
 * generate-icons.js
 * Generates icon.png (1024x1024), adaptive-icon.png (1024x1024),
 * and splash.png (1284x2778) for the STROMA app.
 * 
 * Run: node generate-icons.js
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function drawS(ctx, size) {
    const cx = size / 2;
    const s = size / 512; // scale factor

    // Background
    ctx.fillStyle = '#0D1B2A';
    ctx.fillRect(0, 0, size, size);

    // Gradient
    const grad = ctx.createLinearGradient(cx - 150 * s, 80 * s, cx + 150 * s, size - 80 * s);
    grad.addColorStop(0, '#C084FC');
    grad.addColorStop(0.5, '#9333EA');
    grad.addColorStop(1, '#7C3AED');

    // Glow effect — draw a slightly wider, blurred version
    ctx.save();
    ctx.shadowColor = '#A855F7';
    ctx.shadowBlur = 30 * s;

    // Main S tube (stethoscope)
    ctx.strokeStyle = grad;
    ctx.lineWidth = 58 * s;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    // Start top-right curve (top of S)
    ctx.moveTo(cx + 110 * s, 145 * s);
    ctx.bezierCurveTo(cx + 110 * s, 85 * s, cx + 50 * s, 60 * s, cx, 72 * s);
    ctx.bezierCurveTo(cx - 80 * s, 88 * s, cx - 110 * s, 138 * s, cx - 95 * s, 188 * s);
    ctx.bezierCurveTo(cx - 78 * s, 232 * s, cx - 28 * s, 252 * s, cx, 260 * s);
    ctx.bezierCurveTo(cx + 28 * s, 268 * s, cx + 95 * s, 292 * s, cx + 95 * s, 345 * s);
    ctx.bezierCurveTo(cx + 95 * s, 398 * s, cx + 55 * s, 440 * s, cx, 440 * s);
    ctx.bezierCurveTo(cx - 65 * s, 440 * s, cx - 110 * s, 400 * s, cx - 110 * s, 368 * s);
    ctx.stroke();

    // Earpiece dot — top right of S
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx + 110 * s, 115 * s, 34 * s, 0, Math.PI * 2);
    ctx.fill();

    // Diaphragm (hollow ring) — bottom left of S
    ctx.beginPath();
    ctx.arc(cx - 110 * s, 380 * s, 48 * s, 0, Math.PI * 2);
    ctx.fill();

    // Hollow center of diaphragm
    ctx.fillStyle = '#0D1B2A';
    ctx.beginPath();
    ctx.arc(cx - 110 * s, 380 * s, 27 * s, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function generateIcon(filename, width, height, drawFn) {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    drawFn(ctx, width, height);
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(filename, buffer);
    console.log(`✅ Generated: ${filename} (${width}x${height})`);
}

// ── icon.png (1024x1024) ─────────────────────────────────
generateIcon(
    path.join(__dirname, 'assets', 'icon.png'),
    1024, 1024,
    (ctx, size) => drawS(ctx, size)
);

// ── adaptive-icon.png (1024x1024 with safe zone padding) ─
generateIcon(
    path.join(__dirname, 'assets', 'adaptive-icon.png'),
    1024, 1024,
    (ctx, size) => {
        // Android adaptive icon: keep artwork in center 72% (safe zone)
        ctx.fillStyle = '#0D1B2A';
        ctx.fillRect(0, 0, size, size);
        ctx.save();
        const pad = size * 0.14;
        ctx.translate(pad, pad);
        ctx.scale(0.72, 0.72);
        drawS(ctx, size);
        ctx.restore();
    }
);

// ── splash.png (1284x2778 — iPhone 14 Pro Max, works for all) ──
generateIcon(
    path.join(__dirname, 'assets', 'splash.png'),
    1284, 2778,
    (ctx, w, h) => {
        ctx.fillStyle = '#0D1B2A';
        ctx.fillRect(0, 0, w, h);

        // Draw S icon centered (icon size = 400px natural size)
        const iconSize = 400;
        ctx.save();
        ctx.translate((w - iconSize) / 2, (h / 2) - iconSize * 0.6);
        drawS(ctx, iconSize);
        ctx.restore();

        // App name below icon
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 90px sans-serif';
        ctx.textAlign = 'center';
        ctx.letterSpacing = '12px';
        ctx.fillText('STROMA', w / 2, h / 2 + 80);

        // Tagline
        ctx.fillStyle = '#9CA3AF';
        ctx.font = '40px sans-serif';
        ctx.fillText('Community Medicine', w / 2, h / 2 + 150);
    }
);

console.log('\n🎉 All icons generated successfully!\n');
