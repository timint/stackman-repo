import { Release, PlatformTarget } from '../../../types/release';

export async function getReleases(): Promise<Release[]> {
	const response = await fetch('https://api.github.com/repos/JetBrains/kotlin/releases?per_page=100');
	if (!response.ok) throw new Error('Failed to fetch Kotlin releases');

	const data = await response.json();
	const seen = new Set<string>();
	const releases: Record<string, Release> = {};

	for (const release of data) {
		const version = release.tag_name.replace(/^v/, '');
		if (/preview|rc|alpha|beta|nightly/i.test(version)) continue;
		if (seen.has(version)) continue;
		seen.add(version);

		const [major, minor] = version.split('.').map(Number);
		const era = `${major}.${minor}`;

		if (!releases[era] || version.localeCompare(releases[era].version, undefined, { numeric: true }) > 0) {
			releases[era] = {
				id: `kotlin-${era}`,
				name: 'Kotlin',
				version,
				era,
				supported: null,
				url: `https://github.com/JetBrains/kotlin/releases/download/v${version}/kotlin-compiler-${version}.zip`,
				target: PlatformTarget.macos_arm64,
				size: null
			};
		}
	}

	return Object.values(releases).sort((a, b) => b.era.localeCompare(a.era, undefined, { numeric: true }));
}
