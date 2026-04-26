import { PlatformTarget, Release } from '../../../types/release';
import { getGroovyReleases } from './get-groovy-releases';

export async function getReleases(): Promise<Release[]> {
	return getGroovyReleases(PlatformTarget.linux_amd64);
}
