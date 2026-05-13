import { getTopicIllustrations } from '../topicIllustrations';
import { getDoc, getDocs } from 'firebase/firestore';

jest.mock('../../config/firebase', () => ({
  db: {}
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn().mockReturnValue('mock-doc-ref'),
  collection: jest.fn().mockReturnValue('mock-collection-ref'),
  query: jest.fn().mockReturnValue('mock-query'),
  where: jest.fn(),
  limit: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn()
}));

describe('topicIllustrations service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear the internal cache if possible, but since it's a private constant 
    // in the module, we might need to rely on different docIds or re-importing.
    // For these tests, we'll use unique combinations or just accept cache hits 
    // if the logic remains the same.
  });

  test('constructs standard illustration URLs with reading-illustrations path', async () => {
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        images: [{ id: 'img1', fileName: 'test.png' }]
      })
    });

    const results = await getTopicIllustrations({ section: 'Standard', topicId: 101 });
    expect(results[0].url).toContain('/reading-illustrations/test.png');
    expect(results[0].url).toContain('community-med-app.firebasestorage.app');
  });

  test('constructs Gem illustration URLs with gems path when contentKey starts with gems:', async () => {
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        images: [{ id: 'gem1', fileName: 'gem.png' }]
      })
    });

    const results = await getTopicIllustrations({ 
      section: 'GemsSection', 
      topicId: 202, 
      contentKey: 'gems:S1:1' 
    });
    expect(results[0].url).toContain('/gems/gem.png');
  });

  test('falls back to query if doc fetch fails or is empty', async () => {
    // 1. getDoc returns not exists
    getDoc.mockResolvedValue({
      exists: () => false
    });

    // 2. getDocs (fallback query) returns data
    getDocs.mockResolvedValue({
      empty: false,
      docs: [{
        data: () => ({
          images: [{ id: 'fallback-img', fileName: 'fallback.png' }]
        })
      }]
    });

    const results = await getTopicIllustrations({ section: 'Fallback', topicId: 303 });
    
    expect(getDoc).toHaveBeenCalled();
    expect(getDocs).toHaveBeenCalled();
    expect(results[0].id).toBe('fallback-img');
    expect(results[0].url).toContain('/reading-illustrations/fallback.png');
  });

  test('sanitizes fileName to prevent path traversal', async () => {
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        images: [{ id: 'evil', fileName: '../../../etc/passwd' }]
      })
    });

    const results = await getTopicIllustrations({ section: 'Security', topicId: 404 });
    expect(results[0].url).not.toContain('../../../');
    expect(results[0].url).toContain('/reading-illustrations/etc/passwd');
  });

  test('returns default illustrations even if remote fetch fails', async () => {
    getDoc.mockRejectedValue(new Error('Network error'));

    // We expect it to still return an array (potentially containing defaults)
    const results = await getTopicIllustrations({ section: 'Error', topicId: 505 });
    expect(Array.isArray(results)).toBe(true);
  });
});
