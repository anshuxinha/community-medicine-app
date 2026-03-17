const MAX_SPEECH_CHUNK_LENGTH = 1800;
const OBJECT_KEYS_TO_SKIP = new Set([
    'id',
    'uri',
    'url',
    'image',
    'images',
    'alt',
    'icon',
    'quiz',
    'quizzes',
]);

const PREFERRED_OBJECT_KEYS = [
    'title',
    'heading',
    'subtitle',
    'content',
    'text',
    'body',
    'description',
    'items',
    'sections',
    'subsections',
];

const cleanSpeechText = (value) => {
    if (typeof value !== 'string') {
        return '';
    }

    return value
        .replace(/!\[(.*?)\]\((.*?)\)/g, '$1')
        .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
        .replace(/^\s{0,}#{1,6}\s*/gm, '')
        .replace(/^\s*[-*]\s+/gm, '')
        .replace(/^\s{2,}[-*]\s+/gm, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/â€¢|•/g, ' ')
        .replace(/â€“|–/g, ' ')
        .replace(/Â/g, '')
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ \t]+/g, ' ')
        .replace(/\s+\n/g, '\n')
        .trim();
};

const collectSpeechFragments = (value, fragments, seen) => {
    if (value == null) {
        return;
    }

    if (typeof value === 'string') {
        const cleaned = cleanSpeechText(value);
        if (cleaned) {
            const normalized = cleaned.toLowerCase();
            if (!seen.has(normalized)) {
                seen.add(normalized);
                fragments.push(cleaned);
            }
        }
        return;
    }

    if (Array.isArray(value)) {
        value.forEach((entry) => collectSpeechFragments(entry, fragments, seen));
        return;
    }

    if (typeof value === 'object') {
        const keys = Object.keys(value);
        const orderedKeys = [
            ...PREFERRED_OBJECT_KEYS.filter((key) => keys.includes(key)),
            ...keys.filter((key) => !PREFERRED_OBJECT_KEYS.includes(key)),
        ];

        orderedKeys.forEach((key) => {
            if (!OBJECT_KEYS_TO_SKIP.has(key)) {
                collectSpeechFragments(value[key], fragments, seen);
            }
        });
    }
};

export const buildSpeechText = ({ title, content }) => {
    const fragments = [];
    const seen = new Set();

    collectSpeechFragments(title, fragments, seen);
    collectSpeechFragments(content, fragments, seen);

    return fragments.join('\n\n').trim();
};

const splitLongParagraph = (paragraph, maxLength) => {
    const sentences = paragraph
        .split(/(?<=[.!?])\s+/)
        .map((part) => part.trim())
        .filter(Boolean);

    if (sentences.length <= 1) {
        const words = paragraph.split(/\s+/).filter(Boolean);
        const chunks = [];
        let current = '';

        words.forEach((word) => {
            const candidate = current ? `${current} ${word}` : word;
            if (candidate.length > maxLength && current) {
                chunks.push(current);
                current = word;
            } else {
                current = candidate;
            }
        });

        if (current) {
            chunks.push(current);
        }

        return chunks;
    }

    const chunks = [];
    let current = '';

    sentences.forEach((sentence) => {
        const candidate = current ? `${current} ${sentence}` : sentence;
        if (candidate.length > maxLength && current) {
            chunks.push(current);
            current = sentence;
        } else {
            current = candidate;
        }
    });

    if (current) {
        chunks.push(current);
    }

    return chunks;
};

export const buildSpeechChunks = (value, maxLength = MAX_SPEECH_CHUNK_LENGTH) => {
    const fullText = cleanSpeechText(typeof value === 'string' ? value : '');
    if (!fullText) {
        return [];
    }

    const paragraphs = fullText
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.replace(/\n/g, ' ').trim())
        .filter(Boolean);

    const chunks = [];
    let current = '';

    paragraphs.forEach((paragraph) => {
        if (paragraph.length > maxLength) {
            if (current) {
                chunks.push(current);
                current = '';
            }
            chunks.push(...splitLongParagraph(paragraph, maxLength));
            return;
        }

        const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
        if (candidate.length > maxLength && current) {
            chunks.push(current);
            current = paragraph;
        } else {
            current = candidate;
        }
    });

    if (current) {
        chunks.push(current);
    }

    return chunks;
};
