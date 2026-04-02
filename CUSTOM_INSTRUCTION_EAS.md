# Custom Instruction for EAS Updates

## Rule: Always Verify Channel-Branch Mapping Before EAS Update

When performing `eas update`:

1. **First check channel configuration**: Run `eas channel:list --non-interactive` to see which branches each channel points to.
2. **Ensure production points to main**: If `production` channel doesn't point to `main` branch, run `eas channel:edit production --branch main --non-interactive`.
3. **Publish to correct branch**: Always use `--branch main` explicitly, not just `--auto`.
4. **Clear cache for data/structure changes**: Use `--clear-cache` flag when updating JSON structures, assets, or critical fixes.
5. **Verify deployment**: Check `eas channel:view production --non-interactive` to confirm update is live.

## Common Pitfall Avoidance

- ❌ Don't assume `--auto` reaches production channel
- ✅ Always verify `production` channel points to `main` branch
- ✅ Use `--clear-cache` for data structure changes (mockData.json, etc.)
- ✅ Check update list after publishing to confirm

## Quick Command Sequence

```bash
# 1. Commit & push
git add . && git commit -m "message" && git push origin main

# 2. Verify/update channel
eas channel:list --non-interactive
eas channel:edit production --branch main --non-interactive

# 3. Publish with cache clearing
eas update --branch main --message "message" --clear-cache

# 4. Verify
eas channel:view production --non-interactive
```
