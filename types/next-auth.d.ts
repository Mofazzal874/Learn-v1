import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    firstName?: string;
    lastName?: string;
    role?: string;
  }
  
  interface Session {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
    };
  }

  interface JWT {
    role?: string;
    firstName?: string;
    lastName?: string;
  }
} 