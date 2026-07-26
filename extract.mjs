import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM, VirtualConsole } from 'jsdom';
import { glob } from 'glob';

const REPOSITORY_ROOT = path.dirname(fileURLToPath(import.meta.url));
const SITE_PREFIX = '/test/';
const LEGACY_HTML_GLOB = '**/*.html';
const IGNORED_DIRECTORIES = [
    'modern/**',
    'node_modules/**',
    '.git/**',
];
const virtualConsole = new VirtualConsole();
virtualConsole.on('jsdomError', () => {
    // Legacy stylesheets contain syntax that jsdom does not understand.
    // Styles are preserved as source HTML; these parser warnings are irrelevant.
});

const toRoute = (relativePath) => {
    const withoutExtension = relativePath.replace(/\.html$/i, '');
    if (withoutExtension === 'index') return '';
    return withoutExtension.replace(/\/index$/i, '/');
};

const toOutputPath = (outputDir, relativePath) => (
    path.join(outputDir, relativePath.replace(/\.html$/i, '.md'))
);

const frontmatterString = (value) => JSON.stringify(value ?? '');

async function extract() {
    const files = await glob(LEGACY_HTML_GLOB, {
        cwd: REPOSITORY_ROOT,
        ignore: IGNORED_DIRECTORIES,
        nodir: true,
    });
    const outputDir = path.join(REPOSITORY_ROOT, 'modern', 'src', 'content', 'pages');
    fs.mkdirSync(outputDir, { recursive: true });

    console.log(`Found ${files.length} legacy HTML files. Processing all...`);

    for (const file of files) {
        try {
            const html = fs.readFileSync(path.join(REPOSITORY_ROOT, file), 'utf8');
            const dom = new JSDOM(html, { virtualConsole });
            const doc = dom.window.document;

            const title = doc.querySelector('title')?.textContent
                ?.replace('תאוריה מוזיקלית - ', '')
                .trim() || path.basename(file, '.html');
            const description = doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || '';
            const keywords = doc.querySelector('meta[name="keywords"]')?.getAttribute('content')?.trim() || '';
            const contentElement = doc.querySelector('#longMessageMEM');
            
            if (!contentElement) {
                console.warn(`Skipping ${file}: #longMessageMEM was not found.`);
                continue;
            }

            const route = toRoute(file);
            const outputPath = toOutputPath(outputDir, file);
            const legacyPath = route
                ? `${SITE_PREFIX}${route}${route.endsWith('/') ? '' : '.html'}`
                : SITE_PREFIX;
            const frontmatter = `---
title: ${frontmatterString(title)}
description: ${frontmatterString(description)}
keywords: ${frontmatterString(keywords)}
route: ${frontmatterString(route)}
sourcePath: ${frontmatterString(file)}
legacyPath: ${frontmatterString(legacyPath)}
isHome: ${route === ''}
---

`;
            const body = `<div id="longMessageMEM">\n${contentElement.innerHTML.trim()}\n</div>\n`;

            fs.mkdirSync(path.dirname(outputPath), { recursive: true });
            fs.writeFileSync(outputPath, frontmatter + body, 'utf8');
            dom.window.close();
        } catch (err) {
            console.error(`Failed to process ${file}:`, err.message);
        }
    }
    console.log(`Extraction complete: ${files.length} files inspected.`);
}

extract().catch(console.error);
