import { Release, Platform, Architecture } from '../types/release';

// Fetches available .NET versions from the official .NET releases index
export async function getReleases(): Promise<Release[]> {

  const versionsRes = await fetch('https://dotnetcli.blob.core.windows.net/dotnet/release-metadata/versions.json');
  if (!versionsRes.ok) throw new Error('Failed to fetch .NET versions');

  const versionsData = await versionsRes.json();
  const releases: Release[] = [];
  const seen = new Set<string>();

  for (const rel of versionsData.releases || []) {
    const channel = rel['channel-version'];
    if (!channel) continue;

    const channelUrl = `https://dotnetcli.blob.core.windows.net/dotnet/release-metadata/${channel}/releases.json`;
    try {
      const channelRes = await fetch(channelUrl);
      if (!channelRes.ok) continue;

      const channelData = await channelRes.json();
      const version = channelData['latest-sdk'];
      if (!version || seen.has(version)) continue;
      seen.add(version);

      const [major, minor] = version.split('.').map(Number);
      const era = `${major}.${minor}`;

      releases.push({
        name: `.NET ${era}`,
        version,
        era,
        release_date: '',
        platforms: [
          {
            platform: Platform.linux,
            architecture: Architecture.amd64,
            url: `https://dotnetcli.azureedge.net/dotnet/Sdk/${version}/dotnet-sdk-${version}-linux-x64.tar.gz`,
            size: 0
          },
          {
            platform: Platform.windows,
            architecture: Architecture.amd64,
            url: `https://dotnetcli.azureedge.net/dotnet/Sdk/${version}/dotnet-sdk-${version}-win-x64.zip`,
            size: 0
          },
          {
            platform: Platform.macos,
            architecture: Architecture.amd64,
            url: `https://dotnetcli.azureedge.net/dotnet/Sdk/${version}/dotnet-sdk-${version}-osx-x64.tar.gz`,
            size: 0
          },
          {
            platform: Platform.macos,
            architecture: Architecture.aarch64,
            url: `https://dotnetcli.azureedge.net/dotnet/Sdk/${version}/dotnet-sdk-${version}-osx-arm64.tar.gz`,
            size: 0
          }
        ]
      });
    } catch (e) {
      console.error(`Failed to fetch .NET channel ${channel}:`, e);
    }
  }

  releases.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

  return releases;
}
