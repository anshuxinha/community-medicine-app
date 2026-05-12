import { applyDiscount } from '../couponService';

// Mock Firestore
jest.mock('../../config/firebase', () => ({
  db: {}
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  increment: jest.fn(),
  runTransaction: jest.fn()
}));

describe('couponService', () => {
  describe('applyDiscount', () => {
    test('applies percentage discount correctly (standard)', () => {
      const original = '₹999.00';
      const coupon = { type: 'percentage', value: 20 };
      expect(applyDiscount(original, coupon)).toBe('₹799');
    });

    test('applies flat discount correctly (standard)', () => {
      const original = '₹999.00';
      const coupon = { type: 'flat', value: 200 };
      expect(applyDiscount(original, coupon)).toBe('₹799');
    });

    test('handles European format (9,99 €)', () => {
      const original = '9,99 €';
      const coupon = { type: 'percentage', value: 10 };
      // Numeric part: 9.99 -> 10% off -> 8.991 -> 9
      expect(applyDiscount(original, coupon)).toBe('9 €');
    });

    test('handles format with dot as thousand separator (₹ 1.000,00)', () => {
      const original = '₹ 1.000,00';
      const coupon = { type: 'percentage', value: 50 };
      expect(applyDiscount(original, coupon)).toBe('₹500');
    });

    test('handles dollar format ($19.99)', () => {
      const original = '$19.99';
      const coupon = { type: 'flat', value: 5 };
      expect(applyDiscount(original, coupon)).toBe('$15');
    });

    test('ensures price does not go below zero', () => {
      const original = '₹100';
      const coupon = { type: 'flat', value: 150 };
      expect(applyDiscount(original, coupon)).toBe('₹0');
    });
  });
});
