import * as SecureStore from 'expo-secure-store';

const APP_TOKEN_KEY = 'app_session_token';

export async function getAppToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(APP_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setAppToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(APP_TOKEN_KEY, token);
}

export async function clearAppToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(APP_TOKEN_KEY);
  } catch {
    // ignore missing key
  }
}
