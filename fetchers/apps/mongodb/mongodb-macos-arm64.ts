import { Release, PlatformTarget } from '../../../types/release';

export async function getReleases(): Promise<Release[]> {
	const response = await fetch('https://www.mongodb.com/try/download/community');
	if (!response.ok) throw new Error('Failed to fetch MongoDB Community download page');
	const html = await response.text();

	const versionMatches = html.matchAll(/\b(\d+\.\d+\.\d+)\b/g);
	const releases: Record<string, Release> = {};

	for (const match of versionMatches) {
		const version = match[1];
		if (/preview|rc|alpha|beta|nightly/i.test(version)) continue;
		const major = Number(version.split('.')[0]);
		if (/^\d+\.\d+\.\d+$/.test(version) && [6, 7, 8].includes(major)) {
			const era = version.split('.').slice(0, 2).join('.');
			if (!releases[era] || version.localeCompare(releases[era].version, undefined, { numeric: true }) > 0) {
				releases[era] = {
					id: `mongodb-${era}`,
					name: 'MongoDB Community Server',
					version,
					era,
					supported: null,
					url: `https://fastdl.mongodb.org/osx/mongodb-macos-arm64-${version}.tgz`,
					target: PlatformTarget.macos_arm64
				};
			}
		}
	}

	const sortedReleases = Object.values(releases).sort((a, b) => b.era.localeCompare(a.era, undefined, { numeric: true }));

	return sortedReleases;
}
