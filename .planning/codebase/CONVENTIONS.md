# Coding Conventions

**Analysis Date:** 2025-05-12

## Naming Patterns

**Files:**
- **Components:** PascalCase (e.g., `src/components/ReadingView.js`, `src/screens/LoginScreen.js`)
- **Services & Utils:** camelCase (e.g., `src/services/couponService.js`, `src/utils/deviceUtils.js`)
- **Styles:** camelCase (e.g., `src/styles/theme.js`)
- **Python Scripts:** snake_case (e.g., `scripts/verify_mock_data.py`)
- **JavaScript Scripts:** mixed, mostly snake_case (e.g., `scripts/check_rules.js`, `scripts/bunny-videos.js`)

**Functions:**
- **JavaScript:** camelCase (e.g., `validateCoupon`, `applyDiscount`)
- **Python:** snake_case (e.g., `generate_review_bundle`, `load_json`)

**Variables:**
- **JavaScript:** camelCase (e.g., `numericPrice`, `discountedPrice`)
- **Python:** snake_case (e.g., `recent_updates`, `leaf_items`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `OLLAMA_MODEL`, `HTTP_HEADERS`)

**Types:**
- JavaScript: Uses JSDoc for complex object shapes in comments (e.g., `src/services/couponService.js`).
- Python: Uses explicit type hints (e.g., `Dict[str, Any]`, `List[str]`).

## Code Style

**Formatting:**
- **JavaScript:** 2-space indentation, semicolons used, double quotes preferred for imports and most strings.
- **Python:** 4-space indentation, follows PEP 8 standards.

**Linting:**
- Not explicitly configured in `package.json` (no `.eslintrc` or `biome.json` detected).
- Python code appears to follow standard linting rules (type hints, consistent spacing).

## Import Organization

**Order (JavaScript):**
1. React and React Native core imports.
2. Third-party libraries (e.g., `@expo/vector-icons`, `firebase/firestore`).
3. Local config/styles (e.g., `../config/firebase`, `../styles/theme`).
4. Local utilities and services.
5. Local components.

**Path Aliases:**
- None detected; relative paths are used (e.g., `../../config/firebase`).

## Error Handling

**Patterns:**
- **Services:** Use `try-catch` blocks. Specific validation errors are thrown using `throw new Error("Message")` to be caught by UI components.
- **Scripts:** Log errors to console using `console.error` (JS) or `print` (Python).

## Logging

**Framework:** `console` for JavaScript, `print` for Python.

**Patterns:**
- `console.log` and `console.warn` are used in components and services for debugging and non-critical issues (e.g., `src/components/ReadingView.js`).
- Python scripts use `print` for progress monitoring and error reporting.

## Comments

**When to Comment:**
- JSDoc is used to document the structure of data objects and function parameters in services (`src/services/couponService.js`).
- Complex logic in components (like markdown parsing) is explained with inline comments (`src/components/ReadingView.js`).

**JSDoc/TSDoc:**
- Used occasionally in services for parameter and return value documentation.

## Function Design

**Size:**
- Utility and service functions are kept small and focused.
- Component-level functions (like `renderBlock` in `ReadingView.js`) can become quite large due to complex conditional rendering.

**Parameters:**
- Destructured props in components.
- Explicit arguments in service functions.

**Return Values:**
- Services typically return promises (async) or specific data objects/formatted strings.

## Module Design

**Exports:**
- **Services/Utils:** Primarily named exports.
- **Components:** Primarily default exports.

**Barrel Files:**
- Not extensively used; direct imports from specific files are preferred.

---

*Convention analysis: 2025-05-12*
