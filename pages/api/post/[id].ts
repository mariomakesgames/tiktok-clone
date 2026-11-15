// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { postDetailQuery } from '../../../utils/queries';
import { client } from '../../../utils/client';
import { requireUser } from '../../../utils/api-auth';
import { sanityWriter } from '../../../utils/sanity-server';

type Data = {
  message: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>,
) {
  if (req.method === 'GET') {
    const videoId = req.query.id!;
    const currentUserId = (req.query.currentUserId as string) || '';

    const query = postDetailQuery(videoId, currentUserId);

    const data = await client.fetch(query);

    res.status(200).json(data[0]);
  } else if (req.method === 'DELETE') {
    const userId = await requireUser(req, res);
    if (!userId) return;

    const { id } = req.query;
    if (typeof id !== 'string') return res.status(400).end();
    const writer = sanityWriter();
    const post = await writer.getDocument(id);
    if (post?._type !== 'post') return res.status(404).end();
    if ((post.postedBy as { _ref?: string })?._ref !== userId) {
      return res.status(403).end();
    }

    await writer.delete(id);

    res.status(200).json({ message: 'Successfully deleted!' });
  }
}
