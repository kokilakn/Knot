import { R2StorageProvider } from "./providers/r2";
import { StorageProvider } from "./types";

// Factory function to get the storage provider
// Currently defaults to R2, but could switch based on env vars
function getStorageProvider(): StorageProvider {
    return new R2StorageProvider();
}

export const storage = getStorageProvider();
