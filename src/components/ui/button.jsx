import React from "react";

export function Button({ className = "", children, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2 font-medium transition bg-cyan-500 text-zinc-950 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
