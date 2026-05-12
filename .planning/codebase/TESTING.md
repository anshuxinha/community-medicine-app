# Testing Patterns

**Analysis Date:** 2025-05-12

## Test Framework

**Runner:**
- No formal JavaScript test runner (Jest, Vitest, etc.) is configured in the project.
- **Python-based Verification:** Uses custom Python scripts for data validation and verification.
- **CI Runner:** GitHub Actions executes verification scripts on `workflow_dispatch`.

**Assertion Library:**
- **Python:** Uses standard `if/then` checks and custom validation logic in `scripts/verify_mock_data.py`.
- **JavaScript:** Custom validation logic in `validate_json.js`.

**Run Commands:**
```bash
python scripts/verify_mock_data.py   # Run AI-powered data verification
node validate_json.js                # Validate mockData.json syntax
node scripts/check_rules.js          # Fetch and check Firestore rules
```

## Test File Organization

**Location:**
- Verification and validation scripts are located in the root or `scripts/` directory.

**Naming:**
- Python: `scripts/verify_*.py`
- JavaScript: `scripts/check_*.js` or root `validate_*.js`

**Structure:**
```
[project-root]/
├── scripts/
│   ├── verify_mock_data.py   # AI verification logic
│   └── check_rules.js        # Infrastructure checks
└── validate_json.js          # Syntax validation
```

## Test Structure

**Data Verification Pattern (Python):**
```python
def verify_claim_batch(item_title, item_id, claim_lines, source_context):
    # Prompts AI (Ollama) to verify textbook lines against fresh evidence
    prompt = f"Verify whether any of the following lines for '{item_title}' should be updated..."
    payload = call_ollama(prompt)
    # Process and return corrections
    return corrections
```

**JSON Validation Pattern (JavaScript):**
```javascript
const data = fs.readFileSync('src/data/mockData.json', 'utf8');
try {
    JSON.parse(data);
    console.log('Valid JSON');
} catch(e) {
    // Detailed error reporting with line/column numbers
    console.log('Error:', e.message);
}
```

## Mocking

**Framework:** Not used for automated tests.

**Patterns:**
- The project relies heavily on `src/data/mockData.json` which serves as a "mock" or static source of truth for the application content.
- `scripts/patch-mockData.js` is used to programmatically update this mock data.

## Fixtures and Factories

**Test Data:**
- Static JSON files in `src/data/` act as both application data and test fixtures.
- `src/data/mockData.json`: Core application content.
- `src/data/updates.json`: Recently fetched updates.

**Location:**
- `src/data/`

## Coverage

**Requirements:** None enforced.

## Test Types

**Data Integrity Tests:**
- Syntax validation for JSON files.
- Consistency checks between data files.

**AI-Powered Verification:**
- Weekly automated review of library content against current public health news (PIB).
- Managed via `scripts/verify_mock_data.py` and GitHub Actions.

**Manual Testing:**
- UI components and navigation are manually tested by the developer during the build process.
- No automated E2E or Unit tests for UI components were detected.

## Common Patterns

**Async Verification (Python):**
- Uses `requests` with retry logic and timeouts for external API calls (`call_ollama`).

**Error Reporting:**
- Scripts provide detailed console output for failures to aid in manual debugging.
- Validation scripts in CI trigger failure alerts if data integrity is compromised.

---

*Testing analysis: 2025-05-12*
