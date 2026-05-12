# Coupon Firestore Setup

To use the new coupon feature, create a collection named `coupons` in your Firestore database.

### Document Structure

Each document ID should be the coupon code in **UPPERCASE** (e.g., `SAVE50`).

**Fields:**
- `active`: (boolean) Whether the coupon can be used.
- `type`: (string) Either `percentage` or `flat`.
- `value`: (number) The discount value (e.g., `50` for 50% or `100` for ₹100 off).
- `expiryDate`: (timestamp, optional) When the coupon expires.
- `usageLimit`: (number, optional) Maximum number of times this coupon can be used across all users.
- `usageCount`: (number) Initial value should be `0`.
- `targetPlans`: (array of strings, optional) e.g., `['yearly', 'lifetime']`. If omitted, applies to all.

### Example Document (`PROMO20`):
```json
{
  "active": true,
  "type": "percentage",
  "value": 20,
  "usageCount": 0,
  "usageLimit": 100,
  "targetPlans": ["yearly"]
}
```

### Script for Bulk Upload
If you have many coupons, you can use the `serviceAccountKey` with a simple Node.js script to upload them. Let me know if you'd like me to generate that script for you.
