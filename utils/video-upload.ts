export const VIDEO_CONTENT_TYPES = ['video/mp4', 'video/webm'];
export const MAX_VIDEO_BYTES = 10 * 1024 * 1024;

export function isOwnedVideoPath(pathname: string, userId: string) {
  const prefix = `videos/${userId}/`;
  return pathname.startsWith(prefix) &&
    /^[a-zA-Z0-9_-]{21}\.(mp4|webm)$/.test(pathname.slice(prefix.length));
}
