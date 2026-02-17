import { Release, PlatformTarget } from '../types/release';

// Fetches available Scala versions from the official Scala download page
export async function getReleases(): Promise<Release[]> {

	// Fetch Scala download page
	const response = await fetch('https://www.scala-lang.org/download/');

	if (!response.ok) {
		throw new Error('Failed to fetch Scala download page');
	}

	const html = await response.text();
	const regex = /(\d+\.\d+\.\d+)["<\s]/g;

	const seen = new Set<string>();
	// Use era as array key for deduplication
	const releases: Record<string, Release> = {};

	let match: RegExpExecArray | null;
	while ((match = regex.exec(html))) {
		const version = match[1];
		if (/preview|rc|alpha|beta|nightly/i.test(version)) continue;
		if (seen.has(version)) continue;
		seen.add(version);
		const [major, minor] = version.split('.').map(Number);
		const era = `${major}.${minor}`;
		// Overwrite if version is newer for this era
		if (!releases[era] || version.localeCompare(releases[era].version, undefined, { numeric: true }) > 0) {
			releases[era] = {
				id: `scala-${era}`,
				name: 'Scala',
				version,
				era,
				endoflife: null,
				platforms: [
					{
						target: PlatformTarget.linux_amd64,
						url: `https://downloads.lightbend.com/scala/${version}/scala-${version}.tgz`
					},
					{
						target: PlatformTarget.linux_arm64,
						url: `https://downloads.lightbend.com/scala/${version}/scala-${version}.tgz`
					},
					{
						target: PlatformTarget.macos_amd64,
						url: `https://downloads.lightbend.com/scala/${version}/scala-${version}.tgz`
					},
					{
						target: PlatformTarget.macos_arm64,
						url: `https://downloads.lightbend.com/scala/${version}/scala-${version}.tgz`
					},
					{
						target: PlatformTarget.windows_amd64,
						url: `https://downloads.lightbend.com/scala/${version}/scala-${version}.zip`
					}
				]
			};
		}
	}

	// Convert releases object to array and sort by era (descending)
	const sortedReleases = Object.values(releases).sort((a, b) => b.era.localeCompare(a.era, undefined, { numeric: true }));

	return sortedReleases;

	if (!releases) {
		throw new Error('Failed to fetch Scala releases');
	}

	// ...existing code...
	return sortedReleases;
}
