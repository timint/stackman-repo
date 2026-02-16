import { version } from 'bun';
import { Release, PlatformTarget } from '../types/release';

// Fetches available Ruby versions from the official Ruby download page
export async function getReleases(): Promise<Release[]> {

	const res = await fetch('https://www.ruby-lang.org/en/downloads/releases/');

	if (!res.ok) {
		throw new Error('Failed to fetch Ruby download page');
	}

	const html = await res.text();
	const regex = />Ruby (\d+\.\d+\.\d+)</g;
	const seen = new Set<string>();

	// Fetch RubyInstaller downloads page for Windows binaries
	let installerHtml = '';

	const response = await fetch('https://rubyinstaller.org/downloads/');
	if (response.ok) {
		installerHtml = await response.text();
	}

	const releases: Release[] = [];

	for (const match of html.matchAll(regex)) {
		const version = match[1];
		const era = version.slice(0, 3);

		// Skip preview, rc, alpha, beta, nightly
		if (/preview|rc|alpha|beta|nightly/i.test(version)) continue;

		if (seen.has(version)) continue;
		seen.add(version);

		releases.push({
			id: `ruby-${era}`,
			name: `Ruby`,
			version,
			era,
			endoflife: null,
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
				},
				{
					target: PlatformTarget.windows_amd64,
					url: `https://cache.ruby-lang.org/pub/ruby/${era}/ruby-${version}.tar.gz`
				},
			]
		});
	}

	if (!releases) {
		throw new Error('Failed to fetch Ruby releases');
	}

	releases.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

	return releases;
}
