import * as SecureStore from 'expo-secure-store';

// Tokens live in the Android Keystore-backed secure store — never AsyncStorage.
const ACCESS = 'access_token';
const REFRESH = 'refresh_token';

export const getAccessToken = () => SecureStore.getItemAsync(ACCESS);
export const getRefreshToken = () => SecureStore.getItemAsync(REFRESH);
export async function saveTokens(access: string, refresh: string) {
  await SecureStore.setItemAsync(ACCESS, access);
  await SecureStore.setItemAsync(REFRESH, refresh);
}
export async function clearTokens() {
  await SecureStore.deleteItemAsync(ACCESS);
  await SecureStore.deleteItemAsync(REFRESH);
}
