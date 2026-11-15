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

    const { creatorId } = req.body ?? {};
    if (typeof creatorId !== 'string' || creatorId === userId) {
      return res.status(400).end();
    }

    const client = sanityWriter();
    const creator = await client.getDocument(creatorId);
    if (creator?._type !== 'user') {
      return res.status(404).json({ message: 'User not found.' });
    }

    await client.transaction()
      .patch(creatorId, (patch) =>
        patch.unset([`follower[_ref==${JSON.stringify(userId)}]`]),
      )
      .patch(userId, (patch) =>
        patch.unset([`following[_ref==${JSON.stringify(creatorId)}]`]),
      )
      .commit();

    const data = await client.getDocuments([creatorId, userId]);
    res.status(200).json(data);
  }
}
