import { db } from "../config/firebase";
import { doc, getDoc, updateDoc, increment, runTransaction } from "firebase/firestore";

/**
 * Validates a coupon code against the Firestore 'coupons' collection.
 * 
 * Coupon Document Structure:
 * {
 *   code: string (ID of the document)
 *   type: 'percentage' | 'flat'
 *   value: number (e.g., 20 for 20%, 500 for ₹500 off)
 *   expiryDate: timestamp (optional)
 *   usageLimit: number (optional)
 *   usageCount: number (optional)
 *   active: boolean
 *   targetPlans: string[] (optional, e.g., ['yearly', 'lifetime'])
 * }
 */
export const validateCoupon = async (code, selectedPlanId) => {
  if (!code) throw new Error("Please enter a coupon code.");

  try {
    const couponRef = doc(db, "coupons", code.trim().toUpperCase());
    const couponSnap = await getDoc(couponRef);

    if (!couponSnap.exists()) {
      throw new Error("Invalid coupon code.");
    }

    const data = couponSnap.data();

    // 1. Check if active
    if (data.active === false) {
      throw new Error("This coupon is no longer active.");
    }

    // 2. Check expiry
    if (data.expiryDate && data.expiryDate.toDate() < new Date()) {
      throw new Error("This coupon has expired.");
    }

    // 3. Check usage limit
    if (data.usageLimit !== undefined && data.usageCount >= data.usageLimit) {
      throw new Error("This coupon has reached its usage limit.");
    }

    // 4. Check target plans
    if (data.targetPlans && !data.targetPlans.includes(selectedPlanId)) {
      throw new Error("This coupon is not applicable to the selected plan.");
    }

    return {
      code: code.trim().toUpperCase(),
      ...data
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Calculates the discounted price based on the coupon and the original price.
 */
export const applyDiscount = (originalPrice, coupon) => {
  if (!coupon) return originalPrice;

  // RevenueCat prices can be: "₹999.00", "9,99 €", "₹ 1.000,00", "$19.99"
  // We need to extract the numeric part, handling both . and , as decimal/thousands separators
  
  // 1. Remove currency symbol and spaces
  let cleanPrice = originalPrice.replace(/[^\d.,]/g, "").trim();
  
  // 2. Normalize decimal separator to "."
  // If there's both a comma and a dot, the last one is the decimal
  const lastComma = cleanPrice.lastIndexOf(',');
  const lastDot = cleanPrice.lastIndexOf('.');
  
  if (lastComma > lastDot) {
    // Comma is decimal (e.g. 9,99)
    cleanPrice = cleanPrice.replace(/\./g, "").replace(",", ".");
  } else if (lastDot > lastComma) {
    // Dot is decimal (e.g. 1,000.00)
    cleanPrice = cleanPrice.replace(/,/g, "");
  } else {
    // Only one type of separator or none
    cleanPrice = cleanPrice.replace(",", ".");
  }

  const numericPrice = parseFloat(cleanPrice);
  const currencySymbolMatch = originalPrice.match(/[^\d.,\s]+/);
  const currencySymbol = currencySymbolMatch ? currencySymbolMatch[0] : "";
  const isSymbolAtEnd = originalPrice.trim().endsWith(currencySymbol);

  let discountedPrice = numericPrice;

  if (coupon.type === "percentage") {
    discountedPrice = numericPrice * (1 - coupon.value / 100);
  } else if (coupon.type === "flat") {
    discountedPrice = Math.max(0, numericPrice - coupon.value);
  } else if (coupon.type === "fixed") {
    discountedPrice = coupon.value;
  }

  // Round to nearest integer for simplicity (common in coupons)
  const roundedPrice = Math.round(discountedPrice);
  
  // Re-format
  const formattedPrice = roundedPrice.toLocaleString();
  
  return isSymbolAtEnd 
    ? `${formattedPrice} ${currencySymbol}`.trim() 
    : `${currencySymbol}${formattedPrice}`.trim();
};

/**
 * Increments the usage count for a coupon atomically.
 * Should be called after a successful purchase.
 */
export const incrementCouponUsage = async (code) => {
  try {
    const couponRef = doc(db, "coupons", code);
    await runTransaction(db, async (transaction) => {
      const couponDoc = await transaction.get(couponRef);
      if (!couponDoc.exists()) {
        throw new Error("Coupon does not exist.");
      }

      const data = couponDoc.data();
      if (data.usageLimit !== undefined && data.usageCount >= data.usageLimit) {
        throw new Error("This coupon has reached its usage limit.");
      }

      transaction.update(couponRef, {
        usageCount: increment(1)
      });
    });
  } catch (error) {
    console.warn("Failed to increment coupon usage:", error.message);
    throw error;
  }
};
