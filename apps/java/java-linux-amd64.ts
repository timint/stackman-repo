import { Release, PlatformTarget } from '../../types/release';

export async function getReleases(): Promise<Release[]> {
	const response = await fetch('https://api.adoptium.net/v3/info/release_versions?release_type=ga&jvm_impl=hotspot&heap_size=normal&vendor=eclipse');

	if (!response.ok) throw new Error('Failed to fetch Java releases');

	const data = await response.json();
	const versions: any[] = data.versions || [];
	const releases: Record<string, Release> = {};

	for (const v of versions) {
		const version = v.openjdk_version || v.semver || v.version || v;
		if (typeof version !== 'string') continue;
		if (/preview|rc|alpha|beta|nightly/i.test(version)) continue;
		const major = parseInt(version.split('.')[0], 10);
		if (isNaN(major) || major < 8) continue;
		const era = `${major}`;

		if (!releases[era] || version.localeCompare(releases[era].version, undefined, { numeric: true }) > 0) {
			releases[era] = {
				id: `java-${era}`,
				name: 'OpenJDK',
				version,
				era,
				supported: true,
				url: `https://github.com/adoptium/temurin${major}-binaries/releases/latest/download/OpenJDK${major}U-jdk_x64_linux_hotspot_${version}.tar.gz`,
				target: PlatformTarget.linux_amd64
			};
		}
	}

	const sortedReleases = Object.values(releases).sort((a, b) => b.era.localeCompare(a.era, undefined, { numeric: true }));

	return sortedReleases;
}
