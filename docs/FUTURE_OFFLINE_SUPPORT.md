# Offline Support Implementation Plan (Archived)

## Goal
Enable the application to function without an active internet connection by serving cached data for reads and queueing mutations (writes) for later synchronization.

## Architecture: "Queue & Cache" Middleware

We will modify the core `request` function in `src/services/api.ts` to act as an offline-tolerant middleware.

### 1. Read Operations (GET)
- **Strategy**: Network First, Cache Fallback.
- **On Success**: The response is returned to the UI and silently saved to `localStorage` (key: `cache_endpoint`).
- **On Network Error**: The system catches the error, retrieves the last saved data from `localStorage`, and returns it with a mock "Success" status (possibly setting a flag `_fromCache: true`).

### 2. Write Operations (POST, PUT, DELETE)
- **Strategy**: Optimistic Queueing.
- **On Success**: Works normally.
- **On Network Error**:
    1. The request payload (Method, Endpoint, Body) is saved to a `syncQueue` array in `localStorage`.
    2. The function returns a "fake" success response so the UI updates optimistically (e.g., the item appears to be added).
    3. A global "Offline" banner or Toast alerts the user: "Saved offline. Will sync when online."

### 3. Synchronization (SyncManager)
- A new `syncPendingItems()` function will be created.
- **Trigger**: Runs on app mount and whenever `window.addEventListener('online')` fires.
- **Process**:
    1. Reads `syncQueue` from storage.
    2. Iterates FIFO (First-In-First-Out).
    3. Replays the API call.
    4. On success, removes item from queue.
    5. On fatal error (e.g., 400 Bad Request), moves to a "Failed Items" list (optional, for v2) or alerts user.

## Component Changes

### [MODIFY] [api.ts](file:///d:/Personal Projects/invoice system database/src/services/api.ts)
- Wrap `fetch` in a `try/catch`.
- Implement caching logic for `GET`.
- Implement queueing logic for `POST/PUT/DELETE`.
- Add `processSyncQueue` function.

### [MODIFY] [App.tsx](file:///d:/Personal Projects/invoice system database/src/App.tsx)
- Add `useEffect` to listen for network status changes.
- Add a global generic UI indicator (e.g., "You are offline. Changes will sync later.").

## Risks & Mitigations
- **ID Conflicts**: If we generate an ID locally (e.g. `temp-123`) and the database generates one `INT AUTO_INCREMENT`, we might have issues.
    - *Mitigation*: We are already using UUID/String IDs (`genId()`) on the frontend for Stock and Clients. This works perfectly for offline first.
- **Edit Conflicts**: Partial mitigation by "Last Write Wins" logic in the queue execution order.
