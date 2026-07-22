# Custom Instruction for EAS Updates

## Rule 0: Always Ship App Changes (Commit → Push → EAS Update) (MANDATORY)

**After any change that affects the shipped app, always commit, push, and publish an EAS Update — then give the user a short manual test checklist.**

```bash
# 1. Commit & push related work first
git add <related-files>
git commit -m "message"
git push origin main

# 2. Only then publish the OTA
```

- Do **not** run `eas update` from a dirty tree for related fixes (avoids `commit*` / unpushed drift).
- Include only files that belong to the change.
- Production channel tracks `main` — push to `origin/main` before publishing to production.
- **Test checklist:** end the reply with what to verify on device (happy path + one regression check).
- Full scope/exceptions: `Agents.md` → **App Change Ship Protocol**.

## Rule: Always Verify Channel-Branch Mapping Before EAS Update

When performing `eas update`:

1. **Commit & push** any related local changes (Rule 0).
2. **First check channel configuration**: Run `eas channel:list --non-interactive` to see which branches each channel points to.
3. **Ensure production points to main**: If `production` channel doesn't point to `main` branch, run `eas channel:edit production --branch main --non-interactive`.
4. **Publish to correct branch**: Always use `--branch main` explicitly, not just `--auto`.
5. **Clear cache for data/structure changes**: Use `--clear-cache` flag when updating JSON structures, assets, or critical fixes.
6. **Verify deployment**: Check `eas channel:view production --non-interactive` to confirm update is live.

## Common Pitfall Avoidance

- ❌ Don't `eas update` related work before commit + push
- ❌ Don't assume `--auto` reaches production channel
- ✅ Always commit & push related changes first
- ✅ Always verify `production` channel points to `main` branch
- ✅ Use `--clear-cache` for data structure changes (mockData.json, etc.)
- ✅ Check update list after publishing to confirm

## Quick Command Sequence

```bash
# 1. Commit & push (required when update is related to local changes)
git add <related-files> && git commit -m "message" && git push origin main

# 2. Verify/update channel
eas channel:list --non-interactive
eas channel:edit production --branch main --non-interactive

# 3. Publish with cache clearing
eas update --branch main --message "message" --clear-cache --environment production

# 4. Verify
eas channel:view production --non-interactive
```

## Store auto-submit release notes (iOS + Android)

When auto-submitting **store builds** to App Store and/or Play Store:

1. Always include **release notes** (not only a build message).
2. Keep them **brief** (2–4 short lines / bullets max).
3. Lead with the real user-facing change(s).
4. **Always end with one light pun** related to the update (not forced if it would be confusing; still prefer a pun).
5. Use the **same notes spirit** on both platforms when submitting both.

### Platform hooks
- **iOS (TestFlight / what to test):** `eas submit` / build auto-submit `--what-to-test "..."` when available.
- **Android (Play):** release notes via submit config / Play Console fields when EAS supports them; if CLI cannot set notes non-interactively, write the notes in the chat for the user to paste and still invent the pun.

### Example shape
```
• New video player with smoother controls
• Faster, more reliable lecture playback
Don't skip class — we fixed the buffering so you won't miss a beat.
```
