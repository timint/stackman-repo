import { Release, PlatformTarget } from '../types/release';

export async function getReleases(): Promise<Release[]> {
	const res = await fetch('https://www.mongodb.com/try/download/community');
	if (!res.ok) throw new Error('Failed to fetch MongoDB Community download page');
	const html = await res.text();

	const versionMatches = html.matchAll(/\b(\d+\.\d+\.\d+)\b/g);
	const versionSet = new Set<string>();
	const latestByEra: Record<string, string> = {};
	for (const match of versionMatches) {
		const version = match[1];
		if (/preview|rc|alpha|beta|nightly/i.test(version)) continue;
		const major = Number(version.split('.')[0]);
		if (/^\d+\.\d+\.\d+$/.test(version) && [6, 7, 8].includes(major)) {
			const era = version.split('.').slice(0,2).join('.');
			if (!latestByEra[era] || version.localeCompare(latestByEra[era], undefined, { numeric: true }) > 0) {
				latestByEra[era] = version;
			}
		}
	}
	const releases: Release[] = [];
	for (const era in latestByEra) {
		const version = latestByEra[era];
		const [major, minor] = version.split('.').map(Number);
		releases.push({
			id: `mongodb-${era}`,
			name: 'MongoDB Community Server',
			version,
			era,
			endoflife: null,
			platforms: [
				{
					target: PlatformTarget.windows_amd64,
					url: `https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-${version}.zip`
				},
				{
					target: PlatformTarget.macos_amd64,
					url: `https://fastdl.mongodb.org/osx/mongodb-macos-x86_64-${version}.tgz`
				},
				{
					target: PlatformTarget.macos_arm64,
					url: `https://fastdl.mongodb.org/osx/mongodb-macos-arm64-${version}.tgz`
				},
				{
					target: PlatformTarget.linux_amd64,
					url: `https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-ubuntu2204-${version}.tgz`
				},
				{
					target: PlatformTarget.linux_arm64,
					url: `https://fastdl.mongodb.org/linux/mongodb-linux-aarch64-ubuntu2204-${version}.tgz`
				}
			]
		});
	}

	if (!releases) {
		throw new Error('Failed to fetch MongoDB releases');
	}

	releases.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

	return releases;
}
