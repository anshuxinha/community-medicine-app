import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { DEFAULT_TOPIC_ILLUSTRATION_MAP } from '../data/defaultTopicIllustrations';

const COLLECTION_NAME = 'topicIllustrations';
const remoteIllustrationCache = new Map();

const normalizeIllustration = (image = {}) => ({
    id: image.id || null,
    alt: image.alt || 'Topic illustration',
    caption: image.caption || '',
    purpose: image.purpose || '',
    url: image.url || null,
    source: image.source,
    anchorText: image.anchorText || '',
    placement: image.placement === 'before'
        ? 'before'
        : (image.placement === 'bottom' ? 'bottom' : (image.placement === 'top' ? 'top' : 'after')),
    aspectRatio: typeof image.aspectRatio === 'number' && image.aspectRatio > 0 ? image.aspectRatio : 1.7778,
});

const mergeIllustrations = (defaults = [], remote = []) => {
    const merged = new Map();

    defaults.forEach((image) => {
        const normalized = normalizeIllustration(image);
        const key = normalized.id || `${normalized.anchorText}:${normalized.alt}`;
        merged.set(key, normalized);
    });

    remote.forEach((image) => {
        const normalized = normalizeIllustration(image);
        const key = normalized.id || `${normalized.anchorText}:${normalized.alt}`;
        const existing = merged.get(key) || {};
        merged.set(key, {
            ...existing,
            ...normalized,
            source: normalized.source || existing.source,
            url: normalized.url || existing.url || null,
        });
    });

    return [...merged.values()].filter((image) => image.source || image.url);
};

const buildIllustrationDocId = (section, topicId) => `${section}__${String(topicId)}`;

export const getTopicIllustrations = async ({ section, topicId, contentKey }) => {
    if (!section || topicId === undefined || topicId === null) {
        return [];
    }

    const resolvedContentKey = contentKey || `${section}:${String(topicId)}`;
    const defaultIllustrations = DEFAULT_TOPIC_ILLUSTRATION_MAP.get(resolvedContentKey) || [];
    const docId = buildIllustrationDocId(section, topicId);

    if (remoteIllustrationCache.has(docId)) {
        return mergeIllustrations(defaultIllustrations, remoteIllustrationCache.get(docId));
    }

    try {
        const snapshot = await getDoc(doc(db, COLLECTION_NAME, docId));
        const remoteImages = snapshot.exists() && Array.isArray(snapshot.data()?.images)
            ? snapshot.data().images
            : [];

        remoteIllustrationCache.set(docId, remoteImages);
        return mergeIllustrations(defaultIllustrations, remoteImages);
    } catch (error) {
        return mergeIllustrations(defaultIllustrations, []);
    }
};
