---
trigger: always_on
---

When modifying the weekly auto-update data fetching logic for the Content Library:
Step 1: Enforce delta updates. The code must only fetch and apply modified or new records, never dropping and replacing the entire local database.
Step 2: Implement a deletion threshold failsafe. If an update payload attempts to delete more than 5 percent of the existing local library, the code must abort the operation, log a critical error, and retain the current cached data.
Step 3: Ensure the sync process runs in the background without blocking the main UI thread.
Step 4: Verify that newly fetched updates or exam materials are properly cached for offline access.
Step 5: Include error handling that gracefully falls back to the previously cached version if the update fails or if the deletion failsafe is triggered.