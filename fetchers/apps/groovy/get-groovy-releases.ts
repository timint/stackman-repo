import { Release, PlatformTarget } from '../../../types/release';

const GROOVY_DOWNLOADS_URL = 'https://downloads.apache.org/groovy/';

function getEra(version: string): string {
	const [major, minor] = version.split('.');
	return `${major}.${minor}`;
}

function compareVersionsDescending(a: string, b: string): number {
	return b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' });
}

async function getAvailableVersions(): Promise<string[]> {
	const response = await fetch(GROOVY_DOWNLOADS_URL);
	if (!response.ok) {
		throw new Error('Failed to fetch Groovy download index');
	}

	const html = await response.text();
	const versions = new Set<string>();
	const matches = html.matchAll(/href="(\d+\.\d+\.\d+)\/?"/g);

	for (const match of matches) {
		versions.add(match[1]);
	}

	return Array.from(versions).sort(compareVersionsDescending);
}

export async function getGroovyReleases(target: PlatformTarget): Promise<Release[]> {
	const versions = await getAvailableVersions();
	const releasesByEra: Record<string, Release> = {};

	for (const version of versions) {
		if (/preview|rc|alpha|beta|nightly/i.test(version)) {
			continue;
		}

		const era = getEra(version);
		const current = releasesByEra[era];
		if (current && version.localeCompare(current.version, undefined, { numeric: true, sensitivity: 'base' }) <= 0) {
			continue;
		}

		releasesByEra[era] = {
			id: `groovy-${era}`,
			name: 'Groovy',
			version,
			era,
			supported: null,
			url: `${GROOVY_DOWNLOADS_URL}${version}/distribution/apache-groovy-binary-${version}.zip`,
			target,
			size: null
		};
	}

	return Object.values(releasesByEra).sort((a, b) => b.era.localeCompare(a.era, undefined, { numeric: true }));
}
