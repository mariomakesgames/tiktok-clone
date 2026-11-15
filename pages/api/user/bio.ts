// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { requireUser } from '../../../utils/api-auth';
import { sanityWriter } from '../../../utils/sanity-server';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === 'PUT') {
    const userId = await requireUser(req, res);
    if (!userId) return;

    const { bio } = req.body ?? {};
    const client = sanityWriter();
    if (typeof bio !== 'string') return res.status(400).end();

    const data = await client
      .patch(userId)
      .setIfMissing({ bio: '' })
      .set({ bio })
      .commit();

    res.status(200).json(data);
  }
}
