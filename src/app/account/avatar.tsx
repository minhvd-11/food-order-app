"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

interface AvatarProps {
  size?: number;
  avatarUrl: string | null;
  onUpload: (url: string) => void;
}

export default function Avatar({
  size = 150,
  avatarUrl,
  onUpload,
}: AvatarProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [inputUrl, setInputUrl] = useState("");

  useEffect(() => {
    if (avatarUrl) {
      setPreviewUrl(avatarUrl);
      setInputUrl(avatarUrl);
    }
  }, [avatarUrl]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputUrl(e.target.value);
  };

  const handleSave = () => {
    if (inputUrl.trim()) {
      setPreviewUrl(inputUrl.trim());
      onUpload(inputUrl.trim());
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {previewUrl ? (
        <Image
          width={size}
          height={size}
          src={previewUrl}
          alt="Avatar"
          className="rounded-full object-cover border"
          style={{ height: size, width: size }}
        />
      ) : (
        <div
          className="rounded-full bg-gray-300 flex items-center justify-center"
          style={{ width: size, height: size }}
        >
          <span className="text-gray-500 text-sm">No image</span>
        </div>
      )}

      <div className="w-full space-y-2">
        <input
          type="text"
          placeholder="Paste avatar image URL"
          value={inputUrl}
          onChange={handleInputChange}
          className="w-full border px-3 py-2 rounded text-sm"
        />
        <button
          onClick={handleSave}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Save Avatar URL
        </button>
      </div>
    </div>
  );
}
