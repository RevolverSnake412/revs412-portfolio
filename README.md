# revs412 portfolio

A static, content-driven Astro portfolio. Projects, notes, principles, site settings, and resume data live outside UI components.

The KDE Breeze launcher and Konsole icons in the simulated taskbar are from the [KDE Breeze icon set](https://develop.kde.org/frameworks/breeze-icons/) and [KDE app icons](https://apps.kde.org/app-icons/), licensed under the GNU LGPL v3 or later.

## Local development

Requires Node.js 20.3+.

```bash
npm install
npm run dev
```

Use `npm run build` for the full production build, including both generated PDF resumes.

## Content

- Add work in `src/content/work/your-clean-slug.md`.
- Add notes in `src/content/notes/your-clean-slug.md`.
- Edit `src/content/settings/site.yaml` for identity, contact details, and home-page copy.
- Edit `src/content/settings/resume.yaml` for the CV header, profile, capabilities, and education.

Every published work item appears in the resume, newest first. A note appears only when its frontmatter has `resume: true`. Use `client:` only when its value is safe to publish.

English content remains the canonical source. A French translation belongs under `translations.fr` in the same work or note file, so the French routes and French CV regenerate from the same entry. The stable `slug` remains outside the translation block and is shared by both languages.

## Resumes

`npm run build` produces:

- `Oussama-Ait-Agnaou-Resume.pdf`
- `Oussama-Ait-Agnaou-CV-Francais.pdf`

They are also available at `/resume/` and `/fr/resume/`. The first local PDF generation may require `npx playwright install chromium`.

## Deployment

Push `main`, then configure GitHub Pages to build from GitHub Actions. The deployment workflow builds the static site and generated PDFs. Set `SITE_URL` in `.github/workflows/deploy.yml` to the final public domain when it changes.
