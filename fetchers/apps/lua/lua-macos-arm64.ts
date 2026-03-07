import { Release } from '../../../types/release';

export async function getReleases(): Promise<Release[]> {
	// LuaBinaries does not currently provide ARM64 binaries for macOS
	return [];
}
