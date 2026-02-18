import { Release, PlatformTarget } from '../../types/release';

export async function getReleases(): Promise<Release[]> {
	const response = await fetch('https://downloads.apache.org/httpd/');
	if (!response.ok) {
		throw new Error('Failed to fetch Apache download page');
	}

	const html = await response.text();
	const regex = /(\d+\.\d+\.\d+)/g;
	const seen = new Set<string>();
	const releases: Record<string, Release> = {};

	const winMatch = /href="([^"]+win64\.zip)"/.exec(html);

	let match: RegExpExecArray | null;
	while ((match = regex.exec(html))) {
		const version = match[1];
		if (/preview|rc|alpha|beta|nightly/i.test(version)) continue;
		if (seen.has(version)) continue;
		seen.add(version);

		const [major, minor] = version.split('.').map(Number);
		const era = `${major}.${minor}`;

		if (!releases[era] || version.localeCompare(releases[era].version, undefined, { numeric: true }) > 0) {
			releases[era] = {
				id: `apache-${era}`,
				name: 'Apache HTTP Server',
				version,
				era,
				supported: true,
				url: winMatch ? `https://www.apachelounge.com${winMatch[1]}` : '',
				target: PlatformTarget.windows_amd64
			};
		}
	}

	const sortedReleases = Object.values(releases).sort((a, b) => b.era.localeCompare(a.era, undefined, { numeric: true }));
	return sortedReleases;
}
