import sections from '../reading-order.json';
import aliases from '../reading-aliases.json';

export const normalizeRoute = (route: string) => route.replace(/^\/+|\/+$/g, '');
export const pageUrl = (route: string) => route ? `/test/${normalizeRoute(route)}.html` : '/test/';
export const readingSections = sections;
export const readingPages = sections.flatMap((section) => section.pages.filter((page) => page.inSequence));

export function readingNeighbors(route: string) {
	const normalized = normalizeRoute(route);
	const canonical = (aliases as Record<string, string>)[normalized] ?? normalized;
	const index = readingPages.findIndex((page) => page.route === canonical);
	return {
		previous: index > 0 ? readingPages[index - 1] : undefined,
		next: index >= 0 ? readingPages[index + 1] : undefined,
	};
}
