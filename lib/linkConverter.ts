export function convertGoogleDriveUrl(url: string): string | null {
  const match = url.match(/file\/d\/([^\/]+)\//);
  if (match && match[1]) {
    const fileId = match[1];
    const newURL = `https://drive.google.com/uc?export=download&id=${fileId}`
    return newURL;
  }
  return null;
}