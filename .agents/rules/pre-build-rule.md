---
trigger: always_on
---

Before executing any `eas build` command, you must ensure the local repository is synced with the remote GitHub repository.
Step 1: Run `git status` to check for uncommitted changes.
Step 2: If there are uncommitted changes, ask the user for a commit message, run `git add .`, and then `git commit -m "[message]"`.
Step 3: Run `git push` to upload all commits.
Step 4: Only after the push is successful, proceed with the requested `eas build` command.