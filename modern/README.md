# Modern musical theory website

This directory contains the Astro version of the legacy musical theory website.
It deliberately preserves the current visual theme and URL structure while
moving the repeated page template into shared components.

## Commands

- `npm run migrate:content` extracts every legacy `#longMessageMEM` region into
  an editor-compatible source entry.
- `npm run dev` starts the local Astro development server.
- `npm run build` generates the complete static website.

## Content contract

Page sources live under `src/content/pages/` and mirror the legacy repository
paths. Each source contains:

- frontmatter for title, description, keywords, route, and source path;
- one `<div id="longMessageMEM">` containing preserved rich HTML.

The raw HTML body is intentional. The custom editor can continue using TinyMCE
without converting tables, images, embeds, RTL alignment, or inline formatting
to Markdown.

## Shared site structure

- `src/layouts/BaseLayout.astro` owns the shared document, banner, sidebar, and
  footer.
- `src/components/Navigation.astro` renders the repository-level `menu.json`.
- `src/styles/theme.css` contains the legacy-compatible responsive theme.
- `src/pages/[...path].astro` generates all content routes.

The build also creates directory-style aliases for historical
`210785/<page>/index.html` URLs.
