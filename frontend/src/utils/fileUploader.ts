import * as FileSystem from "expo-file-system/legacy";
import { ENDPOINTS } from "../constants/api";
import { authStorage } from "../services/authStorage";

export type UploadTargetType = "avatar" | "cover" | "photo" | "video" | "posts";

/**
 * Uploads a local file (e.g. file:///var/mobile/... or content://...) to the backend
 * and returns the remote accessible HTTP URL (http://192.168.1.83:8000/uploads/...).
 *
 * @param onProgress Optional 0..1 progress callback. When supplied, the XHR strategy
 * (which reports real byte-level progress through `xhr.upload.onprogress`) is attempted
 * first so the caller gets smooth feedback; FileSystem and base64 then act as
 * coarse-grained fallbacks. Without a callback the original FileSystem-first order is kept.
 */
export async function uploadFileToServer(
  uri: string,
  targetType: UploadTargetType = "posts",
  onProgress?: (progress: number) => void
): Promise<string> {
  const report = (value: number) => {
    if (!onProgress) return;
    try {
      onProgress(Math.max(0, Math.min(1, value)));
    } catch {
      /* a faulty progress consumer must never break an upload */
    }
  };

  if (!uri) return uri;

  // If already an HTTP/HTTPS URL or bundled asset key, return as-is
  if (
    uri.startsWith("http://") ||
    uri.startsWith("https://") ||
    uri.startsWith("asset:")
  ) {
    report(1);
    return uri;
  }

  const folder =
    targetType === "avatar"
      ? "avatars"
      : targetType === "cover"
        ? "covers"
        : "posts";

  const filename =
    uri.split("/").pop() ||
    (targetType === "video" ? "video.mp4" : "media.jpg");
  const ext = filename.split(".").pop()?.toLowerCase() || (targetType === "video" ? "mp4" : "jpg");

  let mimeType = "image/jpeg";
  if (targetType === "video" || ext === "mp4" || ext === "mov") {
    mimeType = ext === "mov" ? "video/quicktime" : "video/mp4";
  } else if (ext === "png") {
    mimeType = "image/png";
  } else if (ext === "webp") {
    mimeType = "image/webp";
  }

  const token = await authStorage.getToken();

  // Pick primary & fallback upload endpoints
  const endpoints =
    folder === "avatars" || folder === "covers"
      ? [ENDPOINTS.auth.upload, ENDPOINTS.posts.upload, ENDPOINTS.gateway.upload]
      : [ENDPOINTS.posts.upload, ENDPOINTS.gateway.upload, ENDPOINTS.auth.upload];

  // XHR first when the caller wants live progress, otherwise keep the native
  // FileSystem streaming path in front (it bypasses the JS FormData layer entirely).
  const strategyOrder: ("xhr" | "fs" | "b64")[] = onProgress
    ? ["xhr", "fs", "b64"]
    : ["fs", "xhr", "b64"];

  // 1. STRATEGY 1: Native Expo FileSystem Multipart Upload
  // This bypasses the JavaScript fetch FormData polyfill and directly streams the file from native iOS/Android sandbox
  const tryFileSystem = async (): Promise<string | null> => {
    report(0.4);
    for (const endpoint of endpoints) {
      try {
        console.log(`[FileUploader] Uploading via FileSystem.uploadAsync to: ${endpoint}`);
        const uploadRes = await FileSystem.uploadAsync(endpoint, uri, {
          httpMethod: "POST",
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          fieldName: "file",
          parameters: {
            folder,
          },
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
              }
            : {
                Accept: "application/json",
              },
        });

        if (uploadRes.status >= 200 && uploadRes.status < 300 && uploadRes.body) {
          const parsed = JSON.parse(uploadRes.body);
          if (parsed && parsed.url) {
            console.log(`[FileUploader] Upload succeeded: ${parsed.url}`);
            return parsed.url;
          }
        }
      } catch (err) {
        console.log(`[FileUploader] FileSystem.uploadAsync failed on ${endpoint}:`, err);
      }
    }
    return null;
  };

  // 2. STRATEGY 2: Native React Native XMLHttpRequest (bypasses Expo Winter fetch polyfill)
  const tryXhr = async (): Promise<string | null> => {
    for (const endpoint of endpoints) {
      try {
        console.log(`[FileUploader] Trying XHR upload on: ${endpoint}`);
        const xhrResult = await uploadViaXHR(endpoint, uri, filename, mimeType, folder, token, report);
        if (xhrResult && xhrResult.url) {
          console.log(`[FileUploader] XHR upload succeeded: ${xhrResult.url}`);
          return xhrResult.url;
        }
      } catch (xhrErr) {
        console.log(`[FileUploader] XHR upload failed on ${endpoint}:`, xhrErr);
      }
    }
    return null;
  };

  // 3. STRATEGY 3: Real Base64 Read & Upload
  // Read actual binary bytes into a base64 string from device disk
  const tryBase64 = async (): Promise<string | null> => {
    try {
      console.log(`[FileUploader] Trying Base64 read & upload...`);
      const base64Data = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      report(0.6);

      if (base64Data && base64Data.length > 0) {
        for (const endpoint of endpoints) {
          try {
            const res = await fetch(endpoint, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({
                data: base64Data,
                media_type: mimeType,
                folder,
              }),
            });

            if (res.ok) {
              const json = await res.json();
              if (json && json.url) {
                console.log(`[FileUploader] Base64 upload succeeded: ${json.url}`);
                return json.url;
              }
            }
          } catch (b64Err) {
            console.log(`[FileUploader] Base64 POST failed on ${endpoint}:`, b64Err);
          }
        }
      }
    } catch (fsErr) {
      console.log(`[FileUploader] Failed to read file as Base64:`, fsErr);
    }
    return null;
  };

  for (const strategy of strategyOrder) {
    const url =
      strategy === "fs"
        ? await tryFileSystem()
        : strategy === "xhr"
          ? await tryXhr()
          : await tryBase64();

    if (url) {
      report(1);
      return url;
    }
  }

  throw new Error("Failed to upload media to server. Please check your network connection and try again.");
}

/**
 * XHR Upload implementation leveraging native React Native RCTNetworking.
 * Reports real upload progress through `onProgress` when provided.
 */
function uploadViaXHR(
  url: string,
  fileUri: string,
  filename: string,
  mimeType: string,
  folder: string,
  token: string | null,
  onProgress?: (progress: number) => void
): Promise<{ url: string; [key: string]: any }> {
  return new Promise((resolve, reject) => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url, true);
      xhr.timeout = 60000; // 60s timeout for large uploads

      xhr.setRequestHeader("Accept", "application/json");
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }

      if (onProgress) {
        xhr.upload.onprogress = (event: ProgressEvent) => {
          if (event.lengthComputable && event.total > 0) {
            // Cap at 0.99 until the response arrives so 100% always means "done"
            onProgress(Math.min(0.99, event.loaded / event.total));
          }
        };
        xhr.upload.onerror = () => onProgress(0);
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve(data);
          } catch {
            resolve({ url: xhr.responseText });
          }
        } else {
          reject(new Error(`XHR returned status ${xhr.status}: ${xhr.responseText}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error("Network error during XHR file upload"));
      };

      xhr.ontimeout = () => {
        reject(new Error("Upload request timed out"));
      };

      const formData = new FormData();
      formData.append("file", {
        uri: fileUri,
        name: filename,
        type: mimeType,
      } as any);
      formData.append("folder", folder);

      xhr.send(formData);
    } catch (err) {
      reject(err);
    }
  });
}
