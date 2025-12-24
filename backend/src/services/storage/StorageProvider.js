/**
 * Base Storage Provider Interface
 * All storage providers should extend this class and implement the methods.
 */
class StorageProvider {
    /**
     * Retrieves a file as a buffer
     * @param {string} urlOrPath - The full URL or path to the file
     * @returns {Promise<Buffer>}
     */
    async getFile(urlOrPath) {
        throw new Error('Method not implemented');
    }

    /**
     * Helper to determine if this provider handles a specific URL/Path
     * @param {string} urlOrPath 
     * @returns {boolean}
     */
    canHandle(urlOrPath) {
        return true;
    }

    /**
     * Uploads a file to the storage provider
     * @param {Buffer} file - The file content
     * @param {string} path - The target path/key
     * @param {string} contentType - The MIME type
     * @returns {Promise<string>} - The URL or key
     */
    async upload(file, path, contentType) {
        throw new Error('Method not implemented');
    }

    /**
     * Deletes a file from the storage provider
     * @param {string} pathOrUrl - The path or full URL
     */
    async delete(pathOrUrl) {
        throw new Error('Method not implemented');
    }
}

export default StorageProvider;
