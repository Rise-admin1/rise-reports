import * as SecureStore from 'expo-secure-store';

const VAULT_TOKEN_KEY = 'vault_session_token';

export async function getVaultToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(VAULT_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setVaultToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(VAULT_TOKEN_KEY, token);
}

export async function clearVaultToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(VAULT_TOKEN_KEY);
  } catch {
    // ignore missing key
  }
}
