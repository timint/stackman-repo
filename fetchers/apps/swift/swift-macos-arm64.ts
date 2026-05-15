import { PlatformTarget, Release } from '../../../types/release';
import { getSwiftReleases } from './get-swift-releases';

export async function getReleases(): Promise<Release[]> {
  return getSwiftReleases(PlatformTarget.macos_arm64);
}
