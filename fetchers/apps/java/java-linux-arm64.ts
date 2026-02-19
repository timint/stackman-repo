import { Release, PlatformTarget } from '../../../types/release';

export async function getReleases(): Promise<Release[]> {
	const availableResponse = await fetch('https://api.adoptium.net/v3/info/available_releases');
	if (!availableResponse.ok) throw new Error('Failed to fetch available Java releases');

	const availableData = await availableResponse.json();
	const availableVersions = availableData.available_releases || [];

	const releases: Record<string, Release> = {};

	for (const major of availableVersions) {
		if (major < 8) continue;

		const response = await fetch(`https://api.adoptium.net/v3/assets/latest/${major}/hotspot?architecture=aarch64&image_type=jdk&os=linux&vendor=eclipse`);
		if (!response.ok) continue;

		const data = await response.json();
		if (!Array.isArray(data) || data.length === 0) continue;

		const release = data[0];
		const version = release.version?.openjdk_version || release.version?.semver;
		if (!version) continue;
		if (/preview|rc|alpha|beta|nightly/i.test(version)) continue;

		const era = `${major}`;

		if (!releases[era] || version.localeCompare(releases[era].version, undefined, { numeric: true }) > 0) {
			releases[era] = {
				id: `java-${era}`,
				name: 'OpenJDK',
				version,
				era,
				supported: null,
				url: release.binary?.package?.link || release.binary?.link,
				target: PlatformTarget.linux_arm64
			};
		}
	}

	const sortedReleases = Object.values(releases).sort((a, b) => b.era.localeCompare(a.era, undefined, { numeric: true }));

	return sortedReleases;
}
