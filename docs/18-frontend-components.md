# 18 — Frontend Component Structure

Next.js (App Router) + TypeScript + Tailwind + shadcn/ui. State via TanStack Query (server)
+ Zustand (UI). This is a reference structure, not a mandate — adapt as the app grows.

## 1. Monorepo / app layout
```
apps/web/
  app/                         # Next.js App Router
    (auth)/login, signup, sso
    onboarding/
    dashboard/
    projects/
      page.tsx                 # list
      new/page.tsx
      [projectId]/
        layout.tsx             # project shell + context tabs
        page.tsx               # overview
        drawings/page.tsx
        drawings/[sheetId]/page.tsx   # viewer + review (workhorse)
        takeoff/page.tsx
        rooms/page.tsx
        estimate/page.tsx
        estimate/revisions/page.tsx
        reviews/page.tsx
        exports/page.tsx
    rates/page.tsx
    admin/...
    settings/page.tsx
  components/                  # app-specific composites (below)
  lib/                         # api client, hooks, utils, formatters (units/currency)
  stores/                      # zustand stores (viewer, selection, ui)
packages/
  ui/                          # design-system primitives (shadcn-based) + Storybook
  types/                       # shared TS types generated from OpenAPI
```

## 2. Design-system primitives (`packages/ui`)
`Button, IconButton, Input, Select, Combobox, Checkbox, Switch, Tabs, Dialog, Drawer,
Popover, Tooltip, Toast, Badge, Chip, Avatar, Card, Skeleton, Progress, Stepper,
DataTable (TanStack wrapper), ConfidenceChip, StatusPill, MetricCard, EmptyState,
CommandPalette`.
Each ships with all states in Storybook (default/hover/disabled/loading/error + confidence variants).

## 3. App shell
```
<AppShell>
  <Sidebar/>                 # global nav, collapsible
  <TopBar>                   # project switcher, breadcrumbs, GlobalSearch, Notifications, UserMenu
  <CommandPalette/>          # ⌘K
  <main>{children}</main>
</AppShell>
```

## 4. Component tree by surface

### Portfolio Dashboard
```
<DashboardPage>
  <MetricCardRow/>                  # active, in-review, value, time-to-est
  <ChartRow>
    <CostByDisciplineChart/> <ThroughputChart/>
  </ChartRow>
  <RecentProjectsList/>
  <MyReviewQueue/>
```

### Project shell + overview
```
<ProjectLayout>
  <ProjectHeader/>                  # name, status pill, Export button
  <ProjectTabs/>                    # Overview·Drawings·Takeoff·Rooms·Estimate·Reviews·Exports
  <ProjectOverview>
    <MetricCardRow/> <PipelineStatus/> <ConfidenceSummaryCard/>
    <CostByDisciplineChart/> <OpenReviews/> <ActivityFeed/>
  </ProjectOverview>
```

### Drawings register
```
<DrawingsPage>
  <UploadDropzone/>                 # drag-drop, zip, progress
  <UploadJobList/>                  # per-file stepper (convert→parse→interpret→takeoff)
  <DrawingRegisterTable/>           # sheet no, title, discipline, version, scale✓, status
```

### Viewer + Review (workhorse) — the most important composite
```
<SheetWorkspace>
  <ViewerToolbar/>                  # zoom, fit, layers, measure, markup, compare, calibrate
  <SheetThumbnailsRail/>
  <DrawingViewer>                   # PDF.js / OpenSeadragon + WebGL overlay layer
     <OverlayLayer>                 # room polygons, count pins, length/area overlays
        <ElementOverlay confidence/>
     </OverlayLayer>
     <Minimap/>
  </DrawingViewer>
  <LayerPanel/>
  <TakeoffSidePanel>                # rows filtered to this sheet
     <TakeoffRow/> ... <BulkActionBar/>
  </TakeoffSidePanel>
  <AuditPanel/>                     # "How was this calculated?"
  <ScaleConfirmBanner/>             # if scale unconfirmed
</SheetWorkspace>
```
**Selection sync** is shared state (Zustand `useSelectionStore`): selecting a row updates
`selectedElementId` → viewer pans/pulses; selecting an element opens its row + audit panel.

### Takeoff grid
```
<TakeoffPage>
  <TakeoffFilters/>                 # discipline, confidence band, status, sheet, search
  <TakeoffGrid/>                    # virtualized, grouped, editable (TanStack Table)
     <GroupHeader subtotal/> <EditableCell/> <ConfidenceChip/> <RowStatus/>
  <BulkActionBar/>
  <ColumnCustomizer/> <SavedViews/>
```

### Rooms
```
<RoomsPage>
  <RoomList/>                       # area, perimeter, height, item count, cost
  <RoomDetail>
    <RoomPlanThumbnail/>            # highlighted room
    <RoomQuantitiesTable/>
  </RoomDetail>
```

### Rate library
```
<RatesPage>
  <RateLibrarySelector/>
  <RateImportDialog/>               # CSV/Excel column mapper
  <RatesTable/>                     # editable, mapped to cost items
```

### Estimate builder
```
<EstimatePage>
  <EstimateHeader/>                 # revision, status, confidence%, actions
  <PricedGrid/>                     # grouped lines + subtotals
  <TotalsPanel/>                    # direct→overhead→markup→contingency→tax→total (editable)
  <CostCharts/>                     # by discipline / by room
</EstimatePage>
<RevisionComparePage> <RevisionDiffTable/> </RevisionComparePage>
```

### Reviews / Export / Admin
```
<ReviewsPage> <ReviewQueue/> <ApprovalRequestCard/> </ReviewsPage>
<ExportsPage> <NewExportForm/> <ExportHistoryTable/> </ExportsPage>
<AdminPages> <UsersRolesMatrix/> <TaxonomyManager/> <Integrations/> <AuditLogViewer/> </AdminPages>
```

## 5. State management
- **Server state:** TanStack Query per resource (`useProjects`, `useSheet`, `useTakeoffItems`,
  `useEstimate`); optimistic updates for grid edits with rollback on `409`.
- **UI state (Zustand):**
  - `useViewerStore` — zoom/pan, active layers, overlay visibility.
  - `useSelectionStore` — selected element/row, hover, audit-panel open.
  - `useUiStore` — sidebar collapsed, theme, command palette.
- **Realtime:** a WS hook (`useJobProgress(jobId)`, `useProjectChannel(id)`) invalidates
  relevant queries on `job.done` / `takeoff.updated`.

## 6. Data fetching & types
- API client generated from OpenAPI → fully typed hooks in `lib/api`.
- Shared `packages/types` keeps FE/BE contracts aligned (no drift).
- Formatters in `lib/format` handle units (metric/imperial) and currency consistently.

## 7. Performance patterns
- **Virtualize** the takeoff grid (10k+ rows) and thumbnail rails.
- **Tile + lazy-load** drawing imagery; render overlays in WebGL/Canvas, not DOM, for large counts.
- Debounce filters; memoize group/rollup computations; suspense + skeletons for perceived speed.
- Code-split heavy routes (viewer, grid, estimate) and the PDF/CAD libraries.

## 8. Accessibility & theming
- Radix primitives → keyboard nav + ARIA out of the box; visible focus rings; `prefers-reduced-motion`.
- Light/dark via CSS variables (design tokens). Tabular-nums for all numeric columns.
