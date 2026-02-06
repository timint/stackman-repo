import { Release, PlatformTarget } from '../types/release';

// Fetches available Ruby versions from the official Ruby download page
export async function getReleases(): Promise<Release[]> {

	const res = await fetch('https://www.ruby-lang.org/en/downloads/releases/');
	if (!res.ok) throw new Error('Failed to fetch Ruby download page');

	const html = await res.text();
	const regex = />Ruby (\d+\.\d+\.\d+)</g;
	const seen = new Set<string>();

	// Fetch RubyInstaller downloads page for Windows binaries
	let installerHtml = '';
	try {
		const installerRes = await fetch('https://rubyinstaller.org/downloads/');
		if (installerRes.ok) {
			installerHtml = await installerRes.text();
		}
	} catch {
	}

	const releases: Release[] = [];

	let match: RegExpExecArray | null;
	while ((match = regex.exec(html))) {
		const version = match[1];
		if (seen.has(version)) continue;
		seen.add(version);

		const era = `${version.split('.')[0]}.${version.split('.')[1]}`;

		let url = `https://cache.ruby-lang.org/pub/ruby/${era}/ruby-${version}.tar.gz`;

		const checkRes = await fetch(url, { method: 'HEAD' });
		if (!checkRes.ok) {
			const eraRes = await fetch(`https://cache.ruby-lang.org/pub/ruby/${era}/`);
			const eraHtml = await eraRes.text();
			const escapedVersion = version.replace(/\./g, '\\.');
			const patchRegex = new RegExp(`ruby-${escapedVersion}-p(\\d+)\\.tar\\.gz`, 'g');
			let patchMatch;
			let latestPatch = 0;
			while ((patchMatch = patchRegex.exec(eraHtml))) {
				const patch = parseInt(patchMatch[1]);
				if (patch > latestPatch) latestPatch = patch;
			}
			if (latestPatch > 0) {
				url = `https://cache.ruby-lang.org/pub/ruby/${era}/ruby-${version}-p${latestPatch}.tar.gz`;
			}
		}

		const finalCheckRes = await fetch(url, { method: 'HEAD' });
		if (!finalCheckRes.ok) {
			const eraRes = await fetch(`https://cache.ruby-lang.org/pub/ruby/${era}/`);
			const eraHtml = await eraRes.text();
			const fileRegex = new RegExp(`href="(ruby-${version.replace(/\./g, '\\.')}-[^"]+\\.tar\\.gz)"`, 'i');
			const fileMatch = fileRegex.exec(eraHtml);
			if (fileMatch) {
				url = `https://cache.ruby-lang.org/pub/ruby/${era}/${fileMatch[1]}`;
			}
		}

		const platforms = [];

		// Find Windows binary from RubyInstaller
		const installerRegex = new RegExp(`rubyinstaller-devkit-${version.replace(/\./g, '\\\\.')}[^-]*-x64\\.exe`, 'i');
		const installerMatch = installerRegex.exec(installerHtml);
		if (installerMatch) {
			const installerUrlMatch = installerHtml.match(new RegExp(`https://github\\.com/oneclick/rubyinstaller2/releases/download/[^"]+/${installerMatch[0]}`));
			if (installerUrlMatch) {
				const windowsRes = await fetch(installerUrlMatch[0], { method: 'HEAD' });
				if (windowsRes.ok) {
					platforms.push({
						target: PlatformTarget.windows_amd64,
						url: installerUrlMatch[0]
					});
				}
			}
		}

		platforms.push({
			target: PlatformTarget.linux_amd64,
			url
		});

		platforms.push({
			target: PlatformTarget.macos_arm64,
			url
		});

		releases.push({
			name: `Ruby`,
			version,
			era,
			platforms
		});
	}

	// Sort by version descending for convenience
	releases.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

	return releases;
}
