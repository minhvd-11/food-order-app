import Image from "next/image";

// Profile photo, or the first letter of the name when there is none
export default function Avatar({
  avatarUrl,
  name,
  size = 64,
}: {
  avatarUrl: string | null;
  name: string;
  size?: number;
}) {
  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover ring-2 ring-red-100 dark:ring-red-900/50"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center rounded-full bg-red-50 font-semibold text-red-600 ring-2 ring-red-100 dark:bg-red-950/40 dark:text-red-400 dark:ring-red-900/50"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}
