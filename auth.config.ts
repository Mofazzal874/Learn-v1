import { NextAuthConfig } from "next-auth";
import Github from "next-auth/providers/github";
import Google from "next-auth/providers/google";

export const authConfig = {
  providers: [
    Github({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),

    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],

  pages: {
    signIn: "/login",
    error: "auth/error",
  },

  callbacks: {
    async session({ session, token }) {
      if (token?.sub && token?.role) {
        session.user = {
          ...session.user,
          id: token.sub,
          role: token.role as string
        };
      }
      return session;
    },

    async jwt({ token, user }) {
      // On initial sign in, user object is available
      if (user) {
        token.role = user.role as string;
      }
      
      // For subsequent requests without user object, keep existing token data
      return token;
    },
  },
} satisfies NextAuthConfig;
