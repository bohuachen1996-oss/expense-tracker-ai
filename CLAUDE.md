# Expense Tracker AI — Claude Instructions

## Project Overview
A personal expense tracking web app built with Next.js 14 App Router, TypeScript, and Tailwind CSS v4. Data is persisted in localStorage (no backend).

## Tech Stack
- **Framework:** Next.js 16 (App Router, all pages use `'use client'`)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS v4 — no `tailwind.config.js`, configured via `@theme` in `globals.css`
- **Charts:** Recharts v3
- **Date handling:** date-fns v4
- **Icons:** lucide-react
- **Forms:** react-hook-form v7 + @hookform/resolvers v5 + Zod v4
- **Package manager:** npm (use `npm install --cache /tmp/npm-cache-fix` to avoid cache permission errors)

## Project Structure
```
app/                        # Next.js App Router pages
  layout.tsx                # Root layout with Sidebar + MobileNav
  dashboard/page.tsx        # Main dashboard
  expenses/page.tsx         # Expense list
  expenses/add/page.tsx     # Add expense form
components/
  ui/                       # Reusable primitives: Button, Input, Select, Card, Modal, Badge, Toast
  layout/Navigation.tsx     # Sidebar (desktop) + MobileNav (mobile top bar + bottom nav)
  dashboard/                # SummaryCards, SpendingChart, CategoryChart, RecentExpenses
  expenses/                 # ExpenseForm, ExpenseList, ExpenseItem, ExpenseFilters
  export/                   # ExportModal (v2 — merged to main)
  export-hub/               # ExportDrawer (v3 — PR open, not merged)
hooks/
  useExpenses.ts            # All expense CRUD, localStorage persistence
lib/
  types.ts                  # Core TypeScript interfaces (Expense, Category, etc.)
  utils.ts                  # Formatting, analytics, exportToCSV
  storage.ts                # localStorage read/write, sample data seeding
  exporters.ts              # Multi-format export logic (CSV, JSON, PDF)
  exportTemplates.ts        # Export template definitions (v3)
  exportHistory.ts          # Export history + schedule + integrations state (v3)
```

## Key Conventions

### TypeScript
- Zod v4 uses `message:` not `invalid_type_error:` / `required_error:`
- Use `useForm<any>` with `resolver: zodResolver(schema) as any` to work around hookform/resolvers v5 + Zod v4 type incompatibility
- Use `valueAsNumber: true` in `register()` for number inputs

### Components
- All components are client components (`'use client'` at top)
- Shared UI primitives live in `components/ui/` — use them, don't reinvent
- `Button` supports `variant` (primary/secondary/ghost/danger), `size` (sm/md/lg), `loading`, `icon`
- `Input` supports `leftIcon`, `error`, `hint`, `label`
- `Select` does NOT support `leftIcon` — omit it

### Styling
- Tailwind v4: standard utility classes work as normal
- Custom animations defined in `globals.css` (e.g., `animate-in slide-in-from-bottom-2`)
- Primary color: indigo-600 (`#6366f1`)
- Background: gray-50 (`#f8fafc`)
- Category colors defined in `lib/utils.ts: CATEGORY_COLORS`

### Data Layer
- All expenses stored in localStorage under key `expense-tracker-expenses`
- `useExpenses()` hook is the single source of truth — always use it in pages
- Sample data auto-seeded on first load via `lib/storage.ts`
- Categories: Food, Transportation, Entertainment, Shopping, Bills, Other

## Core Principles (SOLID)

Apply SOLID principles to all code:
- **Single Responsibility**: Each component/hook/utility does one thing. Don't add unrelated logic.
- **Open/Closed**: Extend behavior via props/composition, not by modifying shared primitives.
- **Liskov Substitution**: Components accepting the same props must behave consistently.
- **Interface Segregation**: Pass only the props a component needs — don't over-prop components.
- **Dependency Inversion**: Components depend on hooks/abstractions (`useExpenses`), not raw localStorage calls.

## Development Workflow

1. Create a feature branch: `git checkout -b feature/<name>`
2. Make changes — keep commits focused and atomic
3. Type-check before every commit: `npx tsc --noEmit`
4. Write a detailed commit message explaining *why*, not just *what*
5. Push and open a PR via `gh pr create`
6. Merge only after type-check passes

## Quality Gates

Before merging any PR:
- [ ] `npx tsc --noEmit` — zero errors, zero warnings
- [ ] `npm run build` — production build succeeds
- [ ] No new `any` casts without a comment explaining why
- [ ] No unused imports or variables
- [ ] ESLint clean (run `npx eslint .` if in doubt)

## Git Workflow
- Main branch: `main`
- Feature branches: `feature-<name>` or `feature-<name>-v<n>`
- GitHub remote: `https://github.com/bohuachen1996-oss/expense-tracker-ai`
- GitHub CLI (`gh`) is installed and authenticated as `bohuachen1996-oss`
- Always run `npx tsc --noEmit` before committing

## Known Issues / Gotchas
- `npm install` may fail with EACCES — use `npm install --cache /tmp/npm-cache-fix`
- Tailwind v4 has no `tailwind.config.js` — don't create one
- `date-fns` format function conflicts with local variables named `format` — alias as `import { format as dateFnsFormat }`
- The dev server is often already running on port 3000 — check with `lsof -i :3000` before starting
- `curl localhost:3000` returns 502 due to a local proxy — this is expected, use the browser directly

## Running the App
```bash
npm run dev        # Start dev server → http://localhost:3000
npm run build      # Production build
npx tsc --noEmit   # Type check only
```
