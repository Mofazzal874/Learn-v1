"use server";

import { signIn } from "@/auth";

export async function githubSignIn() {
  await signIn("github", { 
    redirectTo: "/private/dashboard",
    redirect: true
  });
}

export async function googleSignIn() {
  await signIn("google", { 
    redirectTo: "/private/dashboard",
    redirect: true
  });
} 