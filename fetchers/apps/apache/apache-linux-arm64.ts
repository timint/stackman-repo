import { Release, PlatformTarget } from '../../../types/release';

export async function getReleases(): Promise<Release[]> {
	const response = await fetch('https://archive.apache.org/dist/httpd/');
	if (!response.ok) {
		throw new Error('Failed to fetch Apache download page');
	}

	const html = await response.text();
	const regex = /href="(httpd-(\d+\.\d+\.\d+)\.tar\.gz)"/g;
	const seen = new Set<string>();
	const releases: Record<string, Release> = {};

	let match: RegExpExecArray | null;
	while ((match = regex.exec(html))) {
		const filename = match[1];
		const version = match[2];
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
				supported: null,
				url: `https://archive.apache.org/dist/httpd/${filename}`,
				target: PlatformTarget.linux_arm64
			};
		}
	}

	const sortedReleases = Object.values(releases).sort((a, b) => b.era.localeCompare(a.era, undefined, { numeric: true }));
	return sortedReleases;
}
