# React Code Review Checklist

## Component Design

- [ ] Component has a single, clear responsibility
- [ ] Props are typed with TypeScript interfaces (not `any`)
- [ ] Default props or prop validation is in place where needed
- [ ] Large components are broken into smaller composable pieces
- [ ] No business logic mixed into render — extract to hooks or utils
- [ ] `children` usage is intentional and typed correctly

## Hooks

- [ ] `useEffect` has correct dependency arrays — no missing or stale deps
- [ ] No `useEffect` used where a derived value or event handler suffices
- [ ] Custom hooks encapsulate reusable stateful logic (not copied across components)
- [ ] `useMemo` / `useCallback` are used only where measurably needed (not premature optimization)
- [ ] Refs (`useRef`) used for DOM access or mutable values that shouldn't trigger re-render

## State Management

- [ ] State lives at the right level — not hoisted unnecessarily, not duplicated
- [ ] Derived state is computed, not stored
- [ ] Context is not overused for frequently-changing values (causes unnecessary re-renders)
- [ ] Global state (Zustand / Redux / Context) is used only for truly shared state

## Data Fetching

- [ ] Data fetching is done in a hook or library (React Query, SWR, RTK Query) — not raw `useEffect`
- [ ] Loading, error, and empty states are handled
- [ ] Stale data, cache invalidation, and refetching logic is correct
- [ ] Sensitive data is not stored in component state longer than needed

## Performance

- [ ] Lists are rendered with stable, unique `key` props (not array index for dynamic lists)
- [ ] Expensive renders are memoized with `React.memo` if profiling shows benefit
- [ ] Images and assets are lazy-loaded where appropriate
- [ ] No inline function/object creation in JSX that defeats memoization

## Event Handling

- [ ] Event handlers are named `handle*` by convention
- [ ] No direct DOM manipulation (use refs or state instead)
- [ ] Form submissions prevent default and handle async errors

## Accessibility (a11y)

- [ ] Interactive elements are keyboard-accessible
- [ ] Images have meaningful `alt` text
- [ ] ARIA attributes are used correctly and only when needed
- [ ] Color contrast meets WCAG AA minimum

## Styling

- [ ] No inline styles for anything beyond truly dynamic values
- [ ] CSS class naming is consistent with project convention (BEM, Tailwind, CSS Modules, etc.)
- [ ] No hardcoded pixel values that should be design tokens

## Security (Frontend)

- [ ] No `dangerouslySetInnerHTML` without sanitization
- [ ] API keys, secrets, and tokens are NOT embedded in frontend code
- [ ] User input is not used raw in URLs, `eval()`, or DOM APIs
- [ ] Auth tokens stored securely (HttpOnly cookies preferred over localStorage)

## Testing

- [ ] Components have unit tests for key interactions and edge cases
- [ ] Async behavior is tested (loading / error states)
- [ ] User interactions tested with `userEvent`, not `fireEvent` where possible
- [ ] Snapshots are used sparingly — prefer behavior assertions

## Common React Anti-Patterns to Flag

| Anti-pattern | Issue |
|---|---|
| `useEffect` with no deps that sets state | Infinite loop risk |
| `useState` for derived data | Stale state bugs |
| Array index as `key` | Broken list reconciliation |
| Fetch inside render function body | Waterfall + race conditions |
| Prop drilling >3 levels deep | Extract to context or state library |
| Direct mutation of state object | Silent bugs, broken reactivity |
| `any` type on props or API responses | Nullifies TypeScript benefits |
