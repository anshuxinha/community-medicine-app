# Codebase Structure

**Analysis Date:** 2025-05-13

## Directory Layout

```
[project-root]/
├── assets/             # Static assets (images, icons, pyq)
├── android/            # Native Android project files
├── docs/               # Documentation and privacy policies
├── scripts/            # Build, sync, and utility scripts (Python/JS)
├── src/                # Main application source code
│   ├── components/     # Reusable UI components
│   ├── config/         # App configuration (Firebase)
│   ├── context/        # Global state management (Context API)
│   ├── data/           # Static content, JSON data, and mocks
│   ├── hooks/          # Custom React hooks
│   ├── navigation/     # Routing and navigation configuration
│   ├── screens/        # Screen components (Views)
│   ├── services/       # Business logic and external API services
│   ├── styles/         # Global styles and theme definitions
│   └── utils/          # Helper functions and utilities
├── App.js              # Application entry point
├── app.json            # Expo configuration
├── index.js            # Registered entry point
└── package.json        # Dependencies and scripts
```

## Directory Purposes

**src/components:**
- Purpose: Shared UI elements used across multiple screens.
- Contains: `DrawerMenu.js`, `ReadingView.js`, `DropdownPicker.js`.
- Key files: `ReadingView.js` (handles content rendering and annotations).

**src/context:**
- Purpose: Centralized state management using React Context.
- Contains: `AppContext.js`.
- Key files: `AppContext.js` (the "heart" of the app state).

**src/navigation:**
- Purpose: Defines the navigation tree and access control.
- Contains: Navigation stacks and tabs.
- Key files: `AppNavigator.js`.

**src/screens:**
- Purpose: Page-level components representing distinct app views.
- Contains: `DashboardScreen.js`, `LibraryScreen.js`, `ReadingScreen.js`, `LoginScreen.js`.

**src/services:**
- Purpose: Integration with external services and complex business logic.
- Contains: `notificationService.js`, `annotationService.js`, `videoService.js`.

**src/data:**
- Purpose: Holds static JSON data and mock content.
- Contains: `mockData.json`, `updates.json`, `gemsData.json`.

## Key File Locations

**Entry Points:**
- `App.js`: Main React entry point with providers.
- `index.js`: Expo/React Native entry point.

**Configuration:**
- `app.json`: Expo project configuration.
- `src/config/firebase.js`: Firebase SDK initialization.

**Core Logic:**
- `src/context/AppContext.js`: Manages user session, premium status, and sync.
- `src/utils/contentRegistry.js`: Validates content keys and handles read counts.

**Testing:**
- Not detected (no `__tests__` or `*.test.js` files in the source tree).

## Naming Conventions

**Files:**
- PascalCase for React components/screens: `DashboardScreen.js`, `ReadingView.js`.
- camelCase for services/utils/hooks: `notificationService.js`, `useSessionEnforcer.js`.

**Directories:**
- lowercase: `components`, `screens`, `services`.

## Where to Add New Code

**New Feature (Screen):**
- Primary code: `src/screens/NewFeatureScreen.js`
- Register in: `src/navigation/AppNavigator.js`

**New Component:**
- Implementation: `src/components/NewComponent.js`

**New Service/Integration:**
- Implementation: `src/services/newService.js`
- Configuration: `src/config/` (if needed)

**Utilities:**
- Shared helpers: `src/utils/newHelper.js`

## Special Directories

**scripts/:**
- Purpose: Contains administrative and development scripts for data management.
- Generated: No
- Committed: Yes

**assets/:**
- Purpose: Images, fonts, and other static files.
- Committed: Yes

---

*Structure analysis: 2025-05-13*
