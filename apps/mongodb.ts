import { Release, PlatformTarget } from '../types/release';

export async function getReleases(): Promise<Release[]> {
	// Fetch MongoDB Community download page
	const response = await fetch('https://www.mongodb.com/try/download/community');
	if (!response.ok) throw new Error('Failed to fetch MongoDB Community download page');
	const html = await response.text();

	const versionMatches = html.matchAll(/\b(\d+\.\d+\.\d+)\b/g);
	// Use era as array key for deduplication
	const releases: Record<string, Release> = {};

	for (const match of versionMatches) {
		const version = match[1];
		if (/preview|rc|alpha|beta|nightly/i.test(version)) continue;
		const major = Number(version.split('.')[0]);
		if (/^\d+\.\d+\.\d+$/.test(version) && [6, 7, 8].includes(major)) {
			const era = version.split('.').slice(0, 2).join('.');
			// Overwrite if version is newer for this era
			if (!releases[era] || version.localeCompare(releases[era].version, undefined, { numeric: true }) > 0) {
				releases[era] = {
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
				};
			}
		}
	}

	// Convert releases object to array and sort by era (descending)
	const sortedReleases = Object.values(releases).sort((a, b) => b.era.localeCompare(a.era, undefined, { numeric: true }));

	return sortedReleases;
}
