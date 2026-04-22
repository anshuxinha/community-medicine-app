---
trigger: always_on
---

Before executing any eas build command, you must evaluate if a full native build is necessary.

Step 1: Analyze the current branch for recent or uncommitted modifications. If the changes are strictly limited to JavaScript, TypeScript, React components, or visual assets, pause and explicitly recommend running eas update instead to conserve cloud build quotas.
Step 2: Wait for the user to confirm whether they want to proceed with eas update or force a full eas build. If the changes involve native modules, the ios or android directories, or package.json dependency updates, a full build is mandatory.
Step 3: Once the deployment method is confirmed by the user, run git status to verify the local repository state.
Step 4: If there are uncommitted changes, think of a concise commit message yourself, run git add ., and then execute git commit -m "[message]".
Step 5: Execute git pull --rebase to fetch and apply the latest updates from the remote GitHub repository. (If merge conflicts occur, pause and prompt the user to resolve them before continuing).
Step 6: Run git push to upload all commits to the remote GitHub repository.
Step 7: Only after the push is successful, proceed with executing the confirmed eas build or eas update command.