"use server";

import { signIn, signOut } from "@/auth";
import connectDB from "@/lib/db";
import { User } from "@/models/User";
import { hash } from "bcryptjs";
import { redirect } from "next/navigation";

const login = async (formData: FormData): Promise<{ error: string } | void> => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as string;

  try {
    await connectDB();
    const user = await User.findOne({ email });
    
    // First check if user exists with this role
    if (user && user.role !== role) {
      return { error: `The email is registered as ${user.role}.Please select the correct role` };
    }

    try {
      const result = await signIn("credentials", {
        redirect: false,
        callbackUrl: "/",
        email,
        password,
        role,
      });

    } catch (signInError) {
      // Handle authentication errors
      return { error: "Email or password not correct. Please check again" };
    }
  } catch (error) {
    // System/server error
    return { error: "Authentication failed. Please try again later." };
  }
};

const register = async (formData: FormData) => {
  const firstName = formData.get("firstname") as string;
  const lastName = formData.get("lastname") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as string;

  if (!firstName || !lastName || !email || !password || !role) {
    throw new Error("Please fill all required fields");
  }

  await connectDB();

  // Check for existing user with same email
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error(`An account with this email already exists${existingUser.role ? ` as a ${existingUser.role}` : ''}`);
  }

  const hashedPassword = await hash(password, 12);

  // Create user with role
  await User.create({ 
    firstName, 
    lastName, 
    email, 
    password: hashedPassword,
    role 
  });

  // Sign in the user after registration
  await signIn('credentials', {
    email,
    password,
    role,
    redirect: false
  });

  redirect(role === 'tutor' ? "/tutor/dashboard" : "/private/dashboard");
};

export async function handleSignOut() {
  await signOut({ redirectTo: "/login" });
}

export { register, login };