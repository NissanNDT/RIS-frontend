import { supabase } from "../config/supabaseClient";

const BUCKET_NAME = "finding-images";

/**
 * Uploads an image file to Supabase Storage.
 * @param {File} file The file object to upload.
 * @param {string} path The destination path inside the bucket (e.g. finding-15/finding-1749393993.jpg).
 * @returns {Promise<string>} The path of the uploaded file inside the bucket.
 */
export const uploadImage = async (file, path) => {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true, // Allow replacing
      });

    if (error) {
      throw error;
    }
    return data.path;
  } catch (error) {
    console.error("Error in uploadImage:", error);
    throw error;
  }
};

/**
 * Deletes an image from Supabase Storage.
 * @param {string} path The file path inside the bucket.
 * @returns {Promise<boolean>} True if deleted successfully.
 */
export const deleteImage = async (path) => {
  if (!path) return false;
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) {
      throw error;
    }
    return true;
  } catch (error) {
    console.error("Error in deleteImage:", error);
    return false;
  }
};

/**
 * Generates a signed URL for viewing a private image.
 * @param {string} path The file path inside the bucket.
 * @param {number} expiresIn Time in seconds until the URL expires (default 1 hour).
 * @returns {Promise<string>} The signed URL.
 */
export const getSignedImageUrl = async (path, expiresIn = 3600) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(path, expiresIn);

    if (error) {
      throw error;
    }
    return data.signedUrl;
  } catch (error) {
    // Silently handle missing or invalid paths without cluttering the console
    return "";
  }
};

const INCIDENT_BUCKET_NAME = "incident-images";

/**
 * Uploads an incident image file to Supabase Storage.
 * @param {File} file The file object to upload.
 * @param {string} path The destination path inside the bucket (e.g. incident-format-15/incident-1749393993.jpg).
 * @returns {Promise<string>} The path of the uploaded file inside the bucket.
 */
export const uploadIncidentImage = async (file, path) => {
  try {
    const { data, error } = await supabase.storage
      .from(INCIDENT_BUCKET_NAME)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      throw error;
    }
    return data.path;
  } catch (error) {
    console.error("Error in uploadIncidentImage:", error);
    throw error;
  }
};

/**
 * Deletes an incident image from Supabase Storage.
 * @param {string} path The file path inside the bucket.
 * @returns {Promise<boolean>} True if deleted successfully.
 */
export const deleteIncidentImage = async (path) => {
  if (!path) return false;
  try {
    const { data, error } = await supabase.storage
      .from(INCIDENT_BUCKET_NAME)
      .remove([path]);

    if (error) {
      throw error;
    }
    return true;
  } catch (error) {
    console.error("Error in deleteIncidentImage:", error);
    return false;
  }
};

/**
 * Generates a signed URL for viewing a private incident image.
 * @param {string} path The file path inside the bucket.
 * @param {number} expiresIn Time in seconds until the URL expires (default 1 hour).
 * @returns {Promise<string>} The signed URL.
 */
export const getSignedIncidentImageUrl = async (path, expiresIn = 3600) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  try {
    const { data, error } = await supabase.storage
      .from(INCIDENT_BUCKET_NAME)
      .createSignedUrl(path, expiresIn);

    if (error) {
      throw error;
    }
    return data.signedUrl;
  } catch (error) {
    return "";
  }
};

