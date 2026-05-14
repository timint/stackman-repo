import { PlatformTarget, Release } from '../../../types/release';
import { getDartReleases } from './get-dart-releases';

export async function getReleases(): Promise<Release[]> {
	return getDartReleases(PlatformTarget.linux_amd64);
}
