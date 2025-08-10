"use client";

// Firebase helper functions for uploading and deleting images.
//
// This module encapsulates initialization of the Firebase app and exposes
// utility functions for interacting with Cloud Storage.  We use
// environment variables (NEXT_PUBLIC_FIREBASE_*) to configure the
// connection.  These must be provided in your Next.js environment
// configuration.  See the project README for more details.

import { initializeApp } from "firebase/app";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { v4 as uuidv4 } from "uuid";

// Firebase configuration using environment variables.  These need to be
// defined in your .env.local or similar and prefixed with NEXT_PUBLIC so
// that they are available in the browser.  See Firebase console for
// values.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialise Firebase app lazily.  Next.js may reload modules multiple
// times in development, so we check for an existing instance before
// initialising.  The firebase/app library stores the apps internally and
// will return the existing instance if it has already been created.
const app = initializeApp(firebaseConfig);

// Get a reference to the storage service which we will use to upload and
// delete images.  We prefix all hotel room images with `rooms/` so they
// are grouped together in the bucket.
const storage = getStorage(app);

/**
 * Upload a single file to Firebase storage.  A unique filename is
 * generated using uuid to avoid collisions.  Returns the publicly
 * accessible download URL of the uploaded file.
 *
 * @param file The File object selected from an `<input type="file">`
 */
/**
 * Upload a single file to Firebase storage.  A unique filename is
 * generated using uuid to avoid collisions.  The file is stored in
 * the provided folder path under the bucket.  If no folder is
 * specified, files are uploaded to the `rooms/` folder for
 * backwards compatibility.  Returns the publicly accessible
 * download URL of the uploaded file.
 *
 * @param file   The File object selected from an `<input type="file">`.
 * @param folder Optional storage folder prefix (e.g. "services").
 */
export async function uploadImage(file: File, folder: string = "rooms"): Promise<string> {
  const filename = `${uuidv4()}-${file.name}`;
  // Prefix the filename with the folder to organise uploads.  For
  // example, uploading to the "services" folder will result in a
  // storage path like "services/<uuid>-<filename>".
  const storagePath = `${folder}/${filename}`;
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return url;
}

/**
 * Delete an image from Firebase storage given its public URL.  The
 * storage path is extracted from the URL.  If deletion fails the
 * promise will reject.
 *
 * @param url The public download URL previously returned by uploadImage
 */
export async function deleteImage(url: string): Promise<void> {
  try {
    // Extract the path after the storage bucket domain.  Firebase URLs
    // are of the form https://firebasestorage.googleapis.com/v0/b/<bucket>/o/<encoded_path>?...
    const parts = url.split("/o/");
    if (parts.length < 2) throw new Error("Invalid URL");
    const encodedPath = parts[1].split("?")[0];
    const filePath = decodeURIComponent(encodedPath);
    const storageRef = ref(storage, filePath);
    await deleteObject(storageRef);
  } catch (err) {
    console.error("Failed to delete image from Firebase", err);
    throw err;
  }
}