/**
 * Points at apps/web's dev server. iOS Simulator shares the host's network
 * namespace so `localhost` works there; a physical device or Android
 * emulator needs the host machine's LAN IP instead (Android emulator's
 * host alias is 10.0.2.2). Override via EXPO_PUBLIC_API_URL in
 * apps/mobile/.env for those cases.
 */
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
