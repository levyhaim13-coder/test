import legacyMenu from '../../../menu.json';
import { normalizeRoute, pageUrl, readingSections } from './reading-order';

type MenuItem = { title: string; url: string; children: MenuItem[] };
type Page = { data: { route: string; title: string }; body?: string };

export function navigationMenu(pages: Page[]) {
	const available = new Map(pages.map((page) => [normalizeRoute(page.data.route), page]));
	const included = new Set(readingSections.flatMap((section) => section.pages.map((page) => page.route)));
	const items: MenuItem[] = readingSections.map((section) => ({
		title: section.title,
		url: pageUrl(section.pages[0].route),
		children: section.pages.slice(1).map((page) => ({ title: page.title, url: pageUrl(page.route), children: [] })),
	}));
	const additional: { title: string; route: string }[] = [];
	const visit = (entries: MenuItem[]) => {
		for (const item of entries) {
			const route = normalizeRoute(decodeURIComponent(item.url).replace(/^\/test\//, '').replace(/\.html$/, ''));
			const page = available.get(route);
			if (page && !included.has(route) && !/בדיקה|^ctl$|^Bach$/.test(item.title) && !page.body?.includes('לחץ כאן להכנסת טקסט')) {
				additional.push({ title: item.title, route });
				included.add(route);
			}
			visit(item.children);
		}
	};
	visit(legacyMenu);
	items.push({ title: 'נושאים נוספים', url: '/test/topics.html#additional', children: [] });
	return { items, additional };
}
