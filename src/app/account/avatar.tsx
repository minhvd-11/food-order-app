"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

interface AvatarProps {
  size?: number;
  avatarUrl: string | null;
}

export default function Avatar({ size = 150, avatarUrl }: AvatarProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (avatarUrl) {
      setPreviewUrl(avatarUrl);
    }
  }, [avatarUrl]);

  return (
    <div className="flex flex-col items-center space-y-4">
      {previewUrl ? (
        <Image
          width={size}
          height={size}
          src={previewUrl}
          alt="Avatar"
          className="rounded-full object-cover border border-gray-200 dark:border-neutral-700"
        />
      ) : (
        <div
          className="rounded-full bg-gray-300 dark:bg-neutral-700 flex items-center justify-center"
          style={{ width: size, height: size }}
        >
          <span className="text-gray-500 dark:text-gray-400 text-sm">No image</span>
        </div>
      )}
    </div>
  );
}
