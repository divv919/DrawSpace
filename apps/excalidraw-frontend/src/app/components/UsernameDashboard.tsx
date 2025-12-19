"use client";

import Image from "next/image";
import { useAuth } from "../hooks/useAuth";
import { UserIcon } from "lucide-react";
import { stringToGradient } from "../lib/util";

export default function UsernameDashboard() {
  <div className="size-5 rounded-full bg-[linear-gradient(60deg,var(--c1),var(--c2))]" />;
  const { user } = useAuth();
  const { color1, color2 } = stringToGradient(user?.username ?? "");

  return (
    <div className="flex items-center gap-2 text-neutral-300">
      <div className=" rounded-full bg-neutral-700 flex items-center justify-center">
        {/* <UserIcon size={16} className="text-neutral-300" /> */}
        <div
          className="size-5 rounded-full bg-[linear-gradient(60deg,var(--c1),var(--c2))]"
          style={
            {
              "--c1": color1,
              "--c2": color2,
            } as React.CSSProperties
          }
        ></div>
      </div>
      <span className="text-sm font-medium">{user?.username}</span>
    </div>
  );
}
