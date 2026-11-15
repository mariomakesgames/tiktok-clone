// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { requireUser } from '../../../../utils/api-auth';
import { sanityWriter } from '../../../../utils/sanity-server';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === 'DELETE') {
    const userId = await requireUser(req, res);
    if (!userId) return;
    if (typeof req.query.id !== 'string') return res.status(400).end();
    const [postId, commentKey] = req.query.id.split(',');
    if (!postId || !commentKey) return res.status(400).end();

    const client = sanityWriter();
    const post = await client.getDocument<{
      comments?: { _key: string; postedBy?: { _ref: string } }[];
    }>(postId);
    if (post?._type !== 'post') return res.status(404).end();
    const comment = post.comments?.find(({ _key }) => _key === commentKey);
    if (!comment) return res.status(404).end();
    if (comment.postedBy?._ref !== userId) return res.status(403).end();

    const data = await client
      .patch(postId)
      .unset([`comments[_key==${JSON.stringify(commentKey)}]`])
      .commit();

    res.status(200).json(data);
  }
}
