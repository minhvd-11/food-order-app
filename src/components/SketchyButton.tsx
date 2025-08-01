"use client";

import React from "react";

interface SketchyButtonProps extends React.ComponentProps<"button"> {
  children: React.ReactNode;
  clt?: string;
}

export function SketchyButton({ children, clt, ...props }: SketchyButtonProps) {
  return (
    <button className={`sketchy-button font-hand mb-4 ${clt}`} {...props}>
      <span>{children}</span>
    </button>
  );
}
