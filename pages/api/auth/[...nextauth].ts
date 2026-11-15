import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { sanityWriter } from '../../../utils/sanity-server';

export const AUTH_OPTIONS = {
  // Configure one or more authentication providers
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, account }) {
      if (account && token.sub) {
        await sanityWriter().createIfNotExists({
          _id: token.sub,
          _type: 'user',
          userName: token.name,
          image: token.picture,
        });
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        _id: token.sub!,
        _type: 'user',
        userName: token.name!,
        image: token.picture!,
      };
    },
  },
} satisfies NextAuthOptions;

export default NextAuth(AUTH_OPTIONS);
