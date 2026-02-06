import { Release, PlatformTarget } from '../types/release';

// Fetches available Swift versions from the official Swift download page
export async function getReleases(): Promise<Release[]> {

	const res = await fetch('https://www.swift.org/download/');
	if (!res.ok) throw new Error('Failed to fetch Swift download page');

	const html = await res.text();
	const regex = /Swift\s+(\d+\.\d+(?:\.\d+)?)/g;
	const seen = new Set<string>();

	const releases: Release[] = [];

	let match: RegExpExecArray | null;
	while ((match = regex.exec(html))) {
		const version = match[1];
		if (seen.has(version)) continue;
		seen.add(version);

		const era = `${version.split('.')[0]}.${version.split('.')[1]}`;

		releases.push({
			name: `Swift ${era}`,
			version,
			era,
			release_date: '',
			platforms: []
		});

		releases[releases.length - 1].platforms.push({
			target: PlatformTarget.macos_arm64,
			url: `https://download.swift.org/swift-${version}-release/swift-${version}-RELEASE/swift-${version}-RELEASE-osx.pkg`
		});

		releases[releases.length - 1].platforms.push({
			target: PlatformTarget.linux_amd64,
			url: `https://download.swift.org/swift-${version}-release/swift-${version}-RELEASE/swift-${version}-RELEASE-ubuntu22.04.tar.gz`
		});
	}

	return releases;
}
