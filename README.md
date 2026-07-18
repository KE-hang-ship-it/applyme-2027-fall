# ApplyME

ApplyME is a bilingual workspace for planning mechanical-engineering master’s applications. It brings program research, deadlines, application materials, personal notes, comparisons, budgets, and reminders into one focused interface.

The public application is available at **[ke-hang-ship-it.github.io/applyme-2027-fall](https://ke-hang-ship-it.github.io/applyme-2027-fall/)**.

## Product overview

Graduate application research often lives across spreadsheets, bookmarks, calendars, and university pages. ApplyME provides a single local-first workspace designed specifically for mechanical-engineering applicants. Personal selections and notes stay in the browser and can be exported as a JSON backup.

## Features

- Mechanical-engineering MS, MSc, MEng, and related program library
- US, Hong Kong, Canada, UK, and Australia regional views
- Saved programs with reach, target, safer, favorite, and priority categories
- Program comparison and deadline countdowns
- Application material progress tracking
- Calendar reminders with bilingual labels
- Program directions, course summaries, cost planning, and official links
- Private per-program notes
- JSON backup, restore, and personal-data reset
- Chinese and English interfaces
- Light, dark, and system appearance modes
- Responsive desktop and mobile layouts
- “坤械助手” contextual application assistant

## Tech stack

- [React 19](https://react.dev/)
- [Next.js 16](https://nextjs.org/)
- [TypeScript 5](https://www.typescriptlang.org/)
- [vinext](https://github.com/cloudflare/vinext) and Vite
- CSS custom properties and responsive CSS
- Browser `localStorage` for personal workspace state
- GitHub Actions and GitHub Pages

## Project structure

```text
app/            Application routes, page composition, and global styles
components/     Reusable presentation components
data/           Program and product datasets (migration in progress)
hooks/          Reusable client-state hooks (migration in progress)
lib/            Domain utilities and formatting helpers (migration in progress)
types/          Shared TypeScript domain models
public/         Static images and icons
tests/          Rendered-output and regression checks
```

The application is being incrementally modularized to preserve its existing local data format and behavior while reducing the responsibility of `app/page.tsx`.

## Screenshots

Screenshots are maintained in release notes and the live product. A future documentation pass will add stable desktop, mobile, program-detail, and dark-mode captures under `docs/screenshots/`.

## Installation

### Requirements

- Node.js 22.13 or newer
- npm

### Local development

```bash
git clone https://github.com/KE-hang-ship-it/applyme-2027-fall.git
cd applyme-2027-fall
npm install
npm run dev
```

Open the local URL printed by the development server.

### Quality checks

```bash
npm run lint
npm run build
node --test tests/rendered-html.test.mjs
```

The production export is configured for the `/applyme-2027-fall/` GitHub Pages base path.

## Data principles

- Official links are shown only when a dedicated department, program, or application URL is recorded.
- Regional reference order is not presented as a QS or U.S. News ranking.
- Requirements, deadlines, tuition, and curricula can change; applicants should confirm important decisions on official university pages.
- Personal notes, categories, materials, and reminders are stored in the current browser unless exported.

## Roadmap

- Complete the migration of program data and translations into dedicated modules
- Expand verified official-link and deadline coverage
- Add stable visual-regression screenshots
- Improve course-catalog provenance and update timestamps
- Add optional encrypted cross-device sync without removing local-first use

## Contributing

Contributions that improve verified program data, accessibility, tests, documentation, or maintainability are welcome.

1. Fork the repository and create a focused branch.
2. Keep changes scoped and preserve existing local-storage keys.
3. Add or update tests when behavior changes.
4. Run lint, production build, and rendered-output tests.
5. Open a pull request describing the user impact and data sources.

For university data corrections, include a direct official source and the date it was checked. Do not replace a verified URL with an aggregator or search-results page.

## License

This repository is currently source-available for personal and educational use. A formal open-source license has not yet been selected. Until a `LICENSE` file is added, copyright remains with the repository owner.
