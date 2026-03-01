import { Release, PlatformTarget } from '../../../types/release';

export async function getReleases(): Promise<Release[]> {
	const response = await fetch('https://nginx.org/download/');
	if (!response.ok) throw new Error('Failed to fetch Nginx releases from nginx.org');

	const html = await response.text();
	const releases: Record<string, Release> = {};
	const regex = /<a href="nginx-(\d+\.\d+\.\d+)\.tar\.gz">/g;

	let match;
	while ((match = regex.exec(html)) !== null) {
		const version = match[1];
		const [major, minor] = version.split('.').map(Number);
		const era = `${major}.${minor}`;

		if (!releases[era] || version.localeCompare(releases[era].version, undefined, { numeric: true }) > 0) {
			releases[era] = {
				id: `nginx-${era}`,
				name: 'Nginx',
				version,
				era,
				supported: null,
				url: `https://nginx.org/download/nginx-${version}.tar.gz`,
				target: PlatformTarget.macos_amd64,
				size: null,
			};
		}
	}

	return Object.values(releases).sort((a, b) => b.era.localeCompare(a.era, undefined, { numeric: true }));
}
