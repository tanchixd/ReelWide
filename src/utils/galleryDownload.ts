/**
 * Utility for downloading video files and saving them directly to device gallery / camera roll
 */
export async function saveVideoToGallery(
  streamOrDownloadUrl: string,
  fileName: string = 'facebook_video.mp4',
  onProgress?: (status: string) => void
): Promise<{ success: boolean; method: 'web-share' | 'browser-download'; message?: string }> {
  try {
    onProgress?.('Preparing video file for download...');

    // Fetch the video data as a Blob
    const response = await fetch(streamOrDownloadUrl);
    if (!response.ok) {
      throw new Error(`Failed to download video file (${response.status})`);
    }

    const blob = await response.blob();
    const cleanFileName = fileName.endsWith('.mp4') ? fileName : `${fileName}.mp4`;
    const file = new File([blob], cleanFileName, { type: 'video/mp4' });

    // 1. Try Mobile Web Share API (Saves directly to iOS Camera Roll / Android Photos Gallery)
    if (
      typeof navigator !== 'undefined' &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      onProgress?.('Opening device share sheet (select "Save Video" to save to gallery)...');
      await navigator.share({
        files: [file],
        title: 'Save Facebook Video to Gallery',
        text: 'Save video directly to your photos gallery',
      });
      return {
        success: true,
        method: 'web-share',
        message: 'Shared successfully! If prompted, select "Save Video" to keep in your gallery.',
      };
    }
  } catch (err: any) {
    // If user cancelled share sheet or share failed, fallback to direct browser anchor download
    if (err.name === 'AbortError') {
      return { success: true, method: 'web-share', message: 'Share sheet dismissed.' };
    }
  }

  // 2. Fallback: Native Browser Download Anchor (Saves to Downloads / Media Gallery)
  try {
    const link = document.createElement('a');
    link.href = streamOrDownloadUrl;
    link.setAttribute('download', fileName.endsWith('.mp4') ? fileName : `${fileName}.mp4`);
    link.setAttribute('target', '_blank');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return {
      success: true,
      method: 'browser-download',
      message: 'Video saved to your device Downloads / Media Gallery!',
    };
  } catch {
    // As last resort, open url directly in new window
    window.open(streamOrDownloadUrl, '_blank');
    return {
      success: true,
      method: 'browser-download',
      message: 'Video opened for saving.',
    };
  }
}
