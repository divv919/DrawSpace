"use client";

import {
  Ban,
  Crown,
  PanelRight,
  Shield,
  User2,
  X,
  UserCog,
} from "lucide-react";
import { RoomUser } from "../canvas/[slug]/page";
import { useMemo, useState } from "react";

export default function CanvasInfo({
  user,
  roomUsers,
}: {
  roomUsers: RoomUser[];
  user: {
    userId: undefined | string;
    access: "user" | "admin" | "moderator" | undefined;
  };
}) {
  const [isOpen, setIsOpen] = useState(false);

  const currentUserRole = user.access;
  const isAdmin = currentUserRole === "admin";

  // For now we only know the current user's role, not their username from this prop,
  // so we treat "current user" as the one matching the role + not banned, if found.
  const { currentUser, otherUsers } = useMemo(() => {
    if (!roomUsers?.length) {
      return {
        currentUser: null as RoomUser | null,
        otherUsers: [] as RoomUser[],
      };
    }

    let current: RoomUser | null = null;
    const others: RoomUser[] = [];

    for (const ru of roomUsers) {
      if (!current && currentUserRole && ru.role === currentUserRole) {
        current = ru;
      } else {
        others.push(ru);
      }
    }

    return { currentUser: current, otherUsers: others };
  }, [roomUsers, currentUserRole]);

  // Placeholder functions for admin actions
  const handleBanUser = (username: string) => {
    console.log("Ban user:", username);
    // TODO: Implement ban logic
  };

  const handleUnbanUser = (username: string) => {
    console.log("Unban user:", username);
    // TODO: Implement unban logic
  };

  const handlePromoteToModerator = (username: string) => {
    console.log("Promote to moderator:", username);
    // TODO: Implement role change logic
  };

  const renderRoleBadge = (role: RoomUser["role"]) => {
    const base =
      "inline-flex items-center gap-1 rounded-md  text-[14px] font-[300] tracking-tight";
    switch (role) {
      case "admin":
        return (
          <span className={`${base} text-neutral-500 leading-4  `}>
            {/* <Crown size={12} /> */}
            Admin
          </span>
        );
      case "moderator":
        return (
          <span className={`${base}  text-neutral-500 leading-4`}>
            {/* <Shield size={12} /> */}
            Moderator
          </span>
        );
      default:
        return (
          <span className={`${base}  text-neutral-500  leading-4`}>
            {/* <User2 size={12} /> */}
            Member
          </span>
        );
    }
  };

  const renderBanBadge = (isBanned: RoomUser["isBanned"]) => {
    if (!isBanned) return null;
    return (
      <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium bg-red-500/20 text-red-300">
        <Ban size={12} />
        Banned
      </span>
    );
  };

  return (
    <>
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="absolute top-4 right-4 z-40 inline-flex h-9 w-9 items-center justify-center rounded-md bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200 transition-all duration-150"
        aria-label={isOpen ? "Close room info" : "Open room info"}
      >
        {isOpen ? <X size={18} /> : <PanelRight size={18} />}
      </button>

      {/* Sidebar panel */}
      <aside
        className={`pointer-events-auto fixed top-0 right-0 h-full w-80 max-w-[80vw] bg-neutral-800 transform transition-transform duration-200 ease-out flex flex-col gap-5 z-30 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-[18px]">
          <section className="rounded-md  w-full  flex    gap-3">
            <div className="flex items-center justify-between  ">
              <div className="text-xs font-medium text-neutral-400 uppercase bg-neutral-700 rounded-full p-3 flex items-center justify-center">
                <User2 size={25} />
              </div>
            </div>

            {currentUser ? (
              <div className="flex flex-col justify-center gap-[2px] items-start">
                <p className="text-md font-semibold text-neutral-200  leading-5">
                  {currentUser.username}
                </p>
                {currentUserRole && renderRoleBadge(currentUserRole)}

                {currentUser.isBanned && (
                  <div className="">{renderBanBadge(currentUser.isBanned)}</div>
                )}
              </div>
            ) : (
              <p className="text-xs text-neutral-500">Loading...</p>
            )}
          </section>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="inline-flex h-7 w-7 items-start justify-center rounded-md hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200 transition-colors"
            aria-label="Close room info"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
          {/* Current user section */}

          {/* Participants */}
          <section className="space-y-2 ">
            <div className="flex items-center justify-between px-1 mb-5">
              <span className="text-xs font-medium text-neutral-400 uppercase">
                Participants
              </span>
              <span className="text-xs text-neutral-500">
                {roomUsers?.length ? roomUsers?.length - 1 : 0}
              </span>
            </div>

            {!roomUsers || !roomUsers.length ? (
              <p className="text-xs text-neutral-500 px-1">Loading...</p>
            ) : otherUsers.length === 0 ? (
              <p className="text-xs text-neutral-500 px-1">
                No other participants
              </p>
            ) : (
              <ul className="space-y-2 max-h-[60vh] overflow-y-auto">
                {otherUsers.map((u) => (
                  <li
                    key={`${u.username}-${u.role}-${String(u.isBanned)}`}
                    className="rounded-md  "
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs relative font-medium text-neutral-400 uppercase bg-neutral-700 rounded-full p-3 flex items-center justify-center">
                        <User2 size={25} />
                        <div className="size-[14px] rounded-full p-[4px] absolute bg-green-500 top-0 left-0">
                          <div className="w-full h-full rounded-full bg-neutral-700"></div>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col gap-[2px] ">
                        <p className="text-md font-semibold leading-5 text-neutral-200 truncate">
                          {u.username}
                        </p>
                        <div className="flex flex-wrap leading-5 items-center gap-1.5 ">
                          {renderRoleBadge(u.role)}
                          {renderBanBadge(u.isBanned)}
                        </div>
                      </div>

                      {/* Admin controls */}
                      {isAdmin && u.role !== "admin" && (
                        <div className="flex flex-col gap-1">
                          {u.isBanned ? (
                            <button
                              onClick={() => handleUnbanUser(u.username)}
                              className="text-xs px-2 py-1 rounded-md bg-green-500/20 text-green-300 hover:bg-green-500/30 transition-colors"
                              title="Unban user"
                            >
                              Unban
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBanUser(u.username)}
                              className=" flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors"
                              title="Ban user"
                            >
                              <Ban size={12} />
                              Ban
                            </button>
                          )}
                          {u.role === "user" && (
                            <button
                              onClick={() =>
                                handlePromoteToModerator(u.username)
                              }
                              className="text-xs px-2 py-1 rounded-md bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors flex items-center gap-1"
                              title="Promote to moderator"
                            >
                              <UserCog size={12} />
                              Mod
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </aside>
    </>
  );
}
