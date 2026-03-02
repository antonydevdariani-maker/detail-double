# HoverButton Integration Guide

This project uses **React (Vite)** with **Tailwind CSS** and **TypeScript** support added for the HoverButton component. The setup below is already applied; you can run `npm run dev` and open **/hover-demo** to see it.

---

## Quick start (already done)

- **Tailwind**, **TypeScript**, **path alias `@`**, **`cn()`** at `src/lib/utils.ts`, and **`src/components/ui`** are set up.
- **HoverButton** lives in `src/components/ui/hover-button.tsx`.
- **Demo route:** visit [http://localhost:5173/hover-demo](http://localhost:5173/hover-demo) (or your dev server URL) to see the demo.
- To use the button elsewhere: `import { HoverButton } from '@/components/ui/hover-button'`.

---

## Current vs Required

| Requirement      | Current state              | Action                    |
|------------------|----------------------------|---------------------------|
| shadcn structure | No                         | Use `src/components/ui`  |
| Tailwind CSS     | No (uses `index.css`)      | Install Tailwind          |
| TypeScript       | No (uses JSX)              | Add TypeScript support    |
| Path alias `@/`  | No                         | Add in Vite + tsconfig    |
| `cn()` utility   | No                         | Added at `src/lib/utils.ts` |

---

## Why `src/components/ui`?

- **shadcn/ui** expects reusable primitives in `components/ui`. Keeping them in one place makes it easy to add more shadcn components later and to run the shadcn CLI without confusion.
- Your app components stay in `src/components/` (e.g. `Header`, `BookingForm`); only shared UI primitives like HoverButton live in `src/components/ui`.

---

## Step 1: Install Dependencies

```bash
# Tailwind CSS
npm install -D tailwindcss @tailwindcss/vite

# TypeScript (Vite supports it without extra plugin)
npm install -D typescript

# For cn() utility (class name merging)
npm install clsx tailwind-merge
```

---

## Step 2: Configure Vite (Path Alias + Tailwind)

**2a.** Install `path` usage (Node built-in, no extra package).

**2b.** Update `vite.config.js`:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import tailwindcss from '@tailwindcss/vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
})
```

---

## Step 3: TypeScript Config

Create `tsconfig.json` in the project root:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Create `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.js"]
}
```

---

## Step 4: Tailwind Config (Optional but Recommended)

Create `tailwind.config.js` so Tailwind knows your content paths and you can add theme later:

```js
/** @type {import('tailwindcss').config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

---

## Step 5: Add Tailwind Directives to CSS

At the **top** of `src/index.css`, add:

```css
@import "tailwindcss";
```

You can keep your existing custom CSS below this. If Tailwind’s preflight conflicts with your styles, wrap your existing rules or adjust in `tailwind.config.js`.

---

## Step 6: Files Already Created for You

- `src/lib/utils.ts` – `cn()` for merging class names (used by HoverButton).
- `src/components/ui/hover-button.tsx` – HoverButton component (TypeScript + Tailwind).
- `src/components/ui/hover-button-demo.tsx` – Demo page component.

---

## Step 7: Use the Component

**Option A – Demo route**

In `App.jsx`, add a route that renders the demo:

```jsx
import HoverButtonDemo from './components/ui/hover-button-demo'

// In your <Routes>:
<Route path="/hover-demo" element={<HoverButtonDemo />} />
```

**Option B – Use in an existing page**

```jsx
import { HoverButton } from '@/components/ui/hover-button'

// In your JSX:
<HoverButton onClick={() => navigate('/book')}>Get Started</HoverButton>
```

---

## Component Overview

- **Props:** Extends `React.ButtonHTMLAttributes<HTMLButtonElement>`; pass any normal button props plus `className`, `children`.
- **State:** Internal only (pointer tracking, circle positions, fade).
- **Dependencies:** `cn` from `@/lib/utils`; no context or external state.
- **Assets:** None; uses CSS variables for gradient colors (`--circle-start`, `--circle-end`).
- **Responsive:** Works at any size; circles are positioned relative to the button.

---

## CSS warning (optional)

You may see a build warning about `@import` order (font URL after Tailwind rules). The app still works. To remove it, load Google Fonts from `index.html` with a `<link>` instead of `@import` in CSS.

---

## Optional: shadcn CLI Later

If you add more shadcn components later:

```bash
npx shadcn@latest init
```

Point the CLI to `src` as the root and use `src/components/ui` as the component path so it matches this setup.
