# EAS Update Guidelines for Community Medicine App

## Problem Identified

When running `eas update`, changes weren't visible in the production app because:

1. The update was published to the `main` branch
2. The `production` channel was pointing to the `production` branch, not `main`
3. Users on production channel didn't receive the update

## Solution Workflow for Future Updates

### 1. Always Check Channel Configuration First

```bash
eas channel:list --non-interactive
```

Verify which branches each channel points to:

- `production` channel should point to `main` branch
- `preview` channel points to `preview` branch

### 2. Update Channel if Needed

If production channel points to wrong branch:

```bash
eas channel:edit production --branch main --non-interactive
```

### 3. Publish Update to Correct Branch

Always specify the branch explicitly:

```bash
eas update --branch main --message "Your update message" --clear-cache
```

### 4. Verify Update is Live

Check that the update appears on the channel:

```bash
eas channel:view production --non-interactive
eas update:list --branch main --non-interactive --limit 3
```

### 5. Clear Cache for Critical Updates

Use `--clear-cache` flag when:

- Changing data structures (like mockData.json subsections)
- Fixing caching issues
- Ensuring immediate update delivery

## Quick Reference Command

```bash
# Complete update workflow:
git add . && git commit -m "Your message" && git push origin main
eas channel:edit production --branch main --non-interactive
eas update --branch main --message "Your message" --clear-cache
```

## Key Insight

The `--auto` flag uses current git branch but doesn't guarantee the update reaches the right channel. Always verify channel mappings after major changes.
