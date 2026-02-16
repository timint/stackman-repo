import { Release, PlatformTarget } from '../types/release';

// Fetches available DLang versions from GitHub releases
export async function getReleases(): Promise<Release[]> {
	const releases: Release[] = [];
	const seen = new Set<string>();
	const latestByEra: Record<string, string> = {};

	const response = await fetch('https://github.com/dlang/dmd/releases');
	const html = await response.text();

	const versionRegex = /v(\d+\.\d+\.\d+)/g;
	let match;

	while ((match = versionRegex.exec(html)) !== null) {
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
			id: `dlang-${era}`,
			name: `D`,
			version,
			era,
			endoflife: null,
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
		});
	}

	if (!releases) {
		throw new Error('Failed to fetch DLang releases');
	}

	releases.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

	return releases;
}
