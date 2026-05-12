<!-- refreshed: 2025-05-13 -->
# Architecture

**Analysis Date:** 2025-05-13

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                      UI Layer (React Native)                │
├──────────────────┬──────────────────┬───────────────────────┤
│   Screens        │   Components     │    Themes/Styles      │
│  `src/screens`   │ `src/components` │    `src/styles`       │
└────────┬─────────┴────────┬─────────┴──────────┬────────────┘
         │                  │                     │
         ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Navigation Layer                         │
│         `src/navigation/AppNavigator.js`                     │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    State & Logic Layer                      │
│         `src/context/AppContext.js`                          │
│         `src/services/*.js`                                  │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Data & External Services                                   │
│  `src/config/firebase.js` (Firestore/Auth)                  │
│  `AsyncStorage` (Local), RevenueCat (IAP)                   │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| AppProvider | Centralized state management for Auth, Premium status, and User Data | `src/context/AppContext.js` |
| AppNavigator | Root navigation configuration, including Auth/Main stacks and Tab navigation | `src/navigation/AppNavigator.js` |
| notificationService | Management of push notifications, local triggers, and streak milestones | `src/services/notificationService.js` |
| ReadingView | Core component for rendering medical content with annotation support | `src/components/ReadingView.js` |
| contentRegistry | Central registry and validation for all content keys and read states | `src/utils/contentRegistry.js` |
| useSessionEnforcer | Hook for real-time single-device session enforcement via Firestore | `src/hooks/useSessionEnforcer.js` |

## Pattern Overview

**Overall:** React Native Provider-based Architecture with Service Layer and Real-time Session Management.

**Key Characteristics:**
- **Centralized Context:** Most application state (Auth, UI preferences, Content progress) is managed in a single large `AppContext`.
- **Route Guarding:** Access to premium features is enforced at the navigation level via `PremiumGuard` and tab listeners.
- **Service-Oriented Logic:** Business logic for notifications, annotations, and subscriptions is encapsulated in standalone service modules.
- **Session Enforcement:** Uses `onSnapshot` to monitor for device conflicts and force logout if the account is accessed elsewhere.

## Layers

**UI Layer:**
- Purpose: Render screens and handle user interaction.
- Location: `src/screens/` and `src/components/`
- Contains: React components, hooks for local UI state.
- Depends on: `src/context/AppContext.js`, `src/styles/theme.js`
- Used by: Entry point `App.js`

**Navigation Layer:**
- Purpose: Define application routing and access control.
- Location: `src/navigation/`
- Contains: Stack and Tab navigators.
- Depends on: `src/context/AppContext.js`, `src/screens/`
- Used by: `App.js`

**State Layer (Context):**
- Purpose: Manage global application state and persistence.
- Location: `src/context/`
- Contains: React Context providers, auth listeners, and sync logic.
- Depends on: `src/config/firebase.js`, `src/services/`, `src/utils/`
- Used by: Almost all UI components.

## Data Flow

### Primary Request Path (Auth & Initialization)

1. **Entry Point** (`App.js`)
2. **Auth Listener** (`src/context/AppContext.js:46` - `onAuthStateChanged`)
3. **Session Check** (`src/hooks/useSessionEnforcer.js` - Real-time device conflict monitor)
4. **Navigation Update** (`src/navigation/AppNavigator.js:125` - Switch between `Login` and `MainTabs`)

### Content Reading Flow

1. **Selection** (`src/screens/LibraryScreen.js`)
2. **Guard Check** (`src/navigation/AppNavigator.js:77` - `PremiumGuard` if applicable)
3. **Display & Progress** (`src/screens/ReadingScreen.js` -> `src/components/ReadingView.js`)
4. **State Update** (`src/context/AppContext.js` - update read count and sync to Firestore)

**State Management:**
- Global state is handled via React Context (`AppContext`).
- Local persistence uses `@react-native-async-storage/async-storage`.
- Cloud synchronization is managed via Firebase Firestore.

## Key Abstractions

**Service Modules:**
- Purpose: Encapsulate logic for external integrations and complex features.
- Examples: `src/services/notificationService.js`, `src/services/annotationService.js`
- Pattern: Stateless utility functions or stateful listeners.

**Content Registry:**
- Purpose: Ensures consistency and validation of medical content identifiers.
- Examples: `src/utils/contentRegistry.js`
- Pattern: Static registry with validation and migration helpers.

## Entry Points

**Main App Entry:**
- Location: `App.js`
- Triggers: Application launch.
- Responsibilities: Wraps the app in necessary providers (`SafeAreaProvider`, `AppContext`, `PaperProvider`) and initializes screen capture protection.

**Notification Handler:**
- Location: `src/services/notificationService.js`
- Triggers: Push notifications or local notification events.
- Responsibilities: Routes users to specific screens (e.g., Updates, Reading) based on notification data.

## Architectural Constraints

- **Threading:** Single-threaded JavaScript execution; heavy data processing (like large JSON parsing) happens on the JS thread.
- **Global state:** Centralized in `AppContext.js`, which can lead to frequent re-renders if not optimized (currently 1100+ lines).
- **Offline support:** Primarily relies on local state and `AsyncStorage`, with Firestore synchronization when online.
- **Security:** Screen capture protection is enabled for premium content (`usePreventScreenCapture` in `App.js`).

## Anti-Patterns

### Logic Inflation in Context

**What happens:** `AppContext.js` has grown significantly (1100+ lines), handling everything from auth to screen capture protection.
**Why it's wrong:** Violates Single Responsibility Principle; makes testing and maintenance difficult.
**Do this instead:** Break down into multiple contexts (e.g., `AuthContext`, `ContentContext`) or move logic to custom hooks.

## Error Handling

**Strategy:** Global Error Boundary with local try-catch in services.

**Patterns:**
- `src/components/ErrorBoundary.js` catches rendering errors.
- Service methods often include try-catch blocks with silent failures or user alerts.

## Cross-Cutting Concerns

**Logging:** Basic console logging; Firebase Analytics (implied by firebase setup).
**Validation:** Content key validation via `src/utils/contentRegistry.js`.
**Authentication:** Firebase Authentication integrated into `AppContext`.

---

*Architecture analysis: 2025-05-13*
