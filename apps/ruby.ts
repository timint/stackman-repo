import { version } from 'bun';
import { Release, PlatformTarget } from '../types/release';

// Fetches available Ruby versions from the official Ruby download page
export async function getReleases(): Promise<Release[]> {

	// Fetch Ruby releases from the official Ruby download page
	const response = await fetch('https://www.ruby-lang.org/en/downloads/releases/');

	if (!response.ok) {
		throw new Error('Failed to fetch Ruby download page');
	}

	const html = await response.text();
	const regex = />Ruby (\d+\.\d+\.\d+)</g;

	const seen = new Set<string>();
	// Use era as array key for deduplication
	const releases: Record<string, Release> = {};

	// Fetch RubyInstaller downloads page for Windows binaries (optional, not used in this block)
	// let installerHtml = '';
	// const installerResponse = await fetch('https://rubyinstaller.org/downloads/');
	// if (installerResponse.ok) {
	// 	installerHtml = await installerResponse.text();
	// }

	for (const match of html.matchAll(regex)) {
		const version = match[1];
		const era = version.slice(0, 3);

		// Skip preview, rc, alpha, beta, nightly
		if (/preview|rc|alpha|beta|nightly/i.test(version)) continue;

		if (seen.has(version)) continue;
		seen.add(version);

		// Overwrite if version is newer for this era
		if (!releases[era] || version.localeCompare(releases[era].version, undefined, { numeric: true }) > 0) {
			releases[era] = {
				id: `ruby-${era}`,
				name: 'Ruby',
				version,
				era,
				supported: true,
				platforms: [
					{
						target: PlatformTarget.linux_amd64,
						url: `https://cache.ruby-lang.org/pub/ruby/${era}/ruby-${version}.tar.gz`
					},
					{
						target: PlatformTarget.linux_arm64,
						url: `https://cache.ruby-lang.org/pub/ruby/${era}/ruby-${version}.tar.gz`
					},
					{
						target: PlatformTarget.macos_amd64,
						url: `https://cache.ruby-lang.org/pub/ruby/${era}/ruby-${version}.tar.gz`
					},
					{
						target: PlatformTarget.macos_arm64,
						url: `https://cache.ruby-lang.org/pub/ruby/${era}/ruby-${version}.tar.gz`
					}
				]
			};
		}
	}

	const sortedReleases = Object.values(releases).sort((a, b) => b.era.localeCompare(a.era, undefined, { numeric: true }));

	return sortedReleases;
}
