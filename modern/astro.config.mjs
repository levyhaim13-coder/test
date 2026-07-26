import { defineConfig } from 'astro/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));

const legacyDirectoryAliases = () => ({
	name: 'legacy-directory-aliases',
	hooks: {
		'astro:build:done': ({ dir, logger }) => {
			const legacyRoot = path.join(repositoryRoot, '210785');
			const outputRoot = fileURLToPath(dir);
			const robotsFile = path.join(repositoryRoot, 'robots.txt');
			let aliasCount = 0;

			for (const assetRoot of ['images', 'audio', 'video', 'files']) {
				const source = path.join(repositoryRoot, assetRoot);
				if (fs.existsSync(source)) {
					fs.cpSync(source, path.join(outputRoot, assetRoot), { recursive: true });
				}
			}

			if (fs.existsSync(robotsFile)) {
				fs.copyFileSync(robotsFile, path.join(outputRoot, 'robots.txt'));
			}

			for (const entry of fs.readdirSync(legacyRoot, { recursive: true, withFileTypes: true })) {
				if (!entry.isFile() || entry.name !== 'index.html') continue;

				const legacyIndexPath = path.join(entry.parentPath, entry.name);
				const relativeDirectory = path.relative(repositoryRoot, path.dirname(legacyIndexPath));
				const generatedPage = path.join(outputRoot, `${relativeDirectory}.html`);
				const aliasPath = path.join(outputRoot, relativeDirectory, 'index.html');

				if (!fs.existsSync(generatedPage)) continue;

				fs.mkdirSync(path.dirname(aliasPath), { recursive: true });
				fs.copyFileSync(generatedPage, aliasPath);
				aliasCount += 1;
			}

			logger.info(`Created ${aliasCount} legacy directory URL aliases.`);
		},
	},
});

export default defineConfig({
	site: 'https://levyhaim13-coder.github.io',
	base: '/test',
	output: 'static',
	integrations: [legacyDirectoryAliases()],
	build: {
		format: 'file',
	},
	trailingSlash: 'ignore',
});
