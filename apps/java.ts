import { Release, PlatformTarget } from '../types/release';

// Fetches available Java versions from the official Adoptium API
export async function getReleases(): Promise<Release[]> {

	const res = await fetch('https://data.javaalmanac.io/v1/jdk/vendors/oracle');
	if (!res.ok) throw new Error('Failed to fetch Java releases');

	const data = await res.json();
	const releases: Release[] = [];

	if (data.products && data.products[0] && data.products[0].versions) {
		const seen = new Set<string>();
		for (const version of data.products[0].versions) {
			if (seen.has(version)) continue;
			seen.add(version);

			const era = version.split('.')[0];
			if (parseInt(era) < 8) continue;

			releases.push({
				name: `Java ${era}`,
				version,
				era,
				release_date: '',
				platforms: []
			});

			releases[releases.length - 1].platforms.push({
				target: PlatformTarget.windows_amd64,
				url: `https://download.java.net/java/GA/jdk${version}/binaries/openjdk-${version}_windows-x64_bin.zip`
			});

			releases[releases.length - 1].platforms.push({
				target: PlatformTarget.linux_amd64,
				url: `https://download.java.net/java/GA/jdk${version}/binaries/openjdk-${version}_linux-x64_bin.tar.gz`
			});

			releases[releases.length - 1].platforms.push({
				target: PlatformTarget.macos_arm64,
				url: `https://download.java.net/java/GA/jdk${version}/binaries/openjdk-${version}_macos-aarch64_bin.tar.gz`
			});
		}
	}

	// Sort by version descending for convenience
	releases.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

	return releases;
}
