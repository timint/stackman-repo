import { Release, PlatformTarget } from '../types/release';

export async function getReleases(): Promise<Release[]> {
	const res = await fetch('https://nginx.org/en/download.html');
	if (!res.ok) throw new Error('Failed to fetch Nginx download page');

	const html = await res.text();
	const regex = /nginx-([\d.]+)\.tar\.gz/g;
	const seen = new Set<string>();

	const releases: Release[] = [];

	let match: RegExpExecArray | null;
	while ((match = regex.exec(html))) {
		const version = match[1];
		if (seen.has(version)) continue;
		seen.add(version);

		const [major, minor] = version.split('.').map(Number);
		const era = `${major}.${minor}`;

		const linuxUrl = `https://nginx.org/download/nginx-${version}.tar.gz`;
		const linuxRes = await fetch(linuxUrl, { method: 'HEAD' });
		if (!linuxRes.ok) continue;

		const platforms = [];

		const windowsUrl = `https://nginx.org/download/nginx-${version}.zip`;
		const windowsRes = await fetch(windowsUrl, { method: 'HEAD' });
		if (windowsRes.ok) {
			platforms.push({
				target: PlatformTarget.windows_amd64,
				url: windowsUrl
			});
		}

		platforms.push({
			target: PlatformTarget.linux_amd64,
			url: linuxUrl
		});

		platforms.push({
			target: PlatformTarget.macos_amd64,
			url: linuxUrl
		});

		platforms.push({
			target: PlatformTarget.macos_arm64,
			url: linuxUrl
		});

		releases.push({
			name: `Nginx ${era}`,
			version,
			era,
			release_date: '',
			platforms
		});
	}

	releases.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

	return releases;
}
