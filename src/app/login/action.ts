// src/app/auth/action.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  // return the error so the login page can show it inline
  if (error) {
    return {
      error:
        error.code === "invalid_credentials"
          ? "Email hoặc mật khẩu không đúng."
          : "Đăng nhập không thành công, vui lòng thử lại.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signUp(data);

  if (error) {
    redirect("/error");
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function loginWithGoogle() {
  const supabase = await createClient();

  const { error, data } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  // this won't run because signInWithOAuth does a redirect client-side
  // but still useful for error logging or fallback behavior
  if (error) {
    console.error("OAuth login failed", error.message);
    redirect("/error");
  }

  if (data.url) {
    redirect(data.url); // use the redirect API for your server framework
  }

  return data;
}
