// app/login/page.tsx
"use client";

import { useState, useTransition } from "react";
import { login, loginWithGoogle } from "./action";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleEmailLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData();
    form.append("email", email);
    form.append("password", password);

    startTransition(() => {
      login(form); // this is server action, will redirect on success
    });
  };

  const handleGoogleLogin = async () => {
    startTransition(() => {
      loginWithGoogle(); // also redirects
    });
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded shadow">
      <h1 className="text-2xl font-bold mb-6">Đăng nhập</h1>

      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div>
          <label>Email</label>
          <input
            className="w-full border px-3 py-2 rounded"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label>Mật khẩu</label>
          <input
            className="w-full border px-3 py-2 rounded"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded"
          disabled={isPending}
        >
          {isPending ? "Đang đăng nhập..." : "Đăng nhập bằng Email"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="mb-2">hoặc</p>
        <button
          onClick={handleGoogleLogin}
          className="w-full bg-red-500 text-white py-2 rounded"
          disabled={isPending}
        >
          {isPending ? "Đang chuyển hướng..." : "Đăng nhập với Google"}
        </button>
      </div>
    </div>
  );
}
