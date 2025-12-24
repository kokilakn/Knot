export interface StorageProvider {
    /**
     * Uploads a file to the storage provider.
     * @param file The file content as a Buffer.
     * @param path The destination path/key (e.g., "events/123/photo.jpg").
     * @param contentType The MIME type of the file.
     * @returns The public URL of the uploaded file.
     */
    upload(file: Buffer, path: string, contentType: string): Promise<string>;

    /**
     * Deletes a file from the storage provider.
     * @param path or url The path or full URL of the file to delete.
     */
    delete(pathOrUrl: string): Promise<void>;
}
