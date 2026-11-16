// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { getAllPostsByLimit } from '../../../utils/queries';
import { client } from '../../../utils/client';
import { Video } from '../../../types';
import { BlobNotFoundError, head } from '@vercel/blob';
import { requireUser } from '../../../utils/api-auth';
import { sanityWriter } from '../../../utils/sanity-server';
import { getPublishedTopics } from '../../../utils/published-topics';
import {
  isOwnedVideoPath,
  MAX_VIDEO_BYTES,
  VIDEO_CONTENT_TYPES,
} from '../../../utils/video-upload';

type Data = {
  data?: Video[];
  message?: string;
  id?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>,
) {
  if (req.method === 'GET') {
    const currentUserIdId = (req.query.currentUserId as string) || '';
    const query = getAllPostsByLimit(currentUserIdId);
    const data = await client.fetch(query);

    res.status(200).json(data);
  } else if (req.method === 'POST') {
    const userId = await requireUser(req, res);
    if (!userId) return;
    const { caption, topic, pathname } = req.body ?? {};
    if (
      typeof caption !== 'string' || !caption.trim() ||
      typeof topic !== 'string' ||
      typeof pathname !== 'string' || !isOwnedVideoPath(pathname, userId)
    ) {
      return res.status(400).json({ message: 'Invalid video or caption.' });
    }

    if (topic && !(await getPublishedTopics()).includes(topic)) {
      return res.status(409).json({ message: 'This topic is no longer available.' });
    }

    const blob = await head(pathname).catch((error: unknown) => {
      if (error instanceof BlobNotFoundError) return null;
      throw error;
    });
    if (!blob || !VIDEO_CONTENT_TYPES.includes(blob.contentType) ||
        blob.size < 1 || blob.size > MAX_VIDEO_BYTES) {
      return res.status(400).json({ message: 'Invalid video upload.' });
    }

    const post = await sanityWriter().createIfNotExists({
      _id: `post-${userId}-${pathname.split('/').pop()?.split('.')[0]}`,
      _type: 'post',
      caption: caption.trim(),
      topic,
      userId,
      postedBy: { _type: 'postedBy', _ref: userId },
      videoUrl: blob.url,
    });

    res.status(201).json({ id: post._id, message: 'Posted successfully' });
  }
}
