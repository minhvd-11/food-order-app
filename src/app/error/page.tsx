"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ErrorPage() {
  const router = useRouter();

  useEffect(() => {
    // Optional auto-redirect after a few seconds
    const timeout = setTimeout(() => {
      router.push("/");
    }, 3000);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="text-center mt-10">
      <h1 className="text-xl font-semibold text-red-600">
        Sorry, something went wrong.
      </h1>
      <p className="text-sm text-gray-500">Redirecting to home...</p>
    </div>
  );
}
