import { Release, PlatformTarget } from '../types/release';

// Fetches available Scala versions from the official Scala download page
export async function getReleases(): Promise<Release[]> {

	const res = await fetch('https://www.scala-lang.org/download/');

	if (!res.ok) {
		throw new Error('Failed to fetch Scala download page');
	}

	const html = await res.text();
	const regex = /(\d+\.\d+\.\d+)["<\s]/g;
	const seen = new Set<string>();

	const releases: Release[] = [];

	let match: RegExpExecArray | null;
	const latestByEra: Record<string, string> = {};
	while ((match = regex.exec(html))) {
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
			id: `scala-${era}`,
			name: `Scala`,
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
				},
			]
		});
	}

	if (!releases) {
		throw new Error('Failed to fetch Scala releases');
	}

	releases.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

	return releases;
}
