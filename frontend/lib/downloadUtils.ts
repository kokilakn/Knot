import JSZip from 'jszip';

/**
 * Downloads one or more photos.
 * If there's only one photo, it's downloaded directly as a file.
 * If there are multiple photos, they are bundled into a ZIP file.
 * 
 * @param photos Array of photo links/URLs to download
 */
export async function downloadPhotos(photos: string[], zipFilename: string = "knot-photos.zip") {
    if (photos.length === 0) return;

    if (photos.length === 1) {
        // Single photo download
        try {
            const response = await fetch(photos[0]);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = photos[0].split('/').pop() || 'photo.jpg';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to download photo');
        }
    } else {
        // Multiple photos - Bundle into ZIP
        try {
            const zip = new JSZip();
            const folder = zip.folder("knot-photos");

            const downloadPromises = photos.map(async (url) => {
                const response = await fetch(url);
                const blob = await response.blob();
                const fileName = url.split('/').pop() || `photo_${Date.now()}.jpg`;
                folder?.file(fileName, blob);
            });

            await Promise.all(downloadPromises);

            const content = await zip.generateAsync({ type: "blob" });
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = zipFilename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('ZIP download failed:', error);
            alert('Failed to bundle and download photos');
        }
    }
}
