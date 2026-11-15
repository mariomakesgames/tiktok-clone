import { client } from './client';

export function sanityWriter() {
  const token = process.env.SANITY_API_TOKEN;
  if (!token) throw new Error('SANITY_API_TOKEN is missing');
  return client.withConfig({ token });
}
