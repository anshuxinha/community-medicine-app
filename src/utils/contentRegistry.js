import mockData from '../data/mockData.json';
import practicalData from '../data/practical.json';

export const CONTENT_SECTIONS = {
    theory: mockData,
    practical: practicalData,
};

export const normalizeUpdatedSnippet = (value = '') => value
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/^#{1,2}\s+/, '')
    .replace(/^\s*[-*]\s+/, '')
    .replace(/\s+/g, ' ')
    .trim();

export const getContentKey = (section, id) => `${section}:${String(id)}`;

const hashString = (value) => {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
        hash = ((hash << 5) - hash) + value.charCodeAt(index);
        hash |= 0;
    }
    return `v${Math.abs(hash).toString(36)}`;
};

export const getContentSignature = (item = {}) => {
    const payload = JSON.stringify({
        title: item.title || '',
        content: item.content || '',
        updatedSegments: Array.isArray(item.updatedSegments)
            ? item.updatedSegments.map(normalizeUpdatedSnippet)
            : [],
    });
    return hashString(payload);
};

export const walkContentItems = (items, section, visitor) => {
    if (!Array.isArray(items)) return;
    items.forEach((item) => {
        visitor(item, section);
        if (Array.isArray(item.subsections) && item.subsections.length > 0) {
            walkContentItems(item.subsections, section, visitor);
        }
    });
};

const buildLeafEntries = () => {
    const entries = [];
    Object.entries(CONTENT_SECTIONS).forEach(([section, items]) => {
        walkContentItems(items, section, (item, activeSection) => {
            if (Array.isArray(item.subsections) && item.subsections.length > 0) {
                return;
            }

            entries.push({
                key: getContentKey(activeSection, item.id),
                section: activeSection,
                id: String(item.id),
                title: item.title || '',
                recentlyUpdated: item.recentlyUpdated === true,
                signature: getContentSignature(item),
                item,
            });
        });
    });
    return entries;
};

export const LEAF_CONTENT_ENTRIES = buildLeafEntries();
export const TOTAL_LEAF_CONTENT_ITEMS = LEAF_CONTENT_ENTRIES.length;
export const VALID_CONTENT_KEYS = new Set(LEAF_CONTENT_ENTRIES.map((entry) => entry.key));
export const VALID_MASTER_TITLES = new Set(LEAF_CONTENT_ENTRIES.map((entry) => entry.title));
export const CONTENT_ENTRY_BY_KEY = new Map(LEAF_CONTENT_ENTRIES.map((entry) => [entry.key, entry]));

export const CONTENT_ENTRIES_BY_TITLE = LEAF_CONTENT_ENTRIES.reduce((accumulator, entry) => {
    const existing = accumulator.get(entry.title) || [];
    existing.push(entry);
    accumulator.set(entry.title, existing);
    return accumulator;
}, new Map());

export const getReadVersionForItem = (readItemVersions, section, item) => (
    readItemVersions?.[getContentKey(section, item.id)] || null
);

export const isItemReadCurrent = (readItemVersions, section, item) => (
    getReadVersionForItem(readItemVersions, section, item) === getContentSignature(item)
);

export const isItemPendingUpdate = (readItemVersions, section, item) => (
    item?.recentlyUpdated === true && !isItemReadCurrent(readItemVersions, section, item)
);

export const getItemStatus = (item, section, readItemVersions) => {
    if (!item) return 'none';

    if (Array.isArray(item.subsections) && item.subsections.length > 0) {
        const childStatuses = item.subsections.map((child) => getItemStatus(child, section, readItemVersions));
        if (childStatuses.includes('updated')) {
            return 'updated';
        }
        if (childStatuses.length > 0 && childStatuses.every((status) => status === 'read')) {
            return 'read';
        }
        return 'none';
    }

    if (isItemPendingUpdate(readItemVersions, section, item)) {
        return 'updated';
    }

    return isItemReadCurrent(readItemVersions, section, item) ? 'read' : 'none';
};

export const getEffectiveReadCount = (readItemVersions = {}) => (
    LEAF_CONTENT_ENTRIES.reduce((count, entry) => (
        readItemVersions?.[entry.key] === entry.signature ? count + 1 : count
    ), 0)
);

export const getUpdatedSegmentsForItem = (item = {}) => (
    Array.isArray(item.updatedSegments)
        ? item.updatedSegments.map(normalizeUpdatedSnippet).filter(Boolean)
        : []
);

export const getCurrentContentEntry = ({ section, id, title, contentKey } = {}) => {
    if (contentKey && CONTENT_ENTRY_BY_KEY.has(contentKey)) {
        return CONTENT_ENTRY_BY_KEY.get(contentKey) || null;
    }

    if (section && id !== undefined) {
        const bySectionId = CONTENT_ENTRY_BY_KEY.get(getContentKey(section, id));
        if (bySectionId) return bySectionId;
    }

    if (title) {
        const matches = CONTENT_ENTRIES_BY_TITLE.get(title) || [];
        if (matches.length > 0) {
            return matches[0];
        }
    }

    return null;
};

export const getCurrentContentItem = (reference = {}) => getCurrentContentEntry(reference)?.item || null;

export const migrateLegacyReadItems = (legacyTitles = [], existingReadItemVersions = {}) => {
    const nextVersions = { ...existingReadItemVersions };

    legacyTitles.forEach((title) => {
        const matches = CONTENT_ENTRIES_BY_TITLE.get(title) || [];
        matches.forEach((entry) => {
            if (entry.recentlyUpdated || nextVersions[entry.key]) {
                return;
            }
            nextVersions[entry.key] = entry.signature;
        });
    });

    return nextVersions;
};
