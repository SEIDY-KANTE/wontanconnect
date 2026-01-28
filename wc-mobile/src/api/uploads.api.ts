/**
 * Media Upload API
 *
 * Handles file uploads for messages (images, documents).
 * Uses multipart/form-data for efficient binary transfer.
 *
 * WHY: Mobile needs to upload images/documents to messages.
 * HOW: Uses FormData with progress tracking for UX feedback.
 * VERIFY: Test upload with image picker, check progress callback fires.
 */

import { apiClient } from "./client";
import { handleApiError } from "./errorHandling";
import { debugLog, errorLog } from "@/config";
import { Platform } from "react-native";

// ============================================================================
// TYPES
// ============================================================================

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  width?: number; // For images
  height?: number; // For images
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export type UploadProgressCallback = (progress: UploadProgress) => void;

export interface FileToUpload {
  uri: string;
  name: string;
  type: string; // MIME type
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedImageTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  allowedDocumentTypes: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ],
  timeout: 60000, // 60 seconds for large files
};

// ============================================================================
// VALIDATION
// ============================================================================

export class UploadValidationError extends Error {
  constructor(
    message: string,
    public readonly code: "FILE_TOO_LARGE" | "INVALID_TYPE" | "NO_FILE",
  ) {
    super(message);
    this.name = "UploadValidationError";
  }
}

function validateFile(file: FileToUpload, allowedTypes: string[]): void {
  if (!file.uri) {
    throw new UploadValidationError("No file provided", "NO_FILE");
  }

  if (!allowedTypes.includes(file.type)) {
    throw new UploadValidationError(
      `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(", ")}`,
      "INVALID_TYPE",
    );
  }
}

// ============================================================================
// UPLOAD FUNCTIONS
// ============================================================================

/**
 * Upload an image attachment for a message
 *
 * @param file - The file to upload (from image picker)
 * @param conversationId - The conversation to associate with
 * @param onProgress - Optional progress callback
 * @returns Upload result with URL
 */
export async function uploadMessageImage(
  file: FileToUpload,
  conversationId: string,
  onProgress?: UploadProgressCallback,
): Promise<UploadResult> {
  validateFile(file, UPLOAD_CONFIG.allowedImageTypes);

  return uploadFile(
    "/messages/upload",
    file,
    { conversationId, type: "image" },
    onProgress,
  );
}

/**
 * Upload a document attachment for a message
 *
 * @param file - The file to upload (from document picker)
 * @param conversationId - The conversation to associate with
 * @param onProgress - Optional progress callback
 * @returns Upload result with URL
 */
export async function uploadMessageDocument(
  file: FileToUpload,
  conversationId: string,
  onProgress?: UploadProgressCallback,
): Promise<UploadResult> {
  validateFile(file, UPLOAD_CONFIG.allowedDocumentTypes);

  return uploadFile(
    "/messages/upload",
    file,
    { conversationId, type: "document" },
    onProgress,
  );
}

/**
 * Upload a profile avatar
 *
 * @param file - The image file to upload
 * @param onProgress - Optional progress callback
 * @returns Upload result with URL
 */
export async function uploadAvatar(
  file: FileToUpload,
  onProgress?: UploadProgressCallback,
): Promise<UploadResult> {
  validateFile(file, UPLOAD_CONFIG.allowedImageTypes);

  return uploadFile("/profile/avatar", file, {}, onProgress);
}

/**
 * Generic file upload function
 */
async function uploadFile(
  endpoint: string,
  file: FileToUpload,
  additionalFields: Record<string, string>,
  onProgress?: UploadProgressCallback,
): Promise<UploadResult> {
  debugLog("Upload", `Starting upload to ${endpoint}`, {
    filename: file.name,
    type: file.type,
  });

  try {
    const formData = new FormData();

    // React Native requires this specific format for file uploads
    const filePayload = {
      uri:
        Platform.OS === "android" ? file.uri : file.uri.replace("file://", ""),
      name: file.name,
      type: file.type,
    };

    // @ts-expect-error - FormData.append accepts this format in React Native
    formData.append("file", filePayload);

    // Add additional fields
    for (const [key, value] of Object.entries(additionalFields)) {
      formData.append(key, value);
    }

    const response = await apiClient.post<{
      success: boolean;
      data: UploadResult;
    }>(endpoint, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: UPLOAD_CONFIG.timeout,
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentage = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          onProgress({
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            percentage,
          });
        }
      },
    });

    debugLog("Upload", "Upload completed", response.data.data);
    return response.data.data;
  } catch (error) {
    errorLog("Upload", error, endpoint);
    throw handleApiError(error);
  }
}

// ============================================================================
// UPLOAD WITH RETRY
// ============================================================================

/**
 * Upload with automatic retry on failure
 *
 * @param uploadFn - The upload function to execute
 * @param maxRetries - Maximum number of retries (default: 3)
 * @param onRetry - Optional callback when retrying
 */
export async function uploadWithRetry<T>(
  uploadFn: () => Promise<T>,
  maxRetries = 3,
  onRetry?: (attempt: number, error: Error) => void,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await uploadFn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry validation errors
      if (error instanceof UploadValidationError) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt < maxRetries) {
        debugLog("Upload", `Attempt ${attempt} failed, retrying...`, {
          error: lastError.message,
        });
        onRetry?.(attempt, lastError);

        // Exponential backoff: 1s, 2s, 4s...
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)),
        );
      }
    }
  }

  throw lastError;
}

// ============================================================================
// UPLOAD QUEUE (for multiple files)
// ============================================================================

export interface QueuedUpload {
  id: string;
  file: FileToUpload;
  conversationId: string;
  status: "pending" | "uploading" | "completed" | "failed";
  progress: number;
  result?: UploadResult;
  error?: string;
}

/**
 * Upload multiple files sequentially
 *
 * @param files - Array of files to upload
 * @param conversationId - The conversation to associate with
 * @param onFileProgress - Callback for individual file progress
 * @param onFileComplete - Callback when a file completes
 * @returns Array of upload results
 */
export async function uploadMultipleFiles(
  files: FileToUpload[],
  conversationId: string,
  onFileProgress?: (fileIndex: number, progress: UploadProgress) => void,
  onFileComplete?: (
    fileIndex: number,
    result: UploadResult | null,
    error?: Error,
  ) => void,
): Promise<(UploadResult | null)[]> {
  const results: (UploadResult | null)[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const isImage = UPLOAD_CONFIG.allowedImageTypes.includes(file.type);

    try {
      const result = isImage
        ? await uploadMessageImage(file, conversationId, (progress) =>
            onFileProgress?.(i, progress),
          )
        : await uploadMessageDocument(file, conversationId, (progress) =>
            onFileProgress?.(i, progress),
          );

      results.push(result);
      onFileComplete?.(i, result);
    } catch (error) {
      results.push(null);
      onFileComplete?.(
        i,
        null,
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  return results;
}

// ============================================================================
// CANCEL UPLOAD (using AbortController)
// ============================================================================

/**
 * Create a cancellable upload
 * Returns an object with the upload promise and a cancel function
 */
export function createCancellableUpload(
  file: FileToUpload,
  conversationId: string,
  onProgress?: UploadProgressCallback,
): {
  promise: Promise<UploadResult>;
  cancel: () => void;
} {
  const controller = new AbortController();

  const promise = (async () => {
    const isImage = UPLOAD_CONFIG.allowedImageTypes.includes(file.type);

    const formData = new FormData();
    const filePayload = {
      uri:
        Platform.OS === "android" ? file.uri : file.uri.replace("file://", ""),
      name: file.name,
      type: file.type,
    };

    // @ts-expect-error - FormData.append accepts this format in React Native
    formData.append("file", filePayload);
    formData.append("conversationId", conversationId);
    formData.append("type", isImage ? "image" : "document");

    const response = await apiClient.post<{
      success: boolean;
      data: UploadResult;
    }>("/messages/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: UPLOAD_CONFIG.timeout,
      signal: controller.signal,
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          onProgress({
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            percentage: Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            ),
          });
        }
      },
    });

    return response.data.data;
  })();

  return {
    promise,
    cancel: () => controller.abort(),
  };
}
