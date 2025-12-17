"use client";

import Image from "next/image";
import { useAuth } from "../hooks/useAuth";
import { UserIcon } from "lucide-react";

export default function UsernameDashboard() {
  const { user } = useAuth();
  return (
    <div className="flex items-center gap-2 text-neutral-300">
      <div className=" rounded-full bg-neutral-700 flex items-center justify-center">
        {/* <UserIcon size={16} className="text-neutral-300" /> */}
        <div className="size-5 rounded-full bg-linear-60 from-orange-500 to-blue-500"></div>
      </div>
      <span className="text-sm font-medium">{user?.username}</span>
    </div>
  );
}
