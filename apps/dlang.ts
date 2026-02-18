import { Release, PlatformTarget } from '../types/release';

// Fetches available DLang versions from GitHub releases
export async function getReleases(): Promise<Release[]> {
	const response = await fetch('https://github.com/dlang/dmd/releases');
	if (!response.ok) throw new Error('Failed to fetch DLang releases');

	const html = await response.text();
	const seen = new Set<string>();
	// Use era as array key for deduplication
	const releases: Record<string, Release> = {};

	const versionRegex = /v(\d+\.\d+\.\d+)/g;
	let match: RegExpExecArray | null;

	while ((match = versionRegex.exec(html)) !== null) {
		const version = match[1];
		if (/preview|rc|alpha|beta|nightly/i.test(version)) continue;
		if (seen.has(version)) continue;
		seen.add(version);

		const [major, minor] = version.split('.').map(Number);
		const era = `${major}.${minor}`;

		// Overwrite if version is newer for this era
		if (!releases[era] || version.localeCompare(releases[era].version, undefined, { numeric: true }) > 0) {
			releases[era] = {
				id: `dlang-${era}`,
				name: 'D',
				version,
				era,
				supported: true,
				platforms: [
					{
						target: PlatformTarget.linux_amd64,
						url: `https://github.com/dlang/dmd/releases/download/v${version}/dmd.stable.linux.tar.xz`
					},
					{
						target: PlatformTarget.windows_amd64,
						url: `https://github.com/dlang/dmd/releases/download/v${version}/dmd.stable.windows.7z`
					},
					{
						target: PlatformTarget.macos_amd64,
						url: `https://github.com/dlang/dmd/releases/download/v${version}/dmd.stable.osx.tar.xz`
					},
					{
						target: PlatformTarget.macos_arm64,
						url: `https://github.com/dlang/dmd/releases/download/v${version}/dmd.stable.osx.tar.xz`
					}
				]
			};
		}
	}

	// Convert releases object to array and sort by era (descending)
	const sortedReleases = Object.values(releases).sort((a, b) => b.era.localeCompare(a.era, undefined, { numeric: true }));

	return sortedReleases;
}
