// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { requireUser } from '../../../utils/api-auth';
import { sanityWriter } from '../../../utils/sanity-server';
import { nanoid } from 'nanoid';

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

    const user = await client.getDocument(userId);
    if (user?._type !== 'user') return res.status(404).end();
    const followers = creator.follower as { _ref: string }[] | undefined;
    const following = user.following as { _ref: string }[] | undefined;
    const transaction = client.transaction();

    if (!followers?.some(({ _ref }) => _ref === userId)) {
      transaction.patch(creatorId, (patch) =>
        patch
          .ifRevisionId(creator._rev)
          .setIfMissing({ follower: [] })
          .append('follower', [{ _key: nanoid(), _ref: userId, _type: 'postedBy' }]),
      );
    }
    if (!following?.some(({ _ref }) => _ref === creatorId)) {
      transaction.patch(userId, (patch) =>
        patch
          .ifRevisionId(user._rev)
          .setIfMissing({ following: [] })
          .append('following', [{ _key: nanoid(), _ref: creatorId, _type: 'postedBy' }]),
      );
    }
    if (transaction.serialize().length) await transaction.commit();

    const data = await client.getDocuments([creatorId, userId]);
    res.status(200).json(data);
  }
}
