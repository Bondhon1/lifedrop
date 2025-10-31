import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-[calc(100vh-3rem)] items-center justify-center">
      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-slate-900/70 p-8 shadow-2xl shadow-black/30 backdrop-blur-lg">
        {children}
      </div>
    </div>
  );
}
