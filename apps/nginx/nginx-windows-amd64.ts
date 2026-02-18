import { Release, PlatformTarget } from '../../types/release';

export async function getReleases(): Promise<Release[]> {
	const response = await fetch('https://nginx.org/en/download.html');
	if (!response.ok) throw new Error('Failed to fetch Nginx download page');

	const html = await response.text();
	const regex = /nginx-([\d.]+)\.tar\.gz/g;

	const seen = new Set<string>();
	const releases: Record<string, Release> = {};

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
				id: `nginx-${era}`,
				name: 'Nginx',
				version,
				era,
				supported: true,
				url: `https://nginx.org/download/nginx-${version}.zip`,
				target: PlatformTarget.windows_amd64
			};
		}
	}

	const sortedReleases = Object.values(releases).sort((a, b) => b.era.localeCompare(a.era, undefined, { numeric: true }));

	return sortedReleases;
}
