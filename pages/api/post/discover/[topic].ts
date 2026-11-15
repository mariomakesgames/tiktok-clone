// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { topicPostsQuery } from '../../../../utils/queries';
import { Video } from '../../../../types';
import { client } from '../../../../utils/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Video[]>,
) {
  if (req.method === 'GET') {
    const currentUserId = (req.query.currentUserId as string) || '';

    const { topic } = req.query;
    if (typeof topic !== 'string') return res.status(400).end();
    const data = await client.fetch<Video[]>(topicPostsQuery, {
      topic,
      currentUserId,
    });
    res.status(200).json(data);
  }
}
