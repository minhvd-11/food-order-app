// app/login/page.tsx
"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { CircleAlert, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from "@/components/ui";
import { PageBackground } from "@/components/PageLayout";
import { login, loginWithGoogle } from "./action";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[18px]">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09A6.6 6.6 0 0 1 5.49 12c0-.73.13-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.56 10.56 0 0 0 12 1 11 11 0 0 0 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEmailPending, startEmailTransition] = useTransition();
  const [isGooglePending, startGoogleTransition] = useTransition();
  const isPending = isEmailPending || isGooglePending;

  const handleEmailLogin = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError(null);

    startEmailTransition(async () => {
      const result = await login(form); // redirects on success
      if (result?.error) setError(result.error);
    });
  };

  const handleGoogleLogin = () => {
    setError(null);
    startGoogleTransition(async () => {
      await loginWithGoogle(); // redirects to Google
    });
  };

  return (
    <main className="relative flex min-h-[calc(100dvh-65px)] items-center justify-center px-4 py-12 text-gray-900 selection:bg-red-200 dark:text-gray-100 dark:selection:bg-red-900">
      <PageBackground />

      <Card className="relative w-full max-w-sm gap-6 border-red-100 py-8 shadow-xl shadow-red-900/5 dark:border-neutral-800 dark:shadow-black/40">
        <CardHeader className="justify-items-center text-center">
          <div className="mb-3 flex size-20 items-center justify-center rounded-full bg-[#FFFBF0] shadow-inner ring-1 ring-red-100 dark:ring-red-900/50">
            <Image
              src="/logo/DL_logo_full.svg"
              alt="Daily Lunch"
              width={56}
              height={56}
              priority
            />
          </div>
          <CardTitle className="bg-gradient-to-r from-red-700 to-red-500 bg-clip-text text-2xl leading-tight font-bold text-transparent">
            Teko Daily Lunch
          </CardTitle>
          <CardDescription>Đăng nhập để đặt cơm trưa hôm nay</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleGoogleLogin}
            disabled={isPending}
            className="h-11 w-full border-input"
          >
            {isGooglePending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            {isGooglePending ? "Đang chuyển hướng..." : "Tiếp tục với Google"}
          </Button>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            hoặc dùng email
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="ten.ho@teko.vn"
                  required
                  disabled={isPending}
                  aria-invalid={!!error}
                  className="h-11 pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  required
                  disabled={isPending}
                  aria-invalid={!!error}
                  className="h-11 px-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  className="absolute top-1/2 right-1 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
              >
                <CircleAlert className="mt-0.5 size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              disabled={isPending}
              className="h-11 w-full"
            >
              {isEmailPending && <Loader2 className="animate-spin" />}
              {isEmailPending ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
