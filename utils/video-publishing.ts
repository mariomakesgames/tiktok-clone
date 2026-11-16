import { upload } from '@vercel/blob/client';
import axios from 'axios';
import { nanoid } from 'nanoid';
import {
  MAX_VIDEO_BYTES,
  MAX_VIDEO_MB,
  VIDEO_CONTENT_TYPES,
} from './video-upload';

export function videoFileError(file: File) {
  if (!VIDEO_CONTENT_TYPES.includes(file.type)) {
    return 'Choose an MP4 or WebM video.';
  }
  if (!file.size || file.size > MAX_VIDEO_BYTES) {
    return `Video must be between 1 byte and ${MAX_VIDEO_MB} MB.`;
  }
}

export function uploadVideo(
  file: File,
  userId: string,
  onProgress?: (percentage: number) => void,
) {
  const extension = file.type === 'video/mp4' ? 'mp4' : 'webm';
  return upload(`videos/${userId}/${nanoid()}.${extension}`, file, {
    access: 'public',
    contentType: file.type,
    handleUploadUrl: '/api/post/upload',
    onUploadProgress:
      onProgress && (({ percentage }) => onProgress(percentage)),
  });
}

export async function publishVideo(
  pathname: string,
  caption: string,
  topic: string,
) {
  const { data } = await axios.post<{ id: string }>('/api/post', {
    caption,
    pathname,
    topic,
  });
  return data.id;
}

export function videoPublishError(error: unknown) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) return 'Sign in again, then retry.';
    if (error.response?.status === 409) {
      return 'This topic is no longer available. Choose another topic.';
    }
  }
  return 'Could not publish the video. Try again.';
}
