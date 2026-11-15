import type { NextApiRequest, NextApiResponse } from 'next';
import { handleUpload } from '@vercel/blob/client';
import { requireUser } from '../../../utils/api-auth';
import {
  isOwnedVideoPath,
  MAX_VIDEO_BYTES,
  VIDEO_CONTENT_TYPES,
} from '../../../utils/video-upload';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }

  const body = req.body as Parameters<typeof handleUpload>[0]['body'];
  if (body?.type !== 'blob.generate-client-token') return res.status(400).end();

  const userId = await requireUser(req, res);
  if (!userId) return;
  const pathname = body.payload?.pathname;
  if (typeof pathname !== 'string' || !isOwnedVideoPath(pathname, userId)) {
    return res.status(403).end();
  }

  try {
    const response = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: VIDEO_CONTENT_TYPES,
        maximumSizeInBytes: MAX_VIDEO_BYTES,
        validUntil: Date.now() + 10 * 60 * 1000,
      }),
    });
    return res.status(200).json(response);
  } catch (error) {
    console.error('Could not authorize video upload', error);
    return res.status(500).json({ message: 'Could not start video upload.' });
  }
}
