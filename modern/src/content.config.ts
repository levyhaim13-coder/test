import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const pages = defineCollection({
	loader: glob({
		base: './src/content/pages',
		pattern: '**/*.md',
		generateId: ({ entry }) => entry.replace(/\.md$/, ''),
	}),
	schema: z.object({
		title: z.string(),
		description: z.string().optional(),
		keywords: z.string().optional(),
		route: z.string(),
		sourcePath: z.string().optional(),
		legacyPath: z.string(),
		isHome: z.boolean().default(false),
	}),
});

export const collections = { pages };
