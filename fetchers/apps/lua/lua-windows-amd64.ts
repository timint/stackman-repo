import { Release, PlatformTarget } from '../../../types/release';

export async function getReleases(): Promise<Release[]> {
	const response = await fetch('https://luabinaries.sourceforge.net/download.html');
	if (!response.ok) throw new Error('Failed to fetch LuaBinaries download page');

	const html = await response.text();
	// Matches hrefs like: .../lua-5.4.2_Win64_bin.zip/download
	const regex = /<a\s+[^>]*href="([^"]*\/lua-([\d\.]+)_Win64_bin\.zip\/download)"/gi;

	const seen = new Set<string>();
	const releases: Record<string, Release> = {};

	let match: RegExpExecArray | null;
	while ((match = regex.exec(html))) {
		const version = match[2];
		const url = match[1];

		if (seen.has(version)) continue;
		seen.add(version);

		const [major, minor] = version.split('.').map(Number);
		const era = `${major}.${minor}`;

		if (!releases[era] || version.localeCompare(releases[era].version, undefined, { numeric: true }) > 0) {
			releases[era] = {
				id: `lua-${era}`,
				name: 'Lua',
				version,
				era,
				supported: null,
				url,
				target: PlatformTarget.windows_amd64,
				size: null
			};
		}
	}

	return Object.values(releases).sort((a, b) => b.era.localeCompare(a.era, undefined, { numeric: true }));
}
