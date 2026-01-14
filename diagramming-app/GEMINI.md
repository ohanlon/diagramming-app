1\. \*\*Project Overview\*\*

   - Purpose: A modern, scalable React SPA using functional components and hooks.

   - Tech Stack: React 18+, Vite (or Create React App), LESS for styling, TypeScript (recommended), ESLint, Prettier, Husky (for git hooks).



2\. \*\*React Best Practices\*\*

   - Use function components with `useEffect`, `useState`, `useContext`, etc.

   - Favor functional and declarative patterns over class-based components.

   - Implement component decomposition: atomic design principles (atoms → molecules → organisms).

   - Always use `key` prop in lists.

   - Handle async operations with `async/await` or React Query for data fetching.

   - Use `React.memo`, `useCallback`, and `useMemo` appropriately to optimize performance.

   - Avoid inline functions in JSX unless necessary.



3\. \*\*LESS Styling Guidelines\*\*

   - Use nested selectors, variables (e.g., `@primary-color: #007bff;`), mixins, and reusable classes.

   - Organize LESS files by component or feature (e.g., `Button.less`, `Header.less`).

   - Avoid deep nesting (> 3 levels); use BEM-like naming (`btn--large`, `form\_\_input`) for clarity.

   - Use `@import` to modularize styles; avoid global CSS pollution.

   - Leverage LESS variables and mixins to maintain design consistency.



4\. \*\*File Structure Convention\*\*

src/

components/

Button/

Button.tsx

Button.less

Button.test.tsx

pages/

Home/

Home.tsx

Home.less

styles/

theme.less

variables.less

global.less

utils/

hooks/

types/

App.tsx

main.tsx



5\. \*\*Code Quality \& Tooling\*\*

\- Enforce ESLint with `eslint-plugin-react`, `react-hooks`, and `prettier` formatting.

\- Use Prettier for consistent code style (no semicolons, double quotes).

\- Set up Husky + lint-staged to auto-format on commit.

\- Write unit tests using Jest \& React Testing Library.

\- Run lint and test stages prior to commiting code.


6\. \*\*AI Behavior Rules\*\*

\- Always suggest TypeScript types where appropriate.

\- Recommend modular, testable components with clear responsibilities.

\- Encourage reusability and maintainability over quick fixes.

\- When generating code:

  - Use functional components

  - Prefer `const` over `var`

  - Use semantic class names in LESS (e.g., `.btn--primary`)

  - Avoid inline styles; use LESS for styling

\- Do not generate UI without context. Ask clarifying questions if needed.

\- Do not make a change unless you are at least 90% confident that the change will work.

7\. \*\*Avoid\*\*

\- Class-based components.

\- Global CSS variables unless encapsulated.

\- Hardcoded values; prefer theme variables.

\- Redundant or duplicated logic in components.


8\. \*\*Plan Mode\*\*

\- Make the plan extremely concise. Sacrifice grammar for the sake of concision.

\- At the end of each plan, give me a list of unresolved questions to answer, if any.

