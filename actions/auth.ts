'use server';

import { signIn } from "@/auth";
import { db } from "@/lib/db";
import { hash } from "bcryptjs";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  try {
    await signIn('credentials', { 
      email, 
      password,
      redirect: false
    });
    redirect('/dashboard');
  } catch (error) {
    return { error: 'Invalid email or password' };
  }
}

export async function register(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const firstname = formData.get('firstname') as string;
  const lastname = formData.get('lastname') as string;
  
  try {
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return { error: 'User already exists' };
    }

    // Hash the password
    const hashedPassword = await hash(password, 12);

    // Create the user
    await db.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: firstname,
        lastName: lastname,
      }
    });

    // Sign in the user
    await signIn('credentials', {
      email,
      password,
      redirect: false
    });

    redirect('/dashboard');
  } catch (error) {
    console.error('Registration error:', error);
    return { error: 'Something went wrong during registration' };
  }
}

export async function handleSocialLogin(provider: 'google' | 'github') {
  try {
    await signIn(provider, { redirect: false });
    redirect('/dashboard');
  } catch (error) {
    return { error: `Failed to sign in with ${provider}` };
  }
} 