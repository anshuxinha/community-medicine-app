const fs = require('fs');
const path = 'd:/The App/src/screens/PaywallScreen.js';
let c = fs.readFileSync(path, 'utf8');

// 1. Remove TextInput from import
c = c.replace(
  'import { Text, Button, Card, TextInput } from "react-native-paper";',
  'import { Text, Button, Card } from "react-native-paper";'
);

// 2. Remove VALID_COUPON_CODES array (lines 26-58)
c = c.replace(
  /\/\/ 30 unique coupon codes for ₹49 monthly subscription\r?\nconst VALID_COUPON_CODES = \[[\s\S]*?\];\r?\n\r?\n/,
  ''
);

// 3. Remove couponPrice from PLAN_METADATA
c = c.replace(/    couponPrice: "₹49\/mo",\r?\n/, '');
c = c.replace(/    couponPrice: null,\r?\n/g, '');

// 4. Remove coupon state variables
c = c.replace(/  const \[couponCode, setCouponCode\] = useState\(""\);\r?\n/, '');
c = c.replace(/  const \[couponApplied, setCouponApplied\] = useState\(false\);\r?\n/, '');
c = c.replace(/  const \[couponError, setCouponError\] = useState\(false\);\r?\n/, '');

// 5. Remove validateCoupon and handleApplyCoupon functions
c = c.replace(
  /  const validateCoupon = \(code\) => \{[\s\S]*?\};\r?\n\r?\n  const handleApplyCoupon = \(\) => \{[\s\S]*?\};\r?\n\r?\n/,
  ''
);

// 6. Remove coupon price logic in the map callback, simplify showPrice
c = c.replace(
  /                \/\/ Use coupon price for monthly plan when coupon is applied\r?\n                const isCouponMonthly = couponApplied && plan\.id === "monthly";\r?\n                const showPrice = isCouponMonthly\r?\n                  \? plan\.couponPrice\r?\n                  : rcPrice \|\| plan\.basePrice;/,
  '                const showPrice = rcPrice || plan.basePrice;'
);

// 7. Remove "Coupon Applied" badge in the card
c = c.replace(
  /                    {isCouponMonthly && \(\r?\n                        <Text style={styles\.couponAppliedBadge}>\r?\n                          Coupon Applied\r?\n                        <\/Text>\r?\n                      \)}\r?\n/,
  ''
);

// 8. Remove the entire coupon input section
c = c.replace(
  /            <View style={styles\.couponSection}>[\s\S]*?<\/View>\r?\n\r?\n/,
  '\n'
);

// 9. Remove coupon styles
c = c.replace(/  couponSection: \{[\s\S]*?\},\r?\n/, '');
c = c.replace(/  couponInputRow: \{[\s\S]*?\},\r?\n/, '');
c = c.replace(/  couponInput: \{[\s\S]*?\},\r?\n/, '');
c = c.replace(/  applyButton: \{[\s\S]*?\},\r?\n/, '');
c = c.replace(/  applyButtonLabel: \{[\s\S]*?\},\r?\n/, '');
c = c.replace(/  couponErrorText: \{[\s\S]*?\},\r?\n/, '');
c = c.replace(/  couponSuccessText: \{[\s\S]*?\},\r?\n/, '');
c = c.replace(/  couponAppliedBadge: \{[\s\S]*?\},\r?\n/, '');

fs.writeFileSync(path, c);
console.log('Coupon code system removed from PaywallScreen');
