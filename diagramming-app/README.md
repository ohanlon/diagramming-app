# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Authentication

The app uses two httpOnly cookies for auth:
- `authToken`: short-lived access JWT (~15m) renewed via `/auth/refresh`.
- `refreshToken`: long-lived refresh JWT; renewed on each successful refresh (sliding expiration).

Why cookies (vs localStorage refresh JWT):
- Prevents XSS script from reading bearer tokens (httpOnly).
- Eliminates need for client-side expiry parsing and storage logic.
- Simplifies 401 retry/background refresh (no Authorization header required).

Flow summary:
1. Login/Register sets both cookies and returns user + settings JSON (no refresh token in body).
2. Regular requests include cookies automatically (`credentials: 'include'`).
3. `/auth/refresh` verifies `refreshToken` cookie, issues new `authToken`, renews `refreshToken`.
4. `/auth/logout` clears both.

Security notes:
- SameSite is `strict` in production by default (configurable via `COOKIE_SAMESITE` env) and `lax` in development.
- `secure` is enabled automatically in production; ensure HTTPS.
- Add CSP + Trusted Types to further reduce XSS likelihood.
- CSRF impact of `/auth/refresh` is low (non-mutating); evaluate CSRF tokens or SameSite adjustments for state-changing endpoints.

### Content Security Policy (CSP)
Server now sets a baseline CSP via Helmet:
- `default-src 'self'`
- Blocks plugins (`object-src 'none'`), disallows embedding (`frame-ancestors 'none'`).
- `script-src 'self'` (tighten with nonces/hashes when serving built assets directly).
- `style-src 'self' 'unsafe-inline'` (remove `'unsafe-inline'` after migrating to hashed/nonced styles).
- `img-src 'self' data:` allows inline thumbnails.
- `connect-src 'self' http://localhost:5173` (adjust for production frontend origin).

Tune CSP once the frontend is served by this server (add script/style nonces, remove inline allowances, add font sources, etc.).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
