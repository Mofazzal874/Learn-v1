import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Github from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import connectDB from "./lib/db";
import { User } from "./models/User";
import { compare } from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Github({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),

    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),

    Credentials({
      name: "Credentials",

      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },

      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        const role = credentials?.role as string | undefined;

        if (!email || !password) {
          throw new Error("Please provide both email and password");
        }

        await connectDB();

        const user = await User.findOne({ email }).select("+password +role");

        if (!user) {
          throw new Error(`No account found with this email${role ? ` as a ${role}` : ''}`);
        }

        if (!user.password) {
          throw new Error("Invalid email or password");
        }

        const isMatched = await compare(password, user.password);

        if (!isMatched) {
          throw new Error("Password did not match");
        }

        // Verify role matches if provided during login
        if (role && user.role !== role) {
          throw new Error(`This account is registered as a ${user.role}. Please use the correct login option.`);
        }

        const userData = {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          id: user._id,
        };

        return userData;
      },
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

    async jwt({ token, user, account }) {
      // On initial sign in, user object is available
      if (user) {
        token.role = user.role as string;
      }
      
      // For OAuth providers, we need to fetch user from database to get correct info
      if (account && (account.provider === "google" || account.provider === "github")) {
        try {
          await connectDB();
          const dbUser = await User.findOne({ email: user.email });
          if (dbUser) {
            token.sub = dbUser._id.toString();
            token.role = dbUser.role;
            token.email = dbUser.email;
          }
        } catch (error) {
          console.error('Error fetching user in JWT callback:', error);
        }
      }
      
      // For subsequent requests without user object, keep existing token data
      return token;
    },

    signIn: async ({ user, account }) => {
      if (account?.provider === "google") {
        try {
          const { email, name, image, id } = user;
          await connectDB();
          const alreadyUser = await User.findOne({ email });
    
          if (!alreadyUser) {
            // Get the intended role from cookies or default to 'user'
            const { cookies } = await import('next/headers');
            const cookieStore = cookies();
            const selectedRole = cookieStore.get('selected-role')?.value || 'user';
            
            const [firstName = "", lastName = ""] = (name || "").split(" ");
            await User.create({ 
              email, 
              firstName, 
              lastName,
              name, 
              image, 
              authProviderId: id,
              role: selectedRole === 'tutor' ? 'tutor' : 'user'
            });
          }
          return true;
        } catch (error) {
          console.error("Error while creating Google user:", error);
          throw new Error("Error while creating user");
        }
      }
    
      if (account?.provider === "github") {
        try {
          const { email, name, image, id } = user;
          await connectDB();
          const alreadyUser = await User.findOne({ email });
    
          if (!alreadyUser) {
            // Get the intended role from cookies or default to 'user'
            const { cookies } = await import('next/headers');
            const cookieStore = cookies();
            const selectedRole = cookieStore.get('selected-role')?.value || 'user';
            
            const [firstName = "", lastName = ""] = (name || "").split(" ");
            await User.create({ 
              email, 
              firstName, 
              lastName,
              name, 
              image, 
              authProviderId: id,
              role: selectedRole === 'tutor' ? 'tutor' : 'user'
            });
          }
          return true;
        } catch (error) {
          console.error("Error while creating GitHub user:", error);
          throw new Error("Error while creating user");
        }
      }
    
      if (account?.provider === "credentials") {
        return true;
      }
    
      return false;
    }
  },
});