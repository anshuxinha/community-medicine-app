import { db } from "../config/firebase";
import { doc, getDoc, updateDoc, increment, runTransaction, collection, query, where, getDocs, setDoc } from "firebase/firestore";

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
export const validateCoupon = async (code, selectedPlanId, currentUid) => {
  if (!code) throw new Error("Please enter a coupon code.");

  const upperCode = code.trim().toUpperCase();

  try {
    const couponRef = doc(db, "coupons", upperCode);
    const couponSnap = await getDoc(couponRef);

    if (!couponSnap.exists()) {
      // Check the referralCodes registry instead of querying the users collection
      const referralRef = doc(db, "referralCodes", upperCode);
      const referralSnap = await getDoc(referralRef);

      if (referralSnap.exists()) {
        const refData = referralSnap.data();
        const referrerUid = refData.ownerUid;

        if (currentUid && referrerUid === currentUid) {
          throw new Error("You cannot use your own referral code.");
        }

        // Check if referee has already used a referral code before
        if (currentUid) {
          const refereeRef = doc(db, "users", currentUid);
          const refereeSnap = await getDoc(refereeRef);
          if (refereeSnap.exists()) {
            const refereeData = refereeSnap.data();
            if (refereeData.referredByCode || refereeData.referredByUid) {
              throw new Error("You have already used a referral code.");
            }
          }
        }

        // Check for circular referral using the referrals collection (authorized for the current user)
        if (currentUid) {
          const circularId = `${currentUid}_${referrerUid}`;
          const circularRef = doc(db, "referrals", circularId);
          const circularSnap = await getDoc(circularRef);
          if (circularSnap.exists()) {
            throw new Error("You cannot use a referral code from someone you referred.");
          }
        }

        return {
          code: upperCode,
          active: true,
          type: "percentage",
          value: 15, // 15% off for referee
          isReferral: true,
          referrerUid,
        };
      }

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

/**
 * Processes the referral reward when a referee completes a premium purchase.
 * Creates a completed referral document and adds 30 days of premium to the referrer.
 */
export const processReferralReward = async (referralCode, referrerUid, refereeUid) => {
  try {
    const referralId = `${referrerUid}_${refereeUid}`;
    const referralRef = doc(db, "referrals", referralId);

    // Check if reward was already processed to prevent double-rewards
    const referralSnap = await getDoc(referralRef);
    if (referralSnap.exists() && referralSnap.data().rewardGranted === true) {
      console.log("Referral reward already processed for this referral.");
      return;
    }

    // 1. Create a referral tracking doc in Firestore (initially rewardGranted: false)
    await setDoc(referralRef, {
      referrerUid,
      refereeUid,
      status: "completed",
      purchaseCompletedAt: new Date().toISOString(),
      rewardGranted: false,
      referralCode,
    });

    // 2. Update referee's user doc to associate the referral
    await updateDoc(doc(db, "users", refereeUid), {
      referredByCode: referralCode,
      referredByUid: referrerUid,
    });
  } catch (error) {
    console.warn("Failed to process referral reward:", error.message);
  }
};

/**
 * Checks for any pending referral rewards (where rewardGranted is false)
 * for the current user, grants +30 days of premium for each, and updates
 * the referral status. Returns the new premium details if updated.
 */
export const claimReferralRewards = async (currentUid, currentExpiryStr, currentTotalReferrals) => {
  if (!currentUid) return null;
  try {
    const q = query(
      collection(db, "referrals"),
      where("referrerUid", "==", currentUid),
      where("rewardGranted", "==", false)
    );
    const querySnap = await getDocs(q);
    if (querySnap.empty) return null;

    let totalDaysToGrant = 0;
    const referralsToUpdate = [];

    querySnap.forEach((docSnap) => {
      referralsToUpdate.push(docSnap.ref);
      totalDaysToGrant += 30;
    });

    if (totalDaysToGrant > 0) {
      let currentExpiry = Date.now();
      if (currentExpiryStr) {
        const currentExpiryDate = new Date(currentExpiryStr);
        if (!isNaN(currentExpiryDate.getTime())) {
          currentExpiry = Math.max(Date.now(), currentExpiryDate.getTime());
        }
      }

      const newExpiryMs = currentExpiry + totalDaysToGrant * 24 * 60 * 60 * 1000;
      const newExpiryStrUpdated = new Date(newExpiryMs).toISOString();
      const newTotalReferrals = (currentTotalReferrals || 0) + referralsToUpdate.length;

      const referrerRef = doc(db, "users", currentUid);
      
      await runTransaction(db, async (transaction) => {
        // Update referrer's user document
        transaction.update(referrerRef, {
          isPremium: true,
          premiumExpiryDate: newExpiryStrUpdated,
          totalReferrals: newTotalReferrals,
        });

        // Mark all processed referrals as rewardGranted = true
        for (const ref of referralsToUpdate) {
          transaction.update(ref, {
            rewardGranted: true,
            status: "completed",
          });
        }
      });

      console.log(`[Referrals] Claimed ${totalDaysToGrant} days premium for ${referralsToUpdate.length} referrals.`);
      return {
        newExpiryDate: newExpiryStrUpdated,
        newTotalReferrals,
      };
    }
  } catch (error) {
    console.warn("Failed to claim referral rewards:", error.message);
  }
  return null;
};
