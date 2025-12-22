"use client";

import { stringToGradient } from "../lib/util";
import { useSession } from "next-auth/react";

export default function UsernameDashboard() {
  <div className="size-5 rounded-full bg-[linear-gradient(60deg,var(--c1),var(--c2))]" />;
  const session = useSession();
  const { color1, color2 } = stringToGradient(
    session.data?.user?.username ?? ""
  );

  return (
    <div className="flex items-center gap-2 text-neutral-300 w-full">
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
      <span className=" text-sm font-medium truncate text-nowrap w-full">
        {session.data?.user?.username}
      </span>
    </div>
  );
}
