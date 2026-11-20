import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// SecureStore has no web module — the browser build throws
// "getValueWithKeyAsync is not a function" on the first read — so the web
// target keeps its values in localStorage while devices keep the keychain.
const isWeb = Platform.OS === "web";

/** Null when the page has no storage, as in a sandboxed context. */
const webStorage = (): Storage | null => {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
};

export const readKey = async (key: string): Promise<string | null> =>
  isWeb ? (webStorage()?.getItem(key) ?? null) : SecureStore.getItemAsync(key);

export const writeKey = async (key: string, value: string): Promise<void> => {
  if (!isWeb) {
    await SecureStore.setItemAsync(key, value);
    return;
  }
  webStorage()?.setItem(key, value);
};

export const deleteKey = async (key: string): Promise<void> => {
  if (!isWeb) {
    await SecureStore.deleteItemAsync(key);
    return;
  }
  webStorage()?.removeItem(key);
};
