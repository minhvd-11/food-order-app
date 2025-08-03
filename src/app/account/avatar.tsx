"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

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
  const supabase = createClient();
  const [uploading, setUploading] = useState(false);
  const [localUrl, setLocalUrl] = useState<string | null>(null);

  useEffect(() => {
    if (avatarUrl) {
      downloadImage(avatarUrl);
    } else {
      setLocalUrl(null);
    }
  }, [avatarUrl]);

  async function downloadImage(path: string) {
    try {
      const { data, error } = await supabase.storage
        .from("avatars")
        .download(path);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      setLocalUrl(url);
    } catch (error) {
      console.error("Error downloading avatar: ", error);
    }
  }

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = async (
    event
  ) => {
    try {
      setUploading(true);

      const file = event.target.files?.[0];
      if (!file) throw new Error("No file selected");

      const fileExt = file.name.split(".").pop();
      const filePath = `${Date.now()}-${Math.random()}.${fileExt}`;

      const { error } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (error) throw error;

      onUpload(filePath); // Notify parent with storage path
    } catch (error) {
      console.error("Upload error:", error);
      alert("Error uploading avatar!");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      {localUrl ? (
        <Image
          width={size}
          height={size}
          src={localUrl}
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
      <div>
        <label className="cursor-pointer inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
          {uploading ? "Uploading..." : "Upload Avatar"}
          <input
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>
    </div>
  );
}
