import { Release, PlatformTarget } from '../types/release';

export async function getReleases(): Promise<Release[]> {
	const res = await fetch('https://nginx.org/en/download.html');
	if (!res.ok) throw new Error('Failed to fetch Nginx download page');

	const html = await res.text();
	const regex = /nginx-([\d.]+)\.tar\.gz/g;
	const seen = new Set<string>();

	const releases: Release[] = [];

	let match: RegExpExecArray | null;
	const latestByEra: Record<string, string> = {};
	while ((match = regex.exec(html))) {
		const version = match[1];
		if (/preview|rc|alpha|beta|nightly/i.test(version)) continue;
		if (seen.has(version)) continue;
		seen.add(version);
		const [major, minor] = version.split('.').map(Number);
		const era = `${major}.${minor}`;
		if (!latestByEra[era] || version.localeCompare(latestByEra[era], undefined, { numeric: true }) > 0) {
			latestByEra[era] = version;
		}
	}
	for (const era in latestByEra) {
		const version = latestByEra[era];
		releases.push({
			id: `nginx-${era}`,
			name: `Nginx`,
			version,
			era,
			endoflife: null,
			platforms: [
				{
					target: PlatformTarget.linux_amd64,
					url: `https://nginx.org/download/nginx-${version}.tar.gz`
				},
				{
					target: PlatformTarget.linux_arm64,
					url: `https://nginx.org/download/nginx-${version}.tar.gz`
				},
				{
					target: PlatformTarget.macos_amd64,
					url: `https://nginx.org/download/nginx-${version}.tar.gz`
				},
				{
					target: PlatformTarget.macos_arm64,
					url: `https://nginx.org/download/nginx-${version}.tar.gz`
				},
				{
					target: PlatformTarget.windows_amd64,
					url: `https://nginx.org/download/nginx-${version}.zip`
				},
			]
		});
	}

	if (!releases) {
		throw new Error('Failed to fetch Nginx releases');
	}

	releases.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

	return releases;
}
