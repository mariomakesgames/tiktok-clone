// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { requireUser } from '../../../../utils/api-auth';
import { sanityWriter } from '../../../../utils/sanity-server';
import { nanoid } from 'nanoid';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === 'PUT') {
    const userId = await requireUser(req, res);
    if (!userId) return;

    const { postId, comment } = req.body ?? {};
    const client = sanityWriter();
    if (typeof postId !== 'string' ||
        (await client.getDocument(postId))?._type !== 'post') {
      return res.status(404).json({ message: 'Post not found.' });
    }
    if (typeof comment !== 'string' || !comment.trim()) return res.status(400).end();

    const data = await client
      .patch(postId)
      .setIfMissing({ comments: [] })
      .insert('after', 'comments[-1]', [
        {
          _key: nanoid(),
          comment,
          _type: 'comment',
          postedBy: { _ref: userId, _type: 'postedBy' },
        },
      ])
      .commit();

    res.status(200).json(data);
  }
}
