# Mobile Responsive UI Plan

## Context

### Original Request
Optimize all pages for mobile smartphone usage. The current web app works well on desktop but has horizontal scrolling and text wrapping issues on mobile. Add a "View All" button to the bottom navigation to access hidden pages (Analytics, Reports, Management, User Management).

### Current State Analysis
- **Layout**: `Layout.tsx` uses MUI `Box` flex layout with `Header` + `Sidebar` + main content + `MobileBottomNav`
- **Bottom Nav** (`MobileBottomNav.tsx`): Shows only 4 items (Dashboard, Inspection, Defects, AI Insights). Pages marked `hideOnMobile: true` in Sidebar (Analytics, Reports, Management, User Management) are inaccessible from bottom nav
- **Sidebar** (`Sidebar.tsx`): Mobile drawer shows filtered items excluding `hideOnMobile: true` pages. Desktop shows all
- **Breakpoints**: MUI default breakpoints used (`md` = 900px for mobile/desktop split via `theme.breakpoints.down('md')`)
- **DataTable**: Has `renderMobileCard` prop and `isMobile` detection, but not all consumers use it
- **DashboardPage**: Already has mobile card view for inspections table (good pattern)
- **DefectsList**: Uses DataTable but no `renderMobileCard` - table likely causes horizontal scroll
- **AnalyticsPage**: Uses Grid layout (xs:12/lg:3 for filters, xs:12/lg:9 for content) - filter sidebar stacks on mobile but charts may overflow
- **Header**: Factory toggle, notification bell, theme toggle, language toggle, user menu - all inline, may crowd on small screens
- **Pages with Tabs** (Analytics, Reports, Management): Tabs not set to `scrollable` consistently

### Key Problems Identified
1. Bottom nav only shows 4 of 8 pages; `hideOnMobile` pages completely inaccessible without hamburger menu
2. DataTable-based pages (Defects, Management sub-pages, User Management, Reports) show full tables on mobile causing horizontal scroll
3. Page titles use `variant="h4"` which is large on mobile
4. Header toolbar items may overflow on very small screens (< 360px)
5. Analytics charts (Recharts) may not resize properly in narrow viewports
6. Management page tabs may not scroll on mobile

---

## Work Objectives

### Core Objective
Make every page fully usable on mobile smartphones (320px-480px width) without horizontal scrolling, and ensure all navigation items are accessible.

### Deliverables
1. "View All" navigation button added to MobileBottomNav
2. All DataTable instances render mobile-friendly card views
3. All page headers responsive (h5 on mobile, h4 on desktop)
4. Header toolbar optimized for narrow screens
5. Analytics/Reports/Management tabs set to scrollable on mobile
6. Charts render within viewport width

### Definition of Done
- No horizontal scroll on any page at 360px viewport width
- All 8 navigation destinations reachable on mobile
- Text does not overflow or get clipped
- Touch targets are minimum 44x44px
- All existing functionality preserved on desktop

---

## Guardrails

### Must Have
- i18n for all new UI text (both `ko` and `vi` translation files)
- Works with both light and dark themes
- Safe area insets for iOS (already partially implemented)
- No breaking changes to desktop layout

### Must NOT Have
- Do NOT create a completely new layout system; enhance existing MUI-based approach
- Do NOT remove any existing features or pages
- Do NOT change the navigation structure for desktop
- Do NOT modify shadcn/ui components in `src/components/ui/`

---

## Mobile Breakpoint Strategy

Use existing MUI breakpoints consistently:
- **Mobile**: `theme.breakpoints.down('md')` (< 900px) - already the standard in this codebase
- **Small mobile**: `theme.breakpoints.down('sm')` (< 600px) - for extra-tight layouts
- Detection pattern: `const isMobile = useMediaQuery(theme.breakpoints.down('md'))`

No custom breakpoints needed. The codebase already uses `md` as the mobile/desktop boundary.

---

## Task Flow

```
T1 (Bottom Nav "View All")
    |
T2 (Header mobile optimization)
    |
T3 (Page headers responsive)  -- can parallel with T4
    |
T4 (DataTable mobile cards)   -- can parallel with T3
    |
T5 (Analytics page mobile)    -- depends on T4
    |
T6 (Management/Reports tabs)  -- depends on T4
    |
T7 (Verification & polish)    -- depends on all
```

---

## Detailed TODOs

### T1: MobileBottomNav "View All" Button
**Files:**
- `C:\Work Drive\APP\CNC_QC_KPI\src\components\layout\MobileBottomNav.tsx`
- `C:\Work Drive\APP\CNC_QC_KPI\src\locales\ko\translation.json`
- `C:\Work Drive\APP\CNC_QC_KPI\src\locales\vi\translation.json`

**Changes:**
1. Add a 5th `BottomNavigationAction` at the rightmost position with a "More" / "View All" icon (use MUI `MoreHoriz` or `Apps` icon)
2. On tap, open a MUI `Drawer` (bottom sheet style, `anchor="bottom"`) showing all navigation items that are not in the bottom nav (Analytics, Reports, Management, User Management) filtered by user role
3. Import the nav items from Sidebar or share a common `getNavItems()` function
4. Add i18n keys: `nav.viewAll` -> KO: "전체 보기", VI: "Xem tat ca"

**Acceptance Criteria:**
- 5th icon visible on bottom nav on mobile
- Tapping opens bottom sheet with hidden pages
- Items filtered by user role (inspector sees none of the hidden pages since they're all admin/manager)
- Tapping an item navigates and closes the sheet
- Active page highlighted in the sheet

### T2: Header Mobile Optimization
**Files:**
- `C:\Work Drive\APP\CNC_QC_KPI\src\components\layout\Header.tsx`

**Changes:**
1. On xs screens (< 600px), hide the factory toggle text and show only the icon, or collapse factory + language toggles into a compact layout
2. Reduce toolbar `minHeight` to 56 on mobile (currently 64)
3. Ensure header icons have adequate touch targets (min 44px)
4. Consider hiding `OfflineIndicator` text on very small screens if it takes space

**Acceptance Criteria:**
- No header overflow on 320px width
- All header actions still accessible
- Touch targets >= 44px

### T3: Responsive Page Headers
**Files:**
- `C:\Work Drive\APP\CNC_QC_KPI\src\pages\DefectsPage.tsx`
- `C:\Work Drive\APP\CNC_QC_KPI\src\pages\AnalyticsPage.tsx`
- `C:\Work Drive\APP\CNC_QC_KPI\src\pages\ReportsPage.tsx`
- `C:\Work Drive\APP\CNC_QC_KPI\src\pages\ManagementPage.tsx`
- `C:\Work Drive\APP\CNC_QC_KPI\src\pages\InspectionPage.tsx`
- `C:\Work Drive\APP\CNC_QC_KPI\src\pages\AIInsightsPage.tsx`
- `C:\Work Drive\APP\CNC_QC_KPI\src\pages\UserManagementPage.tsx`

**Changes:**
1. Use responsive Typography variant: `variant={isMobile ? 'h5' : 'h4'}` (DashboardPage already does this)
2. Hide description text on xs screens: `sx={{ display: { xs: 'none', sm: 'block' } }}`
3. Reduce `mb` spacing on mobile: `mb: { xs: 2, md: 4 }`

**Acceptance Criteria:**
- Page titles readable without wrapping on 320px
- Description hidden on small screens to save space
- Consistent with DashboardPage pattern

### T4: DataTable Mobile Card Views
**Files:**
- `C:\Work Drive\APP\CNC_QC_KPI\src\components\common\DataTable\DataTable.tsx` (verify mobile card rendering logic)
- `C:\Work Drive\APP\CNC_QC_KPI\src\components\defects\DefectsList.tsx`
- `C:\Work Drive\APP\CNC_QC_KPI\src\components\management\ProductModelManagement.tsx`
- `C:\Work Drive\APP\CNC_QC_KPI\src\components\management\InspectionItemManagement.tsx`
- `C:\Work Drive\APP\CNC_QC_KPI\src\components\management\InspectionProcessManagement.tsx`
- `C:\Work Drive\APP\CNC_QC_KPI\src\components\management\DefectTypeManagement.tsx`
- `C:\Work Drive\APP\CNC_QC_KPI\src\components\reports\ReportList.tsx`
- `C:\Work Drive\APP\CNC_QC_KPI\src\components\user-management\UserList.tsx`

**Changes:**
1. First check if DataTable already has mobile card rendering when `renderMobileCard` is provided or has a default mobile mode
2. For DefectsList: provide a `renderMobileCard` function that shows defect info as a compact card (similar to DashboardPage's mobile inspection cards pattern - Paper with borderLeft color coding, key info stacked vertically)
3. For Management tables: provide `renderMobileCard` for each, showing key fields in a compact card layout
4. For ReportList and UserList: same pattern
5. If DataTable does NOT have built-in mobile card mode, add a simple conditional: when `isMobile && renderMobileCard`, render cards instead of table rows

**Acceptance Criteria:**
- No horizontal scroll on any data table at 360px
- All data still visible (key fields shown, secondary fields in sub-text)
- Action buttons accessible on mobile cards
- Pagination still works

### T5: Analytics Page Mobile Optimization
**Files:**
- `C:\Work Drive\APP\CNC_QC_KPI\src\pages\AnalyticsPage.tsx`
- `C:\Work Drive\APP\CNC_QC_KPI\src\components\analytics\AnalyticsFilters.tsx`
- `C:\Work Drive\APP\CNC_QC_KPI\src\components\analytics\KPICards.tsx`
- Chart components in `C:\Work Drive\APP\CNC_QC_KPI\src\components\analytics\*.tsx`

**Changes:**
1. Make filter sidebar collapsible on mobile (use an Accordion or a toggle button to show/hide filters)
2. Ensure Tabs use `variant="scrollable" scrollButtons="auto"` (already done in AnalyticsPage)
3. Verify Recharts `ResponsiveContainer` is used in all chart components (it should auto-size)
4. KPI cards: ensure 2-column grid on mobile (`xs: 6`) instead of single column for compact display
5. Reduce chart heights on mobile if needed

**Acceptance Criteria:**
- Filters accessible but don't take up entire screen
- Charts render within viewport without horizontal scroll
- Tab labels readable and scrollable
- KPI cards compact on mobile

### T6: Management & Reports Tabs Mobile
**Files:**
- `C:\Work Drive\APP\CNC_QC_KPI\src\pages\ManagementPage.tsx`
- `C:\Work Drive\APP\CNC_QC_KPI\src\pages\ReportsPage.tsx`

**Changes:**
1. Add `variant="scrollable" scrollButtons="auto"` to Tabs components (ManagementPage has 4 tabs that may overflow on mobile)
2. ReportsPage Tabs also needs scrollable variant

**Acceptance Criteria:**
- All tabs accessible via horizontal scroll on mobile
- No tab text truncation or overflow

### T7: Global Mobile Styles & Verification
**Files:**
- `C:\Work Drive\APP\CNC_QC_KPI\src\index.css`
- `C:\Work Drive\APP\CNC_QC_KPI\src\components\layout\Layout.tsx`

**Changes:**
1. Add global CSS to prevent horizontal overflow: `html, body { overflow-x: hidden; }` (safety net)
2. Verify Layout.tsx bottom padding `pb: { xs: 10, md: 3 }` is sufficient with 5-item bottom nav
3. Add `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">` if not already in `index.html`

**Acceptance Criteria:**
- No horizontal scroll on any page
- Content not hidden behind bottom nav
- Viewport meta tag prevents unwanted zoom on form inputs

---

## Commit Strategy

1. **Commit 1** (T1): "feat: add 'View All' navigation to mobile bottom nav for full page access"
2. **Commit 2** (T2): "fix: optimize header toolbar layout for narrow mobile screens"
3. **Commit 3** (T3): "fix: make page headers responsive across all pages"
4. **Commit 4** (T4): "feat: add mobile card views for all DataTable instances"
5. **Commit 5** (T5+T6): "fix: optimize analytics/management/reports for mobile viewports"
6. **Commit 6** (T7): "fix: add global mobile overflow prevention and viewport safety"

---

## Risk Identification

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| DataTable `renderMobileCard` prop not fully implemented | Medium | High | Read DataTable source fully; if needed, add conditional mobile rendering |
| Recharts charts not fitting in narrow viewport | Medium | Medium | Verify `ResponsiveContainer` usage; set `width="100%"` explicitly |
| Bottom sheet drawer conflicts with bottom nav z-index | Low | Medium | Set drawer z-index higher than bottom nav |
| Management dialog forms (add/edit) too wide on mobile | Medium | Medium | Verify dialog `maxWidth` and `fullWidth` props; use `fullScreen` on mobile |
| Translation text length differences (VI vs KO) causing layout issues | Low | Low | Test with both languages; use `noWrap` + ellipsis where needed |

---

## Verification Steps

1. **Manual test at 360px width** (Chrome DevTools, iPhone SE simulation):
   - Navigate to every page
   - Verify no horizontal scrollbar appears
   - Verify all content is readable
   - Verify "View All" bottom nav opens and shows hidden pages

2. **Touch target audit**: Verify all interactive elements are >= 44x44px

3. **Navigation completeness**: From mobile, verify every page in the app is reachable:
   - Dashboard, Inspection, Defects (bottom nav)
   - AI Insights (bottom nav)
   - Analytics, Reports, Management, User Management (via "View All")

4. **Both languages**: Switch to Vietnamese and verify no text overflow

5. **Both themes**: Verify dark mode bottom sheet and mobile cards look correct

6. **Desktop regression**: Verify desktop layout unchanged at 1280px+ width
