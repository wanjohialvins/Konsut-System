# Offline Sync Integration Implementation

## Overview
Implement offline functionality that allows users to continue working without internet, queuing operations locally and syncing automatically when connectivity is restored.

## Core Features
1. **Network Status Detection**: Monitor online/offline state
2. **Visual Status Indicator**: Top banner showing connection status
3. **Operation Queue**: Store failed/offline operations in IndexedDB
4. **Auto-Sync**: Push queued operations when back online
5. **Conflict Resolution**: Handle sync conflicts gracefully

---

## Proposed Changes

### 1. Network Status Context
**[NEW]** `src/contexts/NetworkContext.tsx`
- Monitor `navigator.onLine` and network events
- Provide `isOnline` state to entire app
- Trigger sync when connectivity restored

### 2. Sync Queue Service
**[NEW]** `src/services/syncQueue.ts`
- IndexedDB-based queue for offline operations
- Store: operation type, endpoint, payload, timestamp
- Methods: `enqueue()`, `dequeue()`, `processQueue()`

### 3. Status Bar Component
**[NEW]** `src/components/NetworkStatusBar.tsx`
- Fixed position banner at top of screen
- Shows: "Online" (green), "Offline" (red), "Syncing..." (yellow)
- Auto-hide when online, persistent when offline

### 4. API Service Updates
**[MODIFY]** `src/services/api.ts`
- Detect network failures vs server errors
- Queue operations when offline
- Retry logic with exponential backoff

### 5. Layout Integration
**[MODIFY]** `src/components/Layout.tsx`
- Add `<NetworkStatusBar />` above main content
- Provide network context to all children

---

## Implementation Steps

### Phase 1: Network Detection
1. Create `NetworkContext.tsx` with online/offline state
2. Add event listeners for `online` and `offline` events
3. Implement periodic connectivity checks (ping API)

### Phase 2: Visual Indicator
1. Create `NetworkStatusBar.tsx` component
2. Style with Tailwind (green/red/yellow states)
3. Add animations for state transitions
4. Integrate into `Layout.tsx`

### Phase 3: Sync Queue
1. Set up IndexedDB database (`konsut_sync_queue`)
2. Create queue service with CRUD operations
3. Implement operation serialization/deserialization
4. Add queue viewer for debugging (Admin only)

### Phase 4: API Integration
1. Wrap API calls with offline detection
2. Queue failed operations automatically
3. Add retry mechanism with backoff
4. Implement conflict detection

### Phase 5: Auto-Sync
1. Trigger sync on `online` event
2. Process queue sequentially
3. Update UI with sync progress
4. Handle partial failures gracefully

---

## Technical Details

### IndexedDB Schema
```typescript
interface QueuedOperation {
  id: string;              // UUID
  timestamp: number;       // Date.now()
  endpoint: string;        // e.g., 'invoices.php'
  method: 'POST' | 'PUT' | 'DELETE';
  payload: any;            // Request body
  retries: number;         // Retry count
  status: 'pending' | 'syncing' | 'failed';
}
```

### Network Status States
- **Online**: Green banner, auto-hide after 3s
- **Offline**: Red banner, persistent, shows queue count
- **Syncing**: Yellow banner, shows progress (X/Y synced)

### Conflict Resolution
- **Strategy**: Last-write-wins (server timestamp)
- **User Notification**: Toast for conflicts
- **Manual Resolution**: Admin can view/resolve conflicts

---

## User Experience

### Offline Scenario
1. User loses internet connection
2. Red banner appears: "You're offline. Changes will sync when reconnected."
3. User continues creating invoices/editing data
4. Operations queue locally (shown in banner: "3 changes pending")
5. User regains connection
6. Yellow banner: "Syncing 3 changes..."
7. Green banner: "All changes synced!" (auto-hides)

### Error Handling
- **Network Error**: Queue operation, show offline banner
- **Server Error (500)**: Don't queue, show error toast
- **Auth Error (403)**: Don't queue, redirect to login
- **Conflict**: Show notification, log for admin review

---

## Verification Plan

### Manual Testing
- [ ] Disable network, verify offline banner appears
- [ ] Create invoice offline, verify it queues
- [ ] Re-enable network, verify auto-sync
- [ ] Test with multiple queued operations
- [ ] Simulate sync failures, verify retry logic
- [ ] Test conflict scenarios

### Edge Cases
- [ ] Queue overflow (>100 operations)
- [ ] Sync during logout
- [ ] Duplicate operations
- [ ] Partial sync failures

---

## Future Enhancements
- **Service Worker**: Full PWA with offline caching
- **Smart Sync**: Prioritize critical operations
- **Bandwidth Detection**: Defer large syncs on slow connections
- **Sync History**: View past sync operations
