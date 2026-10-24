import sections from '../reading-order.json' with { type: 'json' };
import aliases from '../reading-aliases.json' with { type: 'json' };

export const normalizeRoute = (route: string) => route.replace(/^\/+|\/+$/g, '');
export const pageUrl = (route: string, section?: number) =>
	(route ? `/test/${normalizeRoute(route)}.html` : '/test/') + (section === undefined ? '' : `?section=${section}`);
export const readingSections = sections;
export const readingPages = sections.flatMap((section) => section.pages.map((page) => ({ ...page, section: section.documentSections[0] })));

export function readingNeighbors(route: string, section?: string | null) {
	const normalized = normalizeRoute(route);
	const canonical = (aliases as Record<string, string>)[normalized] ?? normalized;
	const chapter = sections.find((chapter) => chapter.documentSections.some((id) => String(id) === section));
	let index = chapter ? readingPages.findIndex((page) => page.route === canonical && page.section === chapter.documentSections[0]) : -1;
	if (index < 0) {
		const primary = sections.find((chapter) => chapter.pages[0].route === canonical);
		index = readingPages.findIndex((page) => page.route === canonical && (!primary || page.section === primary.documentSections[0]));
	}
	const neighbor = (step: number) => {
		if (index < 0) return undefined;
		let position = index + step;
		while (readingPages[position]?.route === canonical) position += step;
		return readingPages[position];
	};
	return {
		previous: neighbor(-1),
		next: neighbor(1),
	};
}
