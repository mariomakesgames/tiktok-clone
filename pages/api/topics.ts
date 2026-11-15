import type { NextApiRequest, NextApiResponse } from 'next';
import { getPublishedTopics } from '../../utils/published-topics';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }
  res.status(200).json(await getPublishedTopics());
}
