import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { pageUrl, readingNeighbors } from '../src/lib/reading-order.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
const sections = JSON.parse(fs.readFileSync(path.join(root, 'src/reading-order.json'), 'utf8'));
const aliases = JSON.parse(fs.readFileSync(path.join(root, 'src/reading-aliases.json'), 'utf8'));
const sequence = sections.flatMap((section) => section.pages.map((page) => ({ ...page, section: section.documentSections[0] })));
const url = (route) => route ? `/test/${route}.html` : '/test/';
const normalize = (route) => route.replace(/^\/+|\/+$/g, '');
const checkedFragments = new Set();

for (const section of sections) {
	assert.equal(new Set(section.pages.map((page) => page.route)).size, section.pages.length, `Repeated page within ${section.title}`);
}
assert.deepEqual(sequence.slice(0, 3).map((page) => page.route), ['', 'צור-קשר', '210785/צורת-הלימוד']);
assert.deepEqual(sections.map((section) => section.documentSections[0]), [...sections.map((section) => section.documentSections[0])].sort((a, b) => a - b));

// Check every document position, including pages reused in another chapter.
for (let index = 0; index < sequence.length; index++) {
	const page = sequence[index];
	const neighbors = readingNeighbors(page.route, String(page.section));
	for (const [direction, step] of [['previous', -1], ['next', 1]]) {
		let position = index + step;
		while (sequence[position]?.route === page.route) position += step;
		const expected = sequence[position];
		assert.deepEqual(neighbors[direction], expected, `Skipped document topic: ${page.route} in section ${page.section}`);
		if (expected) {
			const reverse = readingNeighbors(expected.route, String(expected.section));
			assert.equal(reverse[step === 1 ? 'previous' : 'next']?.route, page.route, `Non-reciprocal link: ${page.route}`);
		}
	}
}

assert.equal(readingNeighbors('מוזיקת-ג-אז').next?.route, 'מוזיקת-הבלוז', 'Jazz must continue to Blues');
assert.equal(readingNeighbors('מוזיקת-הבלוז', '45').previous?.route, 'מוזיקת-ג-אז');
assert.equal(readingNeighbors('מוזיקת-ג-אז', '37').next?.route, 'מוזיקת-הבלוז', 'Jazz in music types must continue to Blues');
assert.equal(readingNeighbors('מוזיקת-ג-אז', '37').previous?.route, 'מוזיקת-פופ');
assert.equal(readingNeighbors('מוזיקת-הבלוז', '37').previous?.route, 'מוזיקת-ג-אז');
assert.deepEqual(readingNeighbors('210785/מונחים-מוזיקליים-1-1', '28'), readingNeighbors('210785/מונחים-מוזיקליים-1-1', '16'));
assert.deepEqual(readingNeighbors('מוזיקת-הבלוז', 'invalid'), readingNeighbors('מוזיקת-הבלוז'));
assert.deepEqual(readingNeighbors('מוזיקת-הבלוז', '1'), readingNeighbors('מוזיקת-הבלוז'));
assert.deepEqual(readingNeighbors('unknown'), { previous: undefined, next: undefined });
for (const [alias, route] of Object.entries(aliases)) {
	assert.deepEqual(readingNeighbors(`/${alias}/`), readingNeighbors(route), `Alias does not preserve neighbors: ${alias}`);
}

const indexDocument = new JSDOM(fs.readFileSync(path.join(output, 'topics.html'), 'utf8')).window.document;
for (const section of sections) {
	for (const page of section.pages) {
		assert([...indexDocument.querySelectorAll('a')].some((anchor) => anchor.getAttribute('href') === pageUrl(page.route, section.documentSections[0])), `Topic index loses section: ${page.title}`);
	}
}

let checked = 0;
for (const entry of fs.readdirSync(path.join(root, 'src/content/pages'), { recursive: true, withFileTypes: true })) {
	if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
	const source = fs.readFileSync(path.join(entry.parentPath, entry.name), 'utf8');
	const route = normalize(JSON.parse(source.match(/^route: (.+)$/m)[1]));
	const filename = path.join(output, route ? `${route}.html` : 'index.html');
	const dom = new JSDOM(fs.readFileSync(filename, 'utf8'), { url: `https://levyhaim13-coder.github.io${url(route)}` });
	const document = dom.window.document;
	if (checked === 0) {
		const menuUrls = new Set([...document.querySelectorAll('#MenuBar2 a')].map((anchor) => anchor.getAttribute('href')));
		for (const section of sections) for (const page of section.pages) {
			assert(menuUrls.has(pageUrl(page.route, section.documentSections[0])), `Menu loses section: ${page.title}`);
		}
	}
	const navigation = document.querySelectorAll('.page-navigation');
	assert.equal(navigation.length, 1, `Expected one shared navigation: ${route}`);
	const { previous, next } = readingNeighbors(route);
	for (const [relation, neighbor] of [['prev', previous], ['next', next]]) {
		const anchor = navigation[0].querySelector(`[rel="${relation}"]`);
		assert.equal(anchor?.getAttribute('href'), neighbor ? pageUrl(neighbor.route, neighbor.section) : null, `Incorrect ${relation}: ${route}`);
		assert.equal(anchor.hidden, !neighbor, `Incorrect visibility of ${relation}: ${route}`);
	}
	assert(![...document.querySelectorAll('#centerWebsiteDiv code')].some((node) => /<a\b/.test(node.textContent) && /הבא|קודם/.test(node.textContent)), `Escaped navigation: ${route}`);
	assert(![...document.querySelectorAll('#centerWebsiteDiv a')].some((anchor) => !anchor.closest('.page-navigation') && /חזרה לדף קודם|חזור בעמוד קודם|המשך בעמוד הבא/.test(anchor.textContent)), `Embedded navigation remains: ${route}`);
	for (const anchor of document.querySelectorAll('a[href]')) {
		const destination = new URL(anchor.href);
		assert(!/enter-system\.com|s90\.upress\.link/.test(destination.hostname), `Obsolete host: ${route}`);
		if (destination.origin !== 'https://levyhaim13-coder.github.io' || anchor.getAttribute('href').startsWith('#')) continue;
		const relative = decodeURIComponent(destination.pathname).replace(/^\/test\/?/, '');
		const target = path.join(output, relative || 'index.html');
		const exists = fs.existsSync(target) && (fs.statSync(target).isFile() || fs.existsSync(path.join(target, 'index.html')));
		assert(exists, `Missing destination on ${route}: ${destination.pathname}`);
		if (destination.hash && target.endsWith('.html') && !checkedFragments.has(destination.href)) {
			const targetDom = new JSDOM(fs.readFileSync(target, 'utf8'));
			assert(targetDom.window.document.getElementById(decodeURIComponent(destination.hash.slice(1))), `Missing fragment: ${anchor.href}`);
			targetDom.window.close();
			checkedFragments.add(destination.href);
		}
	}
	dom.window.close();
	checked++;
}

for (const page of sequence) {
	assert(fs.existsSync(path.join(output, page.route ? `${page.route}.html` : 'index.html')), `Missing reading page: ${page.route}`);
}
console.log(`Verified ${checked} content pages and all ${sequence.length} document positions: valid destinations, reciprocal section-aware neighbors, no obsolete-host or escaped navigation.`);
