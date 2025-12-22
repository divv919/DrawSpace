"use client";

import {
  Ban,
  PanelRight,
  X,
  UserCog,
  Users,
  User,
  ShieldCheck,
  Crown,
} from "lucide-react";
import { RoomUser } from "../(canvas)/canvas/[slug]/page";
import React, { useEffect, useMemo, useState } from "react";
import Dialog, {
  DialogActions,
  DialogBackground,
  DialogContent,
  DialogTitle,
} from "./ui/Dialog";
import { Button } from "./ui/Button";
import { stringToGradient } from "../lib/util";

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
    console.log("Unban user:", userId);
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
    console.log("Change role:", userId);
    socket.send(
      JSON.stringify({
        channel: "room_control",
        operation: "change_role",
        new_role: role,
        targetUserId: userId,
      })
    );
  };

  const renderRoleIcon = (role: RoomUser["role"]) => {
    switch (role) {
      case "admin":
        return <Crown size={12} className="text-amber-400" />;
      case "moderator":
        return <ShieldCheck size={12} className="text-indigo-400" />;
      default:
        return <User size={12} className="text-neutral-500" />;
    }
  };

  const renderRoleBadge = (role: RoomUser["role"]) => {
    const base =
      "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] lg:text-xs font-medium";

    switch (role) {
      case "admin":
        return (
          <span className={`${base} bg-amber-500/10 text-amber-400`}>
            <Crown size={10} />
            Admin
          </span>
        );
      case "moderator":
        return (
          <span className={`${base} bg-indigo-500/10 text-indigo-400`}>
            <ShieldCheck size={10} />
            Moderator
          </span>
        );
      default:
        return (
          <span className={`${base} bg-neutral-700/50 text-neutral-400`}>
            <User size={10} />
            Member
          </span>
        );
    }
  };

  const renderBanBadge = (isBanned: RoomUser["isBanned"]) => {
    if (!isBanned) return null;
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] lg:text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/20">
        <Ban size={10} />
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

  const { color1, color2 } = stringToGradient(currentUser?.username ?? "");
  const onlineCount = otherUsers.filter((u) => u.isOnline).length;

  return (
    <>
      {/* Confirmation Dialog */}
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

      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="absolute top-4 right-4 z-40 inline-flex h-10 w-10 items-center justify-center rounded-md bg-neutral-800 hover:bg-neutral-100 cursor-pointer text-neutral-400 hover:text-neutral-300 hover:bg-neutral-700  hover:shadow-lg "
        aria-label={isOpen ? "Close room info" : "Open room info"}
      >
        {isOpen ? <X size={18} /> : <PanelRight size={18} />}
      </button>

      {/* Sidebar Panel */}
      <aside
        className={`pointer-events-auto fixed top-0 right-0 h-full w-70 g:w-80 lg:max-w-[85vw] bg-neutral-800 border-l border-neutral-800 transform transition-transform duration-300 ease-out flex flex-col z-30 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Decorative Pattern */}
        <div className="absolute top-0 right-0 w-full h-32 bg-[image:repeating-linear-gradient(315deg,_var(--color-neutral-700)_0,_var(--color-neutral-700)_1px,transparent_0,_transparent_50%)] bg-[size:8px_8px] opacity-30 mask-b-from-0% mask-b-to-100%" />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between px-3 py-4 lg:px-5 lg:py-4 border-b border-neutral-800/80">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-neutral-400" />
            <h2 className="text-lg text-neutral-200 font-dancing-script tracking-wide">
              Room Info
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-neutral-800 text-neutral-500 hover:text-neutral-300 transition-all duration-150"
            aria-label="Close room info"
          >
            <X size={16} />
          </button>
        </div>

        {/* Current User Section */}
        <div className="relative z-10 px-3 py-4 lg:px-5 lg:py-5 border-b border-neutral-800/80">
          <p className="text-[10px] lg:text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-3">
            Your Profile
          </p>
          <div className="flex items-center gap-4 p-3 lg:p-4 lg:py-3 rounded-md bg-neutral-900/50 border border-neutral-800 hover:shadow-[inset_0px_-15px_30px_rgba(255,255,255,0.02)] transition-all duration-200">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div
                className="h-10 w-10 lg:w-12 lg:h-12 rounded-full bg-[linear-gradient(135deg,var(--c1),var(--c2))] shadow-lg"
                style={
                  {
                    "--c1": color1,
                    "--c2": color2,
                  } as React.CSSProperties
                }
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 border-2 border-neutral-950" />
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              {currentUser?.username ? (
                <>
                  <p className="text-sm lg:text-base font-semibold text-neutral-100 truncate leading-tight">
                    {currentUser.username}
                  </p>
                  <div className="mt-1.5">
                    {currentUserRole && renderRoleBadge(currentUserRole)}
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-neutral-800 rounded animate-pulse" />
                  <div className="h-3 w-16 bg-neutral-800 rounded animate-pulse" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Participants Section */}
        <div className="flex-1 flex flex-col min-h-0 px-3 py-3 lg:px-5 lg:py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] lg:text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
              Participants
            </p>
            <div className="flex items-center gap-[6px] lg:gap-2">
              <span className="flex items-center gap-1 text-xs text-neutral-500">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                {onlineCount} online
              </span>
              <span className="text-xs text-neutral-600">•</span>
              <span className="text-xs text-neutral-500">
                {otherUsers.length} total
              </span>
            </div>
          </div>

          {/* Participants List */}
          {!roomUsers ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-neutral-700 border-t-neutral-400 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-neutral-500">Loading...</p>
              </div>
            </div>
          ) : otherUsers.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto mb-3">
                  <Users size={20} className="text-neutral-600" />
                </div>
                <p className="text-sm text-neutral-500">
                  No other participants
                </p>
                <p className="text-xs text-neutral-600 mt-1">
                  Share the room link to invite others
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto scrollbar-none  -mx-5 px-5">
              <ul className="space-y-2 pb-4">
                {otherUsers.map((u) => {
                  const { color1, color2 } = stringToGradient(u.username ?? "");
                  return (
                    <li
                      key={`${u.username}-${u.role}-${String(u.isBanned)}`}
                      className={`group p-3 py-2 rounded-lg border transition-all duration-200 ${
                        u.isBanned
                          ? "bg-red-500/5 border-red-500/20"
                          : "bg-neutral-900/50 border-neutral-800/80 hover:bg-neutral-900 "
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Avatar with Status */}
                        <div className="relative flex-shrink-0">
                          <div
                            className={`w-9 h-9 rounded-full bg-[linear-gradient(135deg,var(--c1),var(--c2))] ${
                              u.isBanned ? "opacity-50" : ""
                            }`}
                            style={
                              {
                                "--c1": color1,
                                "--c2": color2,
                              } as React.CSSProperties
                            }
                          />
                          <div
                            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-neutral-950 ${
                              u.isOnline ? "bg-green-500" : "bg-neutral-600"
                            }`}
                          />
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p
                              className={`text-sm font-medium truncate ${
                                u.isBanned
                                  ? "text-neutral-500"
                                  : "text-neutral-200"
                              }`}
                            >
                              {u.username}
                            </p>
                            <span className="pb-[2px]">
                              {" "}
                              {renderRoleIcon(u.role)}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            {!u.isBanned && renderRoleBadge(u.role)}
                            {renderBanBadge(u.isBanned)}
                          </div>
                        </div>

                        {/* Admin Controls */}
                        {isAdmin && u.role !== "admin" && (
                          <div className="flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            {u.isBanned ? (
                              <button
                                onClick={() => {
                                  setToUnban(u.userId);
                                  setIsDialogOpen(true);
                                }}
                                className="cursor-pointer text-xs px-2.5 py-1 rounded-lg bg-green-500/15 text-green-400 hover:bg-green-500/25 border border-green-500/20 hover:border-green-500/40 transition-all duration-150"
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
                                className="cursor-pointer flex items-center justify-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/20 hover:border-red-500/40 transition-all duration-150"
                                title="Ban user"
                              >
                                <Ban size={10} />
                                Ban
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setToChangeRole(u.userId);
                                setRoleToChangeTo(
                                  u.role === "moderator" ? "user" : "moderator"
                                );
                                setIsDialogOpen(true);
                              }}
                              className={`cursor-pointer flex items-center justify-center gap-1 text-xs px-2.5 py-1 rounded-lg border transition-all duration-150 ${
                                u.role === "moderator"
                                  ? "bg-amber-500/15 text-amber-400 border-amber-500/20 hover:bg-amber-500/25 hover:border-amber-500/40"
                                  : "bg-indigo-500/15 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/25 hover:border-indigo-500/40"
                              }`}
                              title={
                                u.role === "moderator"
                                  ? "Demote to member"
                                  : "Promote to moderator"
                              }
                            >
                              <UserCog size={10} />
                              {u.role === "moderator" ? "Demote" : "Mod"}
                            </button>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        {/* <div className="relative z-10 px-5 py-4 border-t border-neutral-800/80 bg-neutral-900/80 backdrop-blur-sm">
          <p className="text-xs text-neutral-600 text-center">
            {isAdmin ? "You have admin privileges" : "Room participant"}
          </p>
        </div> */}
      </aside>
    </>
  );
}
