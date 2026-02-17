import { Release, PlatformTarget } from '../types/release';

// Fetches available Kotlin versions from the official Kotlin releases API
export async function getReleases(): Promise<Release[]> {
	const response = await fetch('https://api.github.com/repos/JetBrains/kotlin/releases');
	if (!response.ok) throw new Error('Failed to fetch Kotlin releases');

	const data = await response.json();
	const seen = new Set<string>();
	// Use era as array key for deduplication
	const releases: Record<string, Release> = {};

	for (const release of data) {
		const version = release.tag_name.replace(/^v/, '');
		if (/preview|rc|alpha|beta|nightly/i.test(version)) continue;
		if (seen.has(version)) continue;
		seen.add(version);

		const [major, minor] = version.split('.').map(Number);
		const era = `${major}.${minor}`;

		// Overwrite if version is newer for this era
		if (!releases[era] || version.localeCompare(releases[era].version, undefined, { numeric: true }) > 0) {
			releases[era] = {
				id: `kotlin-${era}`,
				name: 'Kotlin',
				version,
				era,
				endoflife: null,
				platforms: [
					{
						target: PlatformTarget.linux_amd64,
						url: `https://github.com/JetBrains/kotlin/releases/download/v${version}/kotlin-compiler-${version}.zip`
					},
					{
						target: PlatformTarget.linux_arm64,
						url: `https://github.com/JetBrains/kotlin/releases/download/v${version}/kotlin-compiler-${version}.zip`
					},
					{
						target: PlatformTarget.windows_amd64,
						url: `https://github.com/JetBrains/kotlin/releases/download/v${version}/kotlin-compiler-${version}.zip`
					},
					{
						target: PlatformTarget.macos_amd64,
						url: `https://github.com/JetBrains/kotlin/releases/download/v${version}/kotlin-compiler-${version}.zip`
					},
					{
						target: PlatformTarget.macos_arm64,
						url: `https://github.com/JetBrains/kotlin/releases/download/v${version}/kotlin-compiler-${version}.zip`
					}
				]
			};
		}
	}

	// Convert releases object to array and sort by era (descending)
	const sortedReleases = Object.values(releases).sort((a, b) => b.era.localeCompare(a.era, undefined, { numeric: true }));

	return sortedReleases;
}
