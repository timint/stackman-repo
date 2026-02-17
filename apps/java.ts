import { Release, PlatformTarget } from '../types/release';

// Fetches available Java versions from the official Adoptium API
export async function getReleases(): Promise<Release[]> {
	// Use Adoptium API for OpenJDK releases (LTS and latest)
	const response = await fetch('https://api.adoptium.net/v3/info/release_versions?release_type=ga&jvm_impl=hotspot&heap_size=normal&vendor=eclipse');

	if (!response.ok) throw new Error('Failed to fetch Java releases');

	const data = await response.json();
	const versions: any[] = data.versions || [];
	// Use era as array key for deduplication
	const releases: Record<string, Release> = {};

	for (const v of versions) {
		const version = v.openjdk_version || v.semver || v.version || v;
		if (typeof version !== 'string') continue;
		if (/preview|rc|alpha|beta|nightly/i.test(version)) continue;
		const major = parseInt(version.split('.')[0], 10);
		if (isNaN(major) || major < 8) continue;
		const era = `${major}`;

		// Overwrite if version is newer for this era
		if (!releases[era] || version.localeCompare(releases[era].version, undefined, { numeric: true }) > 0) {
			releases[era] = {
				id: `java-${era}`,
				name: 'OpenJDK',
				version,
				era,
				endoflife: null,
				platforms: [
					{
						target: PlatformTarget.windows_amd64,
						url: `https://github.com/adoptium/temurin${major}-binaries/releases/latest/download/OpenJDK${major}U-jdk_x64_windows_hotspot_${version}.zip`
					},
					{
						target: PlatformTarget.linux_amd64,
						url: `https://github.com/adoptium/temurin${major}-binaries/releases/latest/download/OpenJDK${major}U-jdk_x64_linux_hotspot_${version}.tar.gz`
					},
					{
						target: PlatformTarget.linux_arm64,
						url: `https://github.com/adoptium/temurin${major}-binaries/releases/latest/download/OpenJDK${major}U-jdk_aarch64_linux_hotspot_${version}.tar.gz`
					},
					{
						target: PlatformTarget.macos_amd64,
						url: `https://github.com/adoptium/temurin${major}-binaries/releases/latest/download/OpenJDK${major}U-jdk_x64_mac_hotspot_${version}.tar.gz`
					},
					{
						target: PlatformTarget.macos_arm64,
						url: `https://github.com/adoptium/temurin${major}-binaries/releases/latest/download/OpenJDK${major}U-jdk_aarch64_mac_hotspot_${version}.tar.gz`
					}
				]
			};
		}
	}

	// Convert releases object to array and sort by era (descending)
	const sortedReleases = Object.values(releases).sort((a, b) => b.era.localeCompare(a.era, undefined, { numeric: true }));

	return sortedReleases;
}
