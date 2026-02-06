import { Release, PlatformTarget } from '../types/release';

// Fetches available Kotlin versions from the official Kotlin releases API
export async function getReleases(): Promise<Release[]> {

	const res = await fetch('https://api.github.com/repos/JetBrains/kotlin/releases');
	if (!res.ok) throw new Error('Failed to fetch Kotlin releases');

	const data = await res.json();
	const seen = new Set<string>();
	const releases: Release[] = [];

	for (const release of data) {
		const version = release.tag_name.replace(/^v/, '');
		if (seen.has(version)) continue;
		seen.add(version);

		const [major, minor] = version.split('.').map(Number);
		const era = `${major}.${minor}`;

		releases.push({
			name: `Kotlin ${era}`,
			version,
			era,
			release_date: release.published_at || '',
			platforms: [
				{
					target: PlatformTarget.linux_amd64,
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
		});
	}

	releases.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

	return releases;
}
