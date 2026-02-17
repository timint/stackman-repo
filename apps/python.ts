import { Release, PlatformTarget } from '../types/release';

// Fetches available Python versions from official Python download page
export async function getReleases(): Promise<Release[]> {

	// Fetch Python download page
	const response = await fetch('https://www.python.org/ftp/python/');

	if (!response.ok) {
		throw new Error('Failed to fetch Python download page');
	}

	const html = await response.text();
	const regex = /href="(\d+\.\d+\.\d+)\//g;

	const seen = new Set<string>();
	// Use era as array key for deduplication
	const releases: Record<string, Release> = {};

	let match: RegExpExecArray | null;
	while ((match = regex.exec(html))) {
		const version = match[1];

		// Make sure we haven't seen this version before
		if (seen.has(version)) continue;
		seen.add(version);

		const versionRes = await fetch(`https://www.python.org/ftp/python/${version}/`);
		if (!versionRes.ok) continue;
		const versionHtml = await versionRes.text();

		const hasAlpha = /Python-${version}a\d+\./.test(versionHtml) || /python-${version}a\d+\./.test(versionHtml);
		const hasBeta = /Python-${version}b\d+\./.test(versionHtml) || /python-${version}b\d+\./.test(versionHtml);
		const hasRC = /Python-${version}rc\d+\./.test(versionHtml) || /python-${version}rc\d+\./.test(versionHtml);

		if (hasAlpha || hasBeta || hasRC) {
			const hasStable = /Python-${version}\.(tgz|tar\.gz|tar\.xz)/.test(versionHtml) && !/Python-${version}[abr]\d+\./.test(versionHtml);
			if (!hasStable) continue;
		}

		const [major, minor] = version.split('.').map(Number);
		const era = `${major}.${minor}`;

		if (major < 3 || (major === 3 && minor < 8)) continue;

		// Overwrite if version is newer for this era
		if (!releases[era] || version.localeCompare(releases[era].version, undefined, { numeric: true }) > 0) {
			releases[era] = {
				id: `python-${era}`,
				name: 'Python',
				version,
				era,
				endoflife: null,
				platforms: [
					{
						target: PlatformTarget.linux_amd64,
						url: `https://www.python.org/ftp/python/${version}/Python-${version}.tgz`
					},
					{
						target: PlatformTarget.linux_arm64,
						url: `https://www.python.org/ftp/python/${version}/Python-${version}.tgz`
					},
					{
						target: PlatformTarget.macos_amd64,
						url: `https://www.python.org/ftp/python/${version}/Python-${version}.tgz`
					},
					{
						target: PlatformTarget.macos_arm64,
						url: `https://www.python.org/ftp/python/${version}/Python-${version}.tgz`
					},
					{
						target: PlatformTarget.windows_amd64,
						url: `https://www.python.org/ftp/python/${version}/python-${version}-embed-amd64.zip`
					}
				]
			};
		}
	}

	// Convert releases object to array and sort by era (descending)
	const sortedReleases = Object.values(releases).sort((a, b) => b.era.localeCompare(a.era, undefined, { numeric: true }));

	return sortedReleases;
}
