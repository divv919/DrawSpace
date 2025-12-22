"use client";
import { useState } from "react";

import { useRouter } from "next/navigation";
import { MenuIcon } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
export default function Sidebar() {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(true);
  return (
    <div>
      <div className="w-fit h-fit">
        <MenuIcon />
      </div>
      <div
        className={`fixed  top-0 left-0 w-1/4 h-full bg-white ${isOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300`}
      >
        <h1>Sidebar</h1>
        <button onClick={() => signOut()}>Logout</button>
        <button
          onClick={() => {
            router.push("/");
          }}
        >
          Home
        </button>
      </div>
    </div>
  );
}
