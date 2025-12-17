"use client";
import { OctagonAlert } from "lucide-react";

export default function Dialog({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-fit max-w-[300px] h-fit bg-neutral-800 rounded-md flex flex-col gap-3 py-4 px-5">
      {children}
    </div>
  );
}
export function DialogActions({ children }: { children: React.ReactNode }) {
  return <div className="flex justify-end gap-3 mt-3 ">{children}</div>;
}
export function DialogContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-neutral-300 font-light flex flex-col gap-2">
      {children}
    </div>
  );
}
export function DialogTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex text-white text-lg font-bold gap-2 items-center">
      <OctagonAlert size={20} className="pb-[1px]" /> {children}
    </div>
  );
}

export function DialogBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-full z-100 absolute bg-black/60 top-0 flex items-center justify-center">
      {children}
    </div>
  );
}
