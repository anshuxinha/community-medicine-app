const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

const colorFreq = {};
const colorLocations = {};

walkDir('./src', function (filePath) {
    if (!filePath.match(/\.(js|jsx|ts|tsx)$/)) return;
    const content = fs.readFileSync(filePath, 'utf8');
    const regex = /#([a-fA-F0-9]{3,8})\b/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
        let hex = match[1].toUpperCase();
        // Normalize 3-char hex to 6-char
        if (hex.length === 3) {
            hex = hex.split('').map(c => c + c).join('');
        }
        const color = '#' + hex;
        colorFreq[color] = (colorFreq[color] || 0) + 1;

        if (!colorLocations[color]) colorLocations[color] = new Set();
        colorLocations[color].add(path.basename(filePath));
    }
});

const sortedColors = Object.entries(colorFreq).sort((a, b) => b[1] - a[1]);
console.log("=== COLOR USAGE FREQUENCY ===");
for (const [color, freq] of sortedColors) {
    const files = Array.from(colorLocations[color]);
    console.log(`${color}: ${freq} uses (Files: ${files.slice(0, 3).join(', ')}${files.length > 3 ? ', ...' : ''})`);
}

// Simple contrast check utility for manual audit
function getRelativeLuminance(r, g, b) {
    const [rsrgb, gsrgb, bsrgb] = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rsrgb + 0.7152 * gsrgb + 0.0722 * bsrgb;
}

function hexToRgb(hex) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 8) hex = hex.substring(0, 6);
    const num = parseInt(hex, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function getContrastRatio(hex1, hex2) {
    const rgb1 = hexToRgb(hex1);
    const rgb2 = hexToRgb(hex2);
    const l1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
    const l2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return ((lighter + 0.05) / (darker + 0.05)).toFixed(2);
}

// Common comparisons seen in the code:
console.log("\n=== COMMONLY SEEN CONTRAST RATIOS ===");
const pairs = [
    ['#111827', '#FFFFFF'],
    ['#6B7280', '#FFFFFF'],
    ['#9CA3AF', '#FFFFFF'],
    ['#8A2BE2', '#FFFFFF'],
    ['#FFFFFF', '#8A2BE2'],
    ['#374151', '#F3F4F6'],
    ['#6B21A8', '#EDE9FE'],
    ['#92400E', '#FFFBEB'],
    ['#6B7280', '#F3F4F6'], // Often failing contrast
];

for (const [fg, bg] of pairs) {
    const ratio = getContrastRatio(fg, bg);
    const pass = ratio >= 4.5 ? 'PASS' : 'FAIL';
    console.log(`Contrast ${fg} on ${bg}: ${ratio}:1 -> ${pass}`);
}
