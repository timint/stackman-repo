import { Release, PlatformTarget } from '../../../types/release';
import { getMariaDbReleases } from './get-mariadb-releases';

export async function getReleases(): Promise<Release[]> {
	return getMariaDbReleases(PlatformTarget.macos_amd64);
}
