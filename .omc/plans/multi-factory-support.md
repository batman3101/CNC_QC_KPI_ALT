# Multi-Factory Support Plan

## Context

### Original Request
Add multi-factory (plant) support to the CNC QC KPI application. Two factories: ALT (800 machines) and ALV (350 machines). All operational pages must be factory-scoped. Management pages remain shared.

### Current State
- No factory concept exists in database, types, auth, or services
- All data is global/unscoped
- Services query Supabase directly with filters (date, status, model, machine, user)
- Auth store holds `UserProfile { id, email, name, role }` with no factory field
- Header has: notification bell, offline indicator, theme toggle, language toggle, user menu
- **Mock mode is dead.** `src/config/app.config.ts` has no mock toggle. `src/ui_test/` directory does not exist. The app is Supabase-only.
- `inspection_results` table is queried directly in `inspectionService.ts` via `getInspectionResults(inspectionId)`, `createInspectionResult()`, and `createInspectionResults()` -- all scoped by `inspection_id`, so factory filtering is inherited via the parent inspection. No direct factory filter needed on `inspection_results`.
- `offlineSyncService.ts` caches machines and saves offline inspections via IndexedDB (Dexie). Both need factory_id support.

### Research Findings
- `src/services/userService.ts` has CRUD for users (getUsers, getUserById, createUser, updateUser, deleteUser, getUserCountsByRole). All need `factory_id` awareness.
- `src/services/offlineSyncService.ts` caches machines globally and saves offline inspections without factory_id. Both cached machines and offline inspection payloads need factory_id.
- `src/lib/offlineDb.ts` defines `CachedMachine { id, name, model, status, cached_at }` and `OfflineInspection` -- both need factory_id fields.

## Work Objectives

### Core Objective
Enable factory-scoped data isolation so users see only their factory's data, with admin users able to switch between factories.

### Deliverables
1. `factories` table and `factory_id` columns on `users`, `machines`, `inspections`, `defects`
2. RLS policies enforcing factory-scoped access
3. Factory store (Zustand) for active factory selection
4. Factory toggle button in Header
5. All services (including userService, offlineSyncService) accept and apply `factory_id` filter
6. All operational pages pass active factory to queries
7. Management pages remain unfiltered by factory
8. i18n keys for factory names and UI elements (KO + VI, separate files)

### Definition of Done
- User with factory_id=ALT sees only ALT machines, inspections, defects, analytics
- Admin can toggle between ALT and ALV and see respective data
- Non-admin users cannot switch factories; toggle is hidden or disabled
- Management pages (product models, inspection items, processes, defect types) show all data regardless of factory
- All new UI text has both KO and VI translations
- Offline sync correctly includes factory_id in cached data and outbound payloads

## Must Have
- Factory isolation on all operational queries
- `factory_id` directly on `defects` table (decided: direct column for query performance)
- Admin can access all factories
- Non-admin locked to assigned factory
- Shared management pages (no factory filter)
- Bilingual support for all new text
- Offline sync factory awareness

## Must NOT Have
- Separate deployments per factory
- Factory-specific product models or inspection items
- Changes to authentication flow (login remains the same)
- URL-based factory routing (use state, not URL path)
- Any mock mode references or mock services

---

## Task Flow

```
Task 1 (DB Schema + RLS) --> Task 2 (Types) --> Task 3 (Factory Store) --> Task 4 (Header Toggle)
                                             \-> Task 5 (Services)       --> Task 6 (Pages)
                                             \-> Task 7 (Auth/Access)
Task 8 (i18n) can run in parallel with Tasks 3-7
Task 9 (Machine Data) depends on Task 1
Task 10 (Offline Sync) depends on Tasks 2, 3
```

---

## Detailed TODOs

### Task 1: Database Schema Changes + RLS Policies (Supabase Migration)

**File: New SQL migration**

1. Create `factories` table:
   ```sql
   CREATE TABLE factories (
     id TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     name_vi TEXT,
     code TEXT UNIQUE NOT NULL,
     is_active BOOLEAN DEFAULT true,
     created_at TIMESTAMPTZ DEFAULT now()
   );
   INSERT INTO factories (id, name, name_vi, code) VALUES
     ('ALT', 'ALT 공장', 'Nha may ALT', 'ALT'),
     ('ALV', 'ALV 공장', 'Nha may ALV', 'ALV');
   ```

2. Add `factory_id` to `users`:
   ```sql
   ALTER TABLE users ADD COLUMN factory_id TEXT REFERENCES factories(id);
   UPDATE users SET factory_id = 'ALT';
   ```

3. Add `factory_id` to `machines`:
   ```sql
   ALTER TABLE machines ADD COLUMN factory_id TEXT REFERENCES factories(id);
   UPDATE machines SET factory_id = 'ALT';
   ```

4. Add `factory_id` to `inspections`:
   ```sql
   ALTER TABLE inspections ADD COLUMN factory_id TEXT REFERENCES factories(id);
   UPDATE inspections SET factory_id = 'ALT';
   ```

5. Add `factory_id` directly to `defects` table (denormalized for query performance -- avoids joins through inspections):
   ```sql
   ALTER TABLE defects ADD COLUMN factory_id TEXT REFERENCES factories(id);
   UPDATE defects SET factory_id = 'ALT';
   ```

6. Create indexes:
   ```sql
   CREATE INDEX idx_machines_factory ON machines(factory_id);
   CREATE INDEX idx_inspections_factory ON inspections(factory_id);
   CREATE INDEX idx_defects_factory ON defects(factory_id);
   CREATE INDEX idx_users_factory ON users(factory_id);
   ```

7. RLS policies (actual SQL):
   ```sql
   -- Enable RLS on all tables
   ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
   ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
   ALTER TABLE defects ENABLE ROW LEVEL SECURITY;

   -- Helper function: get current user's factory_id
   CREATE OR REPLACE FUNCTION auth.user_factory_id()
   RETURNS TEXT AS $$
     SELECT factory_id FROM public.users WHERE id = auth.uid()
   $$ LANGUAGE sql SECURITY DEFINER STABLE;

   -- Helper function: check if current user is admin
   CREATE OR REPLACE FUNCTION auth.is_admin()
   RETURNS BOOLEAN AS $$
     SELECT role = 'admin' FROM public.users WHERE id = auth.uid()
   $$ LANGUAGE sql SECURITY DEFINER STABLE;

   -- Machines: users see their factory's machines, admins see all
   CREATE POLICY machines_factory_policy ON machines
     FOR ALL USING (
       auth.is_admin() OR factory_id = auth.user_factory_id()
     );

   -- Inspections: users see their factory's inspections, admins see all
   CREATE POLICY inspections_factory_policy ON inspections
     FOR ALL USING (
       auth.is_admin() OR factory_id = auth.user_factory_id()
     );

   -- Defects: users see their factory's defects, admins see all
   CREATE POLICY defects_factory_policy ON defects
     FOR ALL USING (
       auth.is_admin() OR factory_id = auth.user_factory_id()
     );

   -- Users: users can see users in their factory, admins see all
   CREATE POLICY users_factory_policy ON users
     FOR SELECT USING (
       auth.is_admin() OR factory_id = auth.user_factory_id()
     );

   -- Factories: all authenticated users can read
   ALTER TABLE factories ENABLE ROW LEVEL SECURITY;
   CREATE POLICY factories_read_policy ON factories
     FOR SELECT USING (auth.uid() IS NOT NULL);
   ```

8. Note on `inspection_results`: This table is always queried by `inspection_id` (see `getInspectionResults(inspectionId)` in `inspectionService.ts`). Factory scoping is inherited via the parent `inspections` row. No `factory_id` column needed on `inspection_results`.

**Acceptance Criteria:** Migration runs without error. All existing data gets factory_id = 'ALT'. RLS policies enforce factory scoping at the database level.

---

### Task 2: TypeScript Type Updates

**File: `src/types/database.ts`**

1. Add `factories` table type (Row, Insert, Update)
2. Add `factory_id: string` to `users` Row/Insert/Update
3. Add `factory_id: string` to `machines` Row/Insert/Update
4. Add `factory_id: string` to `inspections` Row/Insert/Update
5. Add `factory_id: string` to `defects` Row/Insert/Update

**File: `src/types/factory.ts` (NEW)**

1. Define:
   ```typescript
   export type FactoryCode = 'ALT' | 'ALV'
   export interface Factory {
     id: string
     name: string
     name_vi: string | null
     code: FactoryCode
     is_active: boolean
   }
   ```

**Acceptance Criteria:** TypeScript compiles with no errors after type changes.

---

### Task 3: Factory Store (Zustand)

**File: `src/stores/factoryStore.ts` (NEW)**

1. Create Zustand store with persist:
   ```typescript
   interface FactoryState {
     activeFactoryId: FactoryCode | null
     setActiveFactory: (id: FactoryCode) => void
   }
   ```
2. Persist `activeFactoryId` to localStorage
3. On login, initialize `activeFactoryId` from user's `factory_id`
4. Admin users: default to their factory but can switch
5. Non-admin users: locked to their factory

**Acceptance Criteria:** Store persists across page reloads. Admin can change value, non-admin cannot.

---

### Task 4: Header Factory Toggle

**File: `src/components/layout/Header.tsx`**

1. Add factory toggle button to the LEFT of the notification bell (leftmost position in the right-side button group)
2. Style: Similar to language toggle button - outlined button showing factory code (ALT/ALV)
3. Admin users: clicking toggles between factories
4. Non-admin users: show factory label but disable toggle
5. Use `useFactoryStore` to read/write active factory
6. Use `useAuthStore` to check if user is admin

**Acceptance Criteria:** Factory code visible in header. Admin can click to switch. Non-admin sees label only.

---

### Task 5: Service Layer Factory Filtering

**Files to modify:**
- `src/services/inspectionService.ts`
- `src/services/analyticsService.ts`
- `src/services/reportService.ts`
- `src/services/geminiService.ts`
- `src/services/userService.ts`

For each service:

1. Add `factoryId?: string` parameter to all query functions
2. When `factoryId` is provided, add `.eq('factory_id', factoryId)` to Supabase queries

**Specific changes for `src/services/userService.ts`:**

1. `getUsers()` -> add optional `factoryId` param, filter by factory_id
2. `createUser()` -> add `factory_id` to `CreateUserInput` interface and include in auth signup metadata and users table update
3. `updateUser()` -> add `factory_id` to `UpdateUserInput` interface, include in update payload
4. `getUserCountsByRole()` -> add optional `factoryId` param for factory-scoped counts

**Specific changes for `src/services/inspectionService.ts`:**

1. `getInspections()` -> add factory_id filter
2. `createInspectionRecord()` -> include factory_id in insert payload
3. `getDefects()` -> add `.eq('factory_id', factoryId)` directly on defects table (no join needed since factory_id is denormalized)
4. `createDefect()` -> include factory_id in insert payload
5. `getInspectionResults()` -- NO CHANGE (scoped by inspection_id, factory inherited)

**For `src/services/analyticsService.ts`:**
- All analytics query functions: add factory_id filter to inspections and defects queries

**For `src/services/reportService.ts`:**
- Add factory_id filter to all report data queries

**For `src/services/geminiService.ts`:**
- Pass factory context (factory name/code) to AI prompts

**File: `src/services/managementService.ts`**
- NO changes for product_models, inspection_items, inspection_processes, defect_types (shared)
- Machine management functions: add factory_id filter (machines ARE factory-scoped)

**Acceptance Criteria:** Every operational query accepts and applies factoryId. Management queries for shared entities remain unfiltered. userService reads/writes factory_id on user records.

---

### Task 6: Page-Level Factory Awareness

**Files: All page components**

For each operational page, add factory filtering:

1. **`src/pages/DashboardPage.tsx`**: Pass `activeFactoryId` to all data queries
2. **`src/pages/InspectionPage.tsx`**: Filter machine list by factory; save inspection with factory_id
3. **`src/pages/DefectsPage.tsx`**: Filter defects by factory using direct factory_id column
4. **`src/pages/AnalyticsPage.tsx`**: Pass factory_id to all analytics queries
5. **`src/pages/ReportsPage.tsx`**: Pass factory_id to report generation
6. **`src/pages/AIInsightsPage.tsx`**: Pass factory context to AI analysis
7. **`src/pages/MonitorPage.tsx`**: Filter by factory

Pattern for each page:
```typescript
import { useFactoryStore } from '@/stores/factoryStore'
const { activeFactoryId } = useFactoryStore()
useQuery({
  queryKey: ['inspections', activeFactoryId, ...],
  queryFn: () => getInspections({ factoryId: activeFactoryId, ... })
})
```

8. **`src/pages/ManagementPage.tsx`**: NO factory filter for product models, inspection items, processes, defect types. Machine management tab DOES need factory filter.
9. **`src/pages/UserManagementPage.tsx`**: Show factory assignment field when editing users. Use factory_id from userService.

**Acceptance Criteria:** Switching factory in header immediately updates data on all pages. Management pages (except machines) show all-factory data.

---

### Task 7: Auth/Access Control

**File: `src/stores/authStore.ts`**

1. Add `factory_id: string | null` to `UserProfile` interface

**File: `src/hooks/useAuth.ts`**

1. On login, fetch user's `factory_id` from users table
2. Set it on profile and initialize factoryStore

**File: `src/stores/factoryStore.ts`**

1. Add guard: `setActiveFactory` checks if user is admin before allowing change
2. Non-admin: silently ignore or warn

**File: `src/components/layout/Header.tsx`**

1. Factory toggle disabled for non-admin users

**Acceptance Criteria:** Non-admin user assigned to ALT cannot view ALV data. Admin can freely switch.

---

### Task 8: Translation Updates

**File: `src/locales/ko/translation.json`**

Add keys:
```json
{
  "factory": {
    "label": "공장",
    "alt": "ALT 공장",
    "alv": "ALV 공장",
    "select": "공장 선택",
    "switchTo": "{{factory}}(으)로 전환",
    "noAccess": "접근 권한이 없습니다",
    "current": "현재 공장",
    "assignment": "공장 배정"
  }
}
```

**File: `src/locales/vi/translation.json`**

Add keys:
```json
{
  "factory": {
    "label": "Nha may",
    "alt": "Nha may ALT",
    "alv": "Nha may ALV",
    "select": "Chon nha may",
    "switchTo": "Chuyen sang {{factory}}",
    "noAccess": "Ban khong co quyen truy cap",
    "current": "Nha may hien tai",
    "assignment": "Phan cong nha may"
  }
}
```

**Acceptance Criteria:** All factory-related UI text displays correctly in both KO and VI. Each language file has its own properly localized values.

---

### Task 9: Machine Data Expansion

**Via Supabase SQL or admin UI:**

1. ALT factory: Ensure machines CNC-001 through CNC-800 exist with `factory_id = 'ALT'`
2. ALV factory: Create machines CNC-001 through CNC-350 with `factory_id = 'ALV'`
3. Machine names: Use format like `CNC-001`, `CNC-002`, etc.
4. Note: Machine names can overlap between factories (both have CNC-001) because factory_id differentiates them

**Acceptance Criteria:** ALT has 800 machines, ALV has 350 machines, all queryable by factory_id.

---

### Task 10: Offline Sync Factory Support

**File: `src/lib/offlineDb.ts`**

1. Add `factory_id: string` to `CachedMachine` interface
2. Add `factory_id: string` to `OfflineInspection` interface
3. Bump Dexie schema version to include new fields

**File: `src/services/offlineSyncService.ts`**

1. `OfflineInspectionInput`: Add `factory_id: string` field
2. `saveInspectionOffline()`: Include `factory_id` in the stored `OfflineInspection` object
3. `syncPendingInspections()`: The `factory_id` is already in the payload and will be passed through to `inspectionService.createInspectionRecord()` (which Task 5 updates to accept factory_id)
4. `cacheReferenceData()`: Accept `factoryId` parameter. When caching machines, call `managementService.getMachines({ factoryId })` to cache only the active factory's machines. Include `factory_id` in `CachedMachine` entries.
5. `getCachedMachines()`: Optionally filter by factory_id from IndexedDB

**Acceptance Criteria:** Offline inspections include factory_id in cached payloads. When synced, factory_id is transmitted to the server. Cached machines are factory-scoped.

---

### Task 11: Notification Badge Factory Scoping

**File: `src/components/layout/Header.tsx`**

1. The defect notification badge query currently fetches ALL defects globally
2. Update to filter by `activeFactoryId` using direct `factory_id` column on defects table

**Acceptance Criteria:** Badge count reflects only active factory's pending defects.

---

## Commit Strategy

1. **Commit 1**: Database migration SQL + RLS policies + TypeScript types (Tasks 1, 2)
2. **Commit 2**: Factory store + Header toggle + i18n (Tasks 3, 4, 8)
3. **Commit 3**: Service layer factory filtering including userService (Task 5)
4. **Commit 4**: Offline sync factory support (Task 10)
5. **Commit 5**: Page-level integration + auth updates + notification badge (Tasks 6, 7, 11)
6. **Commit 6**: Machine data expansion (Task 9)

## Success Criteria

- [ ] ALT user sees only ALT machines, inspections, defects, analytics
- [ ] ALV user sees only ALV machines, inspections, defects, analytics
- [ ] Admin can toggle between ALT and ALV; data updates immediately
- [ ] Non-admin cannot switch factories
- [ ] Management pages (product models, inspection items, processes, defect types) show all data
- [ ] Machine management page is factory-filtered
- [ ] All new UI text in both Korean and Vietnamese (separate translation files)
- [ ] Existing data preserved with factory_id = 'ALT'
- [ ] No TypeScript compilation errors
- [ ] Notification badge is factory-scoped
- [ ] RLS policies enforce factory isolation at database level
- [ ] `defects` table has direct `factory_id` column (no join needed)
- [ ] `userService.ts` reads/writes `factory_id` on user records
- [ ] Offline sync includes factory_id in cached machines and offline inspection payloads
- [ ] `inspection_results` scoped via parent inspection (documented, no direct factory_id)
- [ ] No mock mode references anywhere in the codebase
