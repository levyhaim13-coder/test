import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
const sections = JSON.parse(fs.readFileSync(path.join(root, 'src/reading-order.json'), 'utf8'));
const aliases = JSON.parse(fs.readFileSync(path.join(root, 'src/reading-aliases.json'), 'utf8'));
const sequence = sections.flatMap((section) => section.pages.filter((page) => page.inSequence));
const url = (route) => route ? `/test/${route}.html` : '/test/';
const normalize = (route) => route.replace(/^\/+|\/+$/g, '');
const checkedFragments = new Set();

assert.equal(new Set(sequence.map((page) => page.route)).size, sequence.length, 'Repeated reading-sequence page');
assert.deepEqual(sequence.slice(0, 3).map((page) => page.route), ['', 'צור-קשר', '210785/צורת-הלימוד']);
assert.deepEqual(sections.map((section) => section.documentSections[0]), [...sections.map((section) => section.documentSections[0])].sort((a, b) => a - b));

let checked = 0;
for (const entry of fs.readdirSync(path.join(root, 'src/content/pages'), { recursive: true, withFileTypes: true })) {
	if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
	const source = fs.readFileSync(path.join(entry.parentPath, entry.name), 'utf8');
	const route = normalize(JSON.parse(source.match(/^route: (.+)$/m)[1]));
	const filename = path.join(output, route ? `${route}.html` : 'index.html');
	const dom = new JSDOM(fs.readFileSync(filename, 'utf8'), { url: `https://levyhaim13-coder.github.io${url(route)}` });
	const document = dom.window.document;
	const navigation = document.querySelectorAll('.page-navigation');
	assert.equal(navigation.length, 1, `Expected one shared navigation: ${route}`);
	const index = sequence.findIndex((page) => page.route === (aliases[route] ?? route));
	for (const [relation, neighbor] of [['prev', index > 0 ? sequence[index - 1] : undefined], ['next', index >= 0 ? sequence[index + 1] : undefined]]) {
		const anchor = navigation[0].querySelector(`[rel="${relation}"]`);
		assert.equal(anchor?.getAttribute('href'), neighbor ? url(neighbor.route) : undefined, `Incorrect ${relation}: ${route}`);
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
console.log(`Verified ${checked} content pages and ${sequence.length} reading-sequence pages: valid destinations, expected neighbors, no obsolete-host or escaped navigation.`);
