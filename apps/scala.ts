import { Release, PlatformTarget } from '../types/release';

// Fetches available Scala versions from the official Scala download page
export async function getReleases(): Promise<Release[]> {

	const res = await fetch('https://www.scala-lang.org/download/');
	if (!res.ok) throw new Error('Failed to fetch Scala download page');

	const html = await res.text();
	const regex = /(\d+\.\d+\.\d+)["<\s]/g;
	const seen = new Set<string>();

	const releases: Release[] = [];

	let match: RegExpExecArray | null;
	while ((match = regex.exec(html))) {
		const version = match[1];
		if (seen.has(version)) continue;
		seen.add(version);

		const [major, minor] = version.split('.').map(Number);
		const era = `${major}.${minor}`;

		const linuxUrl = `https://downloads.lightbend.com/scala/${version}/scala-${version}.tgz`;
		const windowsUrl = `https://downloads.lightbend.com/scala/${version}/scala-${version}.zip`;

		// Verify URLs exist before adding
		let linuxExists = false;
		let windowsExists = false;

		try {
			const linuxResponse = await fetch(linuxUrl, { method: 'HEAD' });
			linuxExists = linuxResponse.ok;
		} catch {}

		try {
			const windowsResponse = await fetch(windowsUrl, { method: 'HEAD' });
			windowsExists = windowsResponse.ok;
		} catch {}

		if (!linuxExists && !windowsExists) {
			continue;
		}

		const platforms = [];

		if (linuxExists) {
			platforms.push(
				{
					target: PlatformTarget.linux_amd64,
					url: linuxUrl
				},
				{
					target: PlatformTarget.macos_amd64,
					url: linuxUrl
				},
				{
					target: PlatformTarget.macos_arm64,
					url: linuxUrl
				}
			);
		}

		if (windowsExists) {
			platforms.push({
				target: PlatformTarget.windows_amd64,
				url: windowsUrl
			});
		}

		releases.push({
			name: `Scala ${era}`,
			version,
			era,
			release_date: '',
			platforms
		});

	}

	releases.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

	return releases;
}
