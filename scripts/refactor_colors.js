const fs = require('fs');
const path = require('path');

// Hex -> theme token (semantic). Expand as audit finds more.
const CM_TO_THEME = {
    '#6B21A8': 'theme.colors.primary',
    '#EDE9FE': 'theme.colors.primaryLight',
    '#F3E8FF': 'theme.colors.primarySoft',
    '#F3F0FF': 'theme.colors.primarySoft',
    '#DDD6FE': 'theme.colors.primaryMuted',
    '#581C87': 'theme.colors.primaryDark',
    '#8A2BE2': 'theme.colors.secondary',
    '#A855F7': 'theme.colors.secondary',
    '#9333EA': 'theme.colors.secondary',
    '#7C3AED': 'theme.colors.secondary',
    '#D97706': 'theme.colors.accent',
    '#FBFCFE': 'theme.colors.backgroundMain',
    '#FFFFFF': 'theme.colors.surfacePrimary',
    '#FFF': 'theme.colors.surfacePrimary',
    '#F3F4F6': 'theme.colors.surfaceSecondary',
    '#F9FAFB': 'theme.colors.surfaceTertiary',
    '#F8FAFC': 'theme.colors.surfaceMuted',
    '#EEF2F7': 'theme.colors.surfaceMuted',
    '#E5E7EB': 'theme.colors.border',
    '#D1D5DB': 'theme.colors.borderStrong',
    '#4CAF50': 'theme.colors.success',
    '#15803D': 'theme.colors.successStrong',
    '#047857': 'theme.colors.successStrong',
    '#166534': 'theme.colors.successStrong',
    '#065F46': 'theme.colors.successStrong',
    '#DCFCE7': 'theme.colors.successSoft',
    '#F59E0B': 'theme.colors.warning',
    '#FFFBEB': 'theme.colors.warningBackground',
    '#FEF3C7': 'theme.colors.warningBackground',
    '#92400E': 'theme.colors.warningText',
    '#B45309': 'theme.colors.warningStrong',
    '#EF4444': 'theme.colors.error',
    '#FEE2E2': 'theme.colors.errorLight',
    '#B91C1C': 'theme.colors.errorStrong',
    '#991B1B': 'theme.colors.errorStrong',
    '#111827': 'theme.colors.textTitle',
    '#1F2937': 'theme.colors.textPrimary',
    '#374151': 'theme.colors.textBody',
    '#4B5563': 'theme.colors.textSecondary',
    '#6B7280': 'theme.colors.textTertiary',
    '#9CA3AF': 'theme.colors.textPlaceholder',
    '#64748B': 'theme.colors.textTertiary',
    '#334155': 'theme.colors.textBody',
    '#5F6368': 'theme.colors.textTertiary',
    '#202124': 'theme.colors.textTitle',
    '#3B82F6': 'theme.colors.chartBlue',
    '#60A5FA': 'theme.colors.chartBlue',
    '#1D4ED8': 'theme.colors.chartBlue',
    '#10B981': 'theme.colors.chartGreen',
    '#8B5CF6': 'theme.colors.chartPurple',
    '#D4A853': 'theme.colors.highlightBorder',
    '#FDFAF3': 'theme.colors.highlightBg',
    '#FEF9C3': 'theme.colors.userHighlightBg',
    '#FEF08A': 'theme.colors.userHighlightSentence',
    '#FDE68A': 'theme.colors.userHighlightSentence',
    // Fallbacks
    '#1C1B1F': 'theme.colors.textTitle',
    '#0D1B2A': 'theme.colors.inverseSurface',
    '#F5F3FF': 'theme.colors.primaryLight',
    '#C4B5FD': 'theme.colors.primaryMuted',
    '#6750A4': 'theme.colors.primary',
    '#E9D5FF': 'theme.colors.primaryLight',
    '#F5F7FA': 'theme.colors.surfaceSecondary',
    '#F8F9FA': 'theme.colors.surfaceTertiary',
    '#333333': 'theme.colors.textPrimary',
    '#6D28D9': 'theme.colors.primary',
    '#EA4335': 'theme.colors.error',
    '#E0E7FF': 'theme.colors.primaryLight',
    '#FAFAFF': 'theme.colors.surfaceTertiary',
    '#49454F': 'theme.colors.textSecondary',
    '#666666': 'theme.colors.textTertiary',
};

const normalizedCTM = {};
for (const [k, v] of Object.entries(CM_TO_THEME)) {
    normalizedCTM[k.toLowerCase()] = v;
}

function normalizeHex(hex) {
    hex = hex.toLowerCase();
    if (hex.length === 4) {
        hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    }
    return hex;
}

const SKIP = new Set(['theme.js', 'ThemeContext.js']);

function processFile(filePath) {
    if (!filePath.match(/\.(js|jsx|ts|tsx)$/)) return;
    if (SKIP.has(path.basename(filePath))) return;
    // Skip data dumps / tests with content colors
    if (filePath.includes(`${path.sep}data${path.sep}`)) return;
    if (filePath.includes('__tests__')) return;

    let content = fs.readFileSync(filePath, 'utf8');
    let modifications = 0;

    const regex = /['"]#(?:[0-9a-fA-F]{3,8})['"]/g;

    content = content.replace(regex, (match) => {
        const hexMatch = match.replace(/['"]/g, '');
        const normHex = normalizeHex(hexMatch);
        const token = normalizedCTM[normHex];
        if (token) {
            modifications++;
            return token;
        }
        return match;
    });

    if (modifications > 0) {
        const themePath = path.resolve(__dirname, '../src/styles/theme');
        const fileDir = path.dirname(filePath);
        let relPath = path.relative(fileDir, themePath).replace(/\\/g, '/');
        if (!relPath.startsWith('.')) relPath = './' + relPath;

        const importStmt = `import { theme } from '${relPath}';\n`;

        if (!content.includes("from '") && !content.includes('from "')) {
            // no imports
        }

        if (
            !content.includes("from '../styles/theme'") &&
            !content.includes('from "../styles/theme"') &&
            !content.includes("from './styles/theme'") &&
            !content.includes('from "./styles/theme"') &&
            !content.includes("from '../../styles/theme'") &&
            !content.includes('styles/theme')
        ) {
            let lastImportIndex = content.lastIndexOf('import ');
            if (lastImportIndex !== -1) {
                let endOfLastImport = content.indexOf('\n', lastImportIndex);
                if (endOfLastImport === -1) endOfLastImport = content.length;
                content =
                    content.slice(0, endOfLastImport + 1) +
                    importStmt +
                    content.slice(endOfLastImport + 1);
            } else {
                content = importStmt + content;
            }
        }

        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${modifications} colors in ${path.basename(filePath)}`);
    }
}

function walkDir(dir) {
    for (const item of fs.readdirSync(dir)) {
        const fullPath = path.join(dir, item);
        if (fs.statSync(fullPath).isDirectory()) {
            if (item === 'node_modules' || item === 'data') continue;
            walkDir(fullPath);
        } else {
            processFile(fullPath);
        }
    }
}

walkDir(path.join(__dirname, '../src'));
console.log('Color standardisation completed.');
