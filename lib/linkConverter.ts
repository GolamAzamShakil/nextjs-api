export function convertGoogleDriveUrl(url: string): string | null {
  const match = url.match(/file\/d\/([^\/]+)\//);
  if (match && match[1]) {
    const fileId = match[1];
    //const newDownloadURL = `https://drive.google.com/uc?export=download&id=${fileId}`
    const newDirectURL = `https://drive.google.com/thumbnail?id=${fileId}`
    return newDirectURL;
  }
  return null;
}