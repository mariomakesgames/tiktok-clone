import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

export async function requireUser(req: NextApiRequest, res: NextApiResponse) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error('NEXTAUTH_SECRET is missing');

  const token = await getToken({ req, secret });
  if (!token?.sub) {
    res.status(401).json({ message: 'Sign in to continue.' });
    return;
  }
  return token.sub;
}
