import { validateCoupon, applyDiscount, incrementCouponUsage } from '../couponService';
import { runTransaction, getDoc, doc } from 'firebase/firestore';

// Mock Firestore
jest.mock('../../config/firebase', () => ({
  db: {}
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn().mockReturnValue('mock-ref'),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  increment: jest.fn().mockReturnValue('mock-increment'),
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

  describe('validateCoupon', () => {
    const mockDate = new Date('2026-05-12T12:00:00Z');
    
    beforeEach(() => {
      jest.clearAllMocks();
      jest.useFakeTimers().setSystemTime(mockDate);
    });

    test('validates active coupon correctly', async () => {
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          active: true,
          type: 'percentage',
          value: 10,
          targetPlans: ['yearly']
        })
      });

      const result = await validateCoupon('SAVE10', 'yearly');
      expect(result.code).toBe('SAVE10');
      expect(result.value).toBe(10);
    });

    test('throws error for inactive coupon', async () => {
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ active: false })
      });

      await expect(validateCoupon('OLDCODE', 'yearly')).rejects.toThrow('This coupon is no longer active.');
    });

    test('throws error for expired coupon', async () => {
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          active: true,
          expiryDate: { toDate: () => new Date('2026-05-01') }
        })
      });

      await expect(validateCoupon('EXPIRED', 'yearly')).rejects.toThrow('This coupon has expired.');
    });

    test('throws error if usage limit reached', async () => {
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          active: true,
          usageLimit: 100,
          usageCount: 100
        })
      });

      await expect(validateCoupon('FULL', 'yearly')).rejects.toThrow('This coupon has reached its usage limit.');
    });

    test('throws error if plan not targeted', async () => {
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          active: true,
          targetPlans: ['yearly']
        })
      });

      await expect(validateCoupon('SAVE10', 'monthly')).rejects.toThrow('This coupon is not applicable to the selected plan.');
    });

    test('accepts a valid referral code from the referralCodes registry', async () => {
      // 1) coupons/{code} missing  2) referralCodes/{code} present
      getDoc
        .mockResolvedValueOnce({ exists: () => false })
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ ownerUid: 'referrer-uid-1', ownerName: 'Referrer' }),
        });

      const result = await validateCoupon('K3H9M2PA', 'yearly');
      expect(result.isReferral).toBe(true);
      expect(result.code).toBe('K3H9M2PA');
      expect(result.referrerUid).toBe('referrer-uid-1');
      expect(result.type).toBe('percentage');
      expect(result.value).toBe(15);
    });

    test('rejects own referral code', async () => {
      getDoc
        .mockResolvedValueOnce({ exists: () => false })
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ ownerUid: 'self-uid', ownerName: 'Me' }),
        });

      await expect(validateCoupon('MYCODE12', 'yearly', 'self-uid')).rejects.toThrow(
        'You cannot use your own referral code.',
      );
    });

    test('rejects unknown codes that are neither coupons nor referrals', async () => {
      getDoc
        .mockResolvedValueOnce({ exists: () => false })
        .mockResolvedValueOnce({ exists: () => false });

      await expect(validateCoupon('NOPE1234', 'yearly')).rejects.toThrow(
        'Invalid coupon code.',
      );
    });
  });

  describe('incrementCouponUsage', () => {
    test('increments usage atomically if under limit', async () => {
      const mockTransaction = {
        get: jest.fn().mockResolvedValue({
          exists: () => true,
          data: () => ({ usageCount: 5, usageLimit: 10 })
        }),
        update: jest.fn()
      };
      runTransaction.mockImplementation((db, cb) => cb(mockTransaction));

      await incrementCouponUsage('COUPON123');
      expect(mockTransaction.update).toHaveBeenCalledWith(expect.anything(), {
        usageCount: expect.anything()
      });
    });

    test('throws error if limit reached during transaction', async () => {
      const mockTransaction = {
        get: jest.fn().mockResolvedValue({
          exists: () => true,
          data: () => ({ usageCount: 10, usageLimit: 10 })
        }),
        update: jest.fn()
      };
      runTransaction.mockImplementation((db, cb) => cb(mockTransaction));

      await expect(incrementCouponUsage('COUPON123')).rejects.toThrow('This coupon has reached its usage limit.');
      expect(mockTransaction.update).not.toHaveBeenCalled();
    });
  });
});
