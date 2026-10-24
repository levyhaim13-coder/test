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
		const expected = (step > 0 && page.end) || (step < 0 && sequence[position]?.end) ? undefined : sequence[position];
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
assert.equal(readingNeighbors('הופעה-מול-קהל-1').next?.route, '210785/תולדות-המוזיקה');
assert.equal(readingNeighbors('210785/תולדות-המוזיקה').previous?.route, 'הופעה-מול-קהל');
assert.equal(readingNeighbors('210785/המחמושת').next?.route, 'מחמושת-הגדרה');
assert.equal(readingNeighbors('מחמושת-הגדרה').next?.route, 'צורת-המחמושת');
assert.equal(readingNeighbors('210785/צלילי-המוזיקה').next?.route, 'צלילי-המוזיקה-הגדרה');
assert.equal(readingNeighbors('צלילי-המוזיקה-הגדרה').next?.route, '210785/תכונות-הצליל');
const arrangement = 'pages/1791389192891_העיבוד המוזיקלי';
assert.equal(readingNeighbors(arrangement).next, undefined, 'The musical arrangement page is the last page');
assert.equal(readingNeighbors(arrangement, '34').next, undefined, 'A section parameter must not add a next link to the last page');
assert.equal(readingNeighbors(arrangement).previous?.route, 'pages/1791309995578_כתיבת המלל', 'The last page must retain its back link');
assert.deepEqual(readingNeighbors('210785/מונחים-מוזיקליים-1-1', '28'), readingNeighbors('210785/מונחים-מוזיקליים-1-1', '16'));
assert.deepEqual(readingNeighbors('מוזיקת-הבלוז', 'invalid'), readingNeighbors('מוזיקת-הבלוז'));
assert.deepEqual(readingNeighbors('מוזיקת-הבלוז', '1'), readingNeighbors('מוזיקת-הבלוז'));
assert.deepEqual(readingNeighbors('unknown'), { previous: undefined, next: undefined });
for (const [alias, route] of Object.entries(aliases)) {
	assert.deepEqual(readingNeighbors(`/${alias}/`), readingNeighbors(route), `Alias does not preserve neighbors: ${alias}`);
}

const originalMenu = JSON.parse(fs.readFileSync(path.join(root, '../menu.json'), 'utf8'));
const expectedMenu = (items) => items.map((item) => ({
 title: JSDOM.fragment(item.title).textContent.replace(/\s+/g, ' ').trim(),
 url: new URL(item.url, 'https://levyhaim13-coder.github.io/test/').href,
 children: expectedMenu(item.children),
}));
const renderedMenu = (list) => [...list.children].map((item) => {
 const anchor = item.querySelector(':scope > a');
 const children = item.querySelector(':scope > ul');
 return {
  title: anchor.textContent.replace(/\s+/g, ' ').trim(),
  url: new URL(anchor.getAttribute('href'), 'https://levyhaim13-coder.github.io/test/').href,
  children: children ? renderedMenu(children) : [],
 };
});
const indexDocument = new JSDOM(fs.readFileSync(path.join(output, 'topics.html'), 'utf8')).window.document;
assert.deepEqual(renderedMenu(indexDocument.querySelector('#centerWebsiteDiv > table > tbody > tr > td > ul')), expectedMenu(originalMenu), 'Topic index changed the original category hierarchy');

let checked = 0;
for (const entry of fs.readdirSync(path.join(root, 'src/content/pages'), { recursive: true, withFileTypes: true })) {
	if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
	const source = fs.readFileSync(path.join(entry.parentPath, entry.name), 'utf8');
	const route = normalize(JSON.parse(source.match(/^route: (.+)$/m)[1]));
	const filename = path.join(output, route ? `${route}.html` : 'index.html');
	const dom = new JSDOM(fs.readFileSync(filename, 'utf8'), { url: `https://levyhaim13-coder.github.io${url(route)}` });
	const document = dom.window.document;
	if (checked === 0) {
		assert.deepEqual(renderedMenu(document.querySelector('#MenuBar2')), expectedMenu(originalMenu), 'Menu titles, order, links or category hierarchy changed');
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
	for (const anchor of document.querySelectorAll('#centerWebsiteDiv a[href]')) {
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
console.log(`Verified ${checked} content pages and all ${sequence.length} document positions: valid content/navigation destinations, reciprocal section-aware neighbors, original menu hierarchy unchanged.`);
