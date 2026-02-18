import { Release, PlatformTarget } from '../../types/release';

export async function getReleases(): Promise<Release[]> {
	const response = await fetch('https://www.ruby-lang.org/en/downloads/releases/');

	if (!response.ok) {
		throw new Error('Failed to fetch Ruby download page');
	}

	const html = await response.text();
	const regex = />Ruby (\d+\.\d+\.\d+)</g;

	const seen = new Set<string>();
	const releases: Record<string, Release> = {};

	for (const match of html.matchAll(regex)) {
		const version = match[1];
		const era = version.slice(0, 3);

		if (/preview|rc|alpha|beta|nightly/i.test(version)) continue;

		if (seen.has(version)) continue;
		seen.add(version);

		if (!releases[era] || version.localeCompare(releases[era].version, undefined, { numeric: true }) > 0) {
			releases[era] = {
				id: `ruby-${era}`,
				name: 'Ruby',
				version,
				era,
				supported: true,
				url: `https://cache.ruby-lang.org/pub/ruby/${era}/ruby-${version}.tar.gz`,
				target: PlatformTarget.macos_amd64
			};
		}
	}

	return Object.values(releases).sort((a, b) => b.era.localeCompare(a.era, undefined, { numeric: true }));
}
