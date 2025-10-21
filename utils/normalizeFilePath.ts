import { Platform } from "react-native";
import RNBlobUtil from "react-native-blob-util";

/**
 * Convert content:// URI (Android) về file:// path để axios upload được.
 */
export const normalizeFilePath = async (uri: string): Promise<string> => {
  if (Platform.OS === "android" && uri.startsWith("content://")) {
    const stat = await RNBlobUtil.fs.stat(uri);
    return stat.path.startsWith("file://") ? stat.path : `file://${stat.path}`;
  }
  return uri;
};
