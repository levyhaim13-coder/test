# 🚀 Website Migration & Modernization Plan

This document outlines the step-by-step strategy for migrating the legacy musical theory website to a modern **Astro** framework.

## 🎯 Objectives
## 🎯 Objectives
1.  **Automation:** Migrate 437+ pages without manual copy-pasting.
2.  **Performance:** Achieve 100/100 Lighthouse scores by shipping zero unnecessary JS.
3.  **Maintainability:** Centralize layout and logic (Header, Sidebar, Navigation).
4.  **Editability:** Structure content in a format (Markdown/JSON) compatible with the `editor` project.
5.  **Modern UX & RTL Integrity:** Implement a fully responsive, RTL-first design. Ensure Hebrew text and layout remain perfectly aligned throughout extraction and reconstruction.

---

## 📅 Phase 1: Analysis & Content Extraction ("The Scrape")
We must treat the current HTML files as a database. I will write a **TypeScript (Node.js)** script to perform the following:

1.  **Identify Unique Data:** For every `.html` file, extract:
    *   **Metadata:** `<title>`, `meta description`, `keywords`.
    *   **Slug:** The filename (e.g., `אהרון-חרל-פ`).
    *   **Content:** The inner HTML of the `#longMessageMEM` container.
2.  **RTL & Encoding Protection:** 
    *   Force **UTF-8 encoding** for all read/write operations to prevent Hebrew character corruption.
    *   Preserve essential RTL markers (like `&rlm;` or specific `dir="rtl"` attributes) inside content blocks if they differ from the global direction.
3.  **HTML Sanitization:** 
    *   Strip out legacy tags: `<font>`, `<u>`, `<center>`, `<b>` (replace with semantic tags).
    *   Remove inline styles (e.g., `style="text-align: justify; font-size: 14px;"`).
    *   Convert tables used for layout into semantic `<div>` or `<section>` elements.
4.  **Format Conversion:** Convert the cleaned HTML into **Markdown (with Frontmatter)**.

## 🏗️ Phase 2: Astro Project Scaffolding
Initialize the modern framework in a new directory.

1.  **Setup Content Collections:** Use Astro's `src/content/` to define a schema for your lessons.
2.  **Global RTL Layout:** Create `src/layouts/BaseLayout.astro`:
    *   Set `<html lang="he" dir="rtl">`.
    *   Use **CSS Logical Properties** (e.g., `margin-inline-start` instead of `margin-right`) to ensure the layout is natively RTL-friendly.
    *   Implement a "Hebrew-first" font stack (e.g., Assistant, Heebo, Rubik).
3.  **Dynamic Routing:** Create `src/pages/[...slug].astro` to automatically generate pages based on the Hebrew slugs.

## 🎨 Phase 3: Component Development
Break down the monolithic legacy design into reusable components.

1.  **Navigation (The Menu):** 
    *   Extract the nested hierarchy from `MenuBarHorizontal`.
    *   Store the menu structure in a `nav.json` file (UTF-8).
    *   Build a recursive `NavMenu.astro` component with RTL support (right-aligned submenus).
2.  **Sidebar:**
    *   Create a `Sidebar.astro` positioned on the **Right** (standard for RTL) for the Search and Mailing List.

3.  **Music Tools:**
    *   If any pages use interactive flash/scripts, identify replacements (Web Audio API or standard HTML5 players).

## 🖼️ Phase 4: Asset Localization & URL Handling
1.  **Download Remote Assets:** A script will scan all pages for `sfilev2.f-static.com` URLs, download the images, and save them to `public/assets/`.
2.  **Link Normalization:** Update all internal links to point to the new clean URLs (e.g., `אהרון-חרל-פ.html` → `/אהרון-חרל-פ`).
3.  **SEO Preservation:** Set up redirects if the old URL structure must be maintained for search engines.

## ✏️ Phase 5: Editor Integration
1.  **API/Filesystem Access:** Ensure the `editor` project can read/write the `.md` files in `src/content/`.
2.  **Visual Consistency:** Provide the same CSS variables to both the Website and the Editor so they look identical.

---

## ❓ Questions & Concerns

1.  **Menu Hierarchy:** The current menu is massive and deeply nested. Should we keep the exact same structure, or is this an opportunity to simplify the navigation?
2.  **Search Functionality:** The current search relies on an ASP backend (`searchMessage.asp`). In the new version, do you want:
    *   A static search (e.g., Pagefind - very fast, no server needed).
    *   A simple client-side search (Fuse.js).
3.  **Editor Format:** Does your existing `editor` project have a preferred format? (e.g., does it expect raw HTML, or is it a Markdown editor like Tiptap/Quill?)
4.  **ASP Files:** There are some `.asp` files (like `index.asp`). Are these still in use, or can they be safely ignored?

---

## 🛠️ Next Steps (Pending Approval)
1.  **Backup:** Move current files to a `legacy/` subfolder.
2.  **Draft Extraction Script:** I will write the script to extract data from 3-5 pages as a "Proof of Concept."
3.  **Astro Init:** Scaffold the basic project structure.
