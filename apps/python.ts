import { Release, PlatformTarget } from '../types/release';

// Fetches available Python versions from official Python download page
export async function getReleases(): Promise<Release[]> {

	const res = await fetch('https://www.python.org/ftp/python/');
	if (!res.ok) throw new Error('Failed to fetch Python download page');

	const html = await res.text();
	const regex = /href="(\d+\.\d+\.\d+)\//g;
	const seen = new Set<string>();

	const releases: Release[] = [];

	let match: RegExpExecArray | null;
	while ((match = regex.exec(html))) {
		const version = match[1];
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

		const platforms = [];

		const linuxUrl = `https://www.python.org/ftp/python/${version}/Python-${version}.tgz`;
		const linuxRes = await fetch(linuxUrl, { method: 'HEAD' });
		if (linuxRes.ok) {
			platforms.push({
				target: PlatformTarget.linux_amd64,
				url: linuxUrl
			});
		}

		const windowsPatterns = [
			`python-${version}-embed-amd64.zip`,
			`python-${version}-amd64.zip`,
			`python-${version}-amd64.exe`
		];

		for (const pattern of windowsPatterns) {
			const windowsUrl = `https://www.python.org/ftp/python/${version}/${pattern}`;
			const windowsRes = await fetch(windowsUrl, { method: 'HEAD' });
			if (windowsRes.ok) {
				platforms.push({
					target: PlatformTarget.windows_amd64,
					url: windowsUrl
				});
				break;
			}
		}

		releases.push({
			name: `Python ${era}`,
			version,
			era,
			release_date: '',
			platforms
		});
	}

	// Sort by version descending for convenience
	releases.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

	return releases;
}
