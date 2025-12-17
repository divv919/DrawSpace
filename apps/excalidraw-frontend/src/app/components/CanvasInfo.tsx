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
import { use, useEffect, useMemo, useState } from "react";
import Dialog, {
  DialogActions,
  DialogBackground,
  DialogContent,
  DialogTitle,
} from "./ui/Dialog";
import { Button } from "./ui/Button";

export default function CanvasInfo({
  socket,
  user,
  roomUsers,
}: {
  socket: WebSocket;
  roomUsers: RoomUser[];
  user: {
    userId: undefined | string;
    access: "user" | "admin" | "moderator" | undefined;
    username: string | undefined;
  };
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [toBan, setToBan] = useState<string | null>(null);
  const [toChangeRole, setToChangeRole] = useState<string | null>(null);
  const [toUnban, setToUnban] = useState<string | null>(null);
  const [roleToChangeTo, setRoleToChangeTo] = useState<
    "user" | "moderator" | null
  >(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const currentUserRole = user.access;
  const isAdmin = currentUserRole === "admin";

  const userDependency = `${user.userId || ""}-${user.access || ""}-${user.username || ""}`;

  useEffect(() => {
    console.log("user is in effect", user);
  }, [user, userDependency]);
  const { currentUser, otherUsers } = useMemo(() => {
    console.log("user is ", user);

    // Only create currentUser if username is defined
    if (!user.username) {
      return { currentUser: null, otherUsers: [] };
    }

    const currentUser = {
      username: user.username,
      role: user.access,
      isBanned: false,
      isOnline: true,
    };
    console.log("current user is ", currentUser);

    const others = roomUsers
      .filter((userInfo) => {
        return userInfo.username !== currentUser.username;
      })
      .sort((a, b) => {
        if (a.isBanned !== b.isBanned) {
          return a.isBanned ? 1 : -1;
        }
        if (a.isOnline !== b.isOnline) {
          return a.isOnline ? -1 : 1;
        }
        if (a.role !== b.role) {
          return a.role.localeCompare(b.role);
        }
        return a.username.localeCompare(b.username);
      });
    console.log("others are ", others);
    return { otherUsers: others, currentUser };
  }, [roomUsers, user, userDependency]);

  // Placeholder functions for admin actions
  const handleBanUser = (userId: string) => {
    console.log("Ban user:", userId);

    socket.send(
      JSON.stringify({
        channel: "room_control",
        operation: "ban_user",
        ban: true,
        targetUserId: userId,
      })
    );
  };

  const userIdToUsername = (userId: string) => {
    return roomUsers.find((u) => u.userId === userId)?.username || "";
  };
  const handleUnbanUser = (userId: string) => {
    console.log("Ban user:", userId);

    socket.send(
      JSON.stringify({
        channel: "room_control",
        operation: "ban_user",
        ban: false,
        targetUserId: userId,
      })
    );
  };

  const handleChangeRole = (userId: string, role: "user" | "moderator") => {
    console.log("Promote to moderator:", userId);
    socket.send(
      JSON.stringify({
        channel: "room_control",
        operation: "change_role",
        new_role: role,
        targetUserId: userId,
      })
    );
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
  const handleConfirm = () => {
    if (toBan) {
      handleBanUser(toBan);
    } else if (toChangeRole && roleToChangeTo) {
      handleChangeRole(toChangeRole, roleToChangeTo);
    } else if (toUnban) {
      handleUnbanUser(toUnban);
    }
    setIsDialogOpen(false);
    setToBan(null);
    setIsOpen(false);
    setToChangeRole(null);
    setToUnban(null);
  };

  return (
    <>
      {isDialogOpen && (
        <DialogBackground>
          <Dialog>
            <DialogTitle>
              {toBan
                ? "Ban User"
                : toChangeRole
                  ? "Change Role"
                  : toUnban
                    ? "Unban User"
                    : "Error"}
            </DialogTitle>
            <DialogContent>
              {toBan
                ? `Are you sure you want to ban ${userIdToUsername(toBan)}?`
                : toChangeRole
                  ? `Are you sure you want to change the role of ${userIdToUsername(toChangeRole)} to ${roleToChangeTo}?`
                  : toUnban
                    ? `Are you sure you want to unban ${userIdToUsername(toUnban)}?`
                    : "Error"}
            </DialogContent>
            <DialogActions>
              <Button
                variant="secondary"
                onClick={() => {
                  setIsDialogOpen(false);
                  setToBan(null);
                  setToChangeRole(null);
                  setToUnban(null);
                  setRoleToChangeTo(null);
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={handleConfirm}>
                Confirm
              </Button>
            </DialogActions>
          </Dialog>
        </DialogBackground>
      )}
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="absolute top-4 right-4 z-40 inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#262626] cursor-pointer text-neutral-200 hover:bg-neutral-700 hover:text-neutral-200 transition-all duration-150"
        aria-label={isOpen ? "Close room info" : "Open room info"}
      >
        {isOpen ? <X size={18} /> : <PanelRight size={18} />}
      </button>

      {/* Sidebar panel */}
      <aside
        className={`pointer-events-auto fixed top-0 right-0 h-full w-80 max-w-[80vw] bg-neutral-800 transform transition-transform duration-200 ease-out flex flex-col gap-2 z-30 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex flex-col gap-2 px-4 py-[18px]">
          <div className="flex items-center  justify-between">
            <div className="px-1">
              <span className="text-xs font-medium text-neutral-400 uppercase">
                Your Info
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="inline-flex h-7 w-7 items-start justify-center rounded-md hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200 transition-colors"
              aria-label="Close room info"
            >
              <X size={16} />
            </button>
          </div>
          {/* Current User Info */}
          <section className="rounded-md  w-full  flex    gap-3">
            <div className="flex items-center justify-between  ">
              <div className="text-xs font-medium text-neutral-400 uppercase bg-neutral-700 rounded-full  flex items-center justify-center">
                {/* <User2 size={25} /> */}
                <div className="size-7 rounded-full bg-linear-60 from-orange-500 to-blue-500"></div>
              </div>
            </div>

            {currentUser?.username ? (
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
        </div>

        {/* Content */}
        <div className="  px-4 pb-4 h-full w-full space-y-3 ">
          {/* Current user section */}
          <section className="space-y-2 h-full">
            <div className="flex items-center justify-between px-1 mb-2">
              <span className="text-xs font-medium text-neutral-400 uppercase">
                Participants
              </span>
              <span className="text-xs text-neutral-500">
                {roomUsers?.length ? roomUsers?.length - 1 : 0}
              </span>
            </div>

            {!roomUsers ? (
              <p className="text-xs text-neutral-500 px-1">Loading...</p>
            ) : otherUsers.length === 0 ? (
              <p className="text-xs text-neutral-500 px-1">
                No other participants
              </p>
            ) : (
              <div className="h-full relative mask-y-from-95% mask-y-to-110% ">
                {/* <div className="absolute top-0 left-0 w-full h-[40px] bg-neutral-800 "></div>
                <div className="absolute bottom-32 mask-t-from-0% mask-t-to-100% left-0 w-full h-[40px]  bg-neutral-800 opacity-100"></div> */}

                <ul className="space-y-4  h-full  overflow-y-auto scrollbar-none pb-40 pt-4  relative">
                  {otherUsers.map((u) => (
                    <li
                      key={`${u.username}-${u.role}-${String(u.isBanned)}`}
                      className="rounded-md  "
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-xs relative font-medium text-neutral-400 uppercase bg-neutral-700 rounded-full p-0 flex items-center justify-center">
                          {/* <User2 size={18} /> */}
                          <div className="size-6 rounded-full bg-linear-60 from-orange-500 to-blue-500"></div>

                          <div
                            className={`size-[14px] rounded-full p-[4px] absolute  top-0 -left-1 z-100  ${u.isOnline ? "bg-green-500" : "bg-neutral-500"}`}
                          >
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
                                onClick={() => {
                                  setToUnban(u.userId);
                                  setIsDialogOpen(true);
                                }}
                                className="cursor-pointer text-xs px-2 py-1 rounded-md bg-green-500/20 text-green-300 hover:bg-green-500/30 transition-colors"
                                title="Unban user"
                              >
                                Unban
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setToBan(u.userId);
                                  setIsDialogOpen(true);
                                }}
                                className="cursor-pointer flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors"
                                title="Ban user"
                              >
                                <Ban size={12} />
                                Ban
                              </button>
                            )}
                            {u.role === "user" ? (
                              <button
                                onClick={() => {
                                  setToChangeRole(u.userId);
                                  setRoleToChangeTo(
                                    u.role === "moderator"
                                      ? "user"
                                      : "moderator"
                                  );
                                  setIsDialogOpen(true);
                                }}
                                className="text-xs cursor-pointer px-2 py-1 rounded-md bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors flex items-center gap-1"
                                title="Promote to moderator"
                              >
                                <UserCog size={12} />
                                Mod
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setToChangeRole(u.userId);
                                  setRoleToChangeTo(
                                    u.role === "moderator"
                                      ? "user"
                                      : "moderator"
                                  );
                                  setIsDialogOpen(true);
                                }}
                                className="text-xs cursor-pointer px-2 py-1 rounded-md bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 transition-colors flex items-center gap-1"
                                title="Promote to moderator"
                              >
                                {/* <UserCog size={12} /> */}
                                Demote
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
          {/* Participants */}
        </div>
      </aside>
    </>
  );
}
