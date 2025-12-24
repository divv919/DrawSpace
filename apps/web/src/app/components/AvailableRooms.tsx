"use client";
import { useQuery } from "@tanstack/react-query";
import { getRooms } from "../lib/rooms";
import { GetRoomsResponse } from "@/types/rooms";
import Link from "next/link";
import { useToast } from "../hooks/useToast";
import { Button } from "./ui/Button";
import {
  CopyIcon,
  ArrowRightIcon,
  LoaderIcon,
  AlertCircleIcon,
  InboxIcon,
  DoorClosedIcon,
  DoorClosedLockedIcon,
  Check,
  ArrowDown,
} from "lucide-react";
import { useState, useRef } from "react";
import { cn } from "../lib/util";

export default function AvailableRooms() {
  const [isCopying, setIsCopying] = useState<string | null>(null);
  const [isEntering, setIsEntering] = useState<string | null>(null);
  const { data, isFetching, error } = useQuery<GetRoomsResponse, Error>({
    queryKey: ["rooms"],
    queryFn: getRooms,
    staleTime: 1000 * 60 * 5,
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showHintArrow, setShowHintArrow] = useState(true);
  const { showToast } = useToast();
  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop } = scrollRef.current;
      if (scrollTop === 0) {
        setShowHintArrow(true);
      } else {
        setShowHintArrow(false);
      }
    }
  };
  const copyInviteLink = async (slug: string) => {
    if (isCopying === slug) return;
    setIsCopying(slug);
    setTimeout(() => {
      setIsCopying(null);
    }, 2000);
    const inviteLink = `${window.location.origin}/canvas/${slug}`;
    await navigator.clipboard.writeText(inviteLink);
    showToast({
      type: "success",
      message: "Invite link copied to clipboard successfully!",
      title: "Copied to clipboard",
    });
  };

  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
        <LoaderIcon className="w-6 h-6 animate-spin mb-3" />
        <p className="text-sm">Loading rooms...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
        <AlertCircleIcon className="w-8 h-8 mb-3 text-red-400" />
        <p className="text-sm text-red-400">Error: {error.message}</p>
      </div>
    );
  }

  if (data && data.rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
        <InboxIcon className="w-10 h-10 mb-3 text-neutral-600" />
        <p className="text-base font-medium text-neutral-300 mb-1">
          No rooms yet
        </p>
        <p className="text-sm">Create a new room to get started</p>
      </div>
    );
  }

  if (data && data.rooms.length > 0) {
    return (
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="divide-y relative divide-neutral-800 max-h-[350px] mask-y-from-94% mask-y-to-100% overflow-y-auto  scrollbar-none"
      >
        {data.rooms.length > 5 && showHintArrow && (
          <div
            onClick={() => {
              scrollRef.current?.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: "smooth",
              });
            }}
            className="fixed bg-neutral-50 text-neutral-800 cursor-pointer  bottom-[220px] lg:bottom-[240px] xl:bottom-[148px] shadow-2xl left-1/2 -translate-x-1/2 p-2 rounded-full z-100 "
          >
            {/* <DrawArrow /> */}
            <ArrowDown size={18} />
          </div>
        )}
        {data.rooms.map((room) => (
          <div
            key={room.id}
            className="flex items-center justify-between px-5 py-4 hover:bg-neutral-800/30 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-neutral-800 flex items-center justify-center">
                {!room.isProtected ? (
                  <DoorClosedIcon className="w-5 h-5 text-neutral-400" />
                ) : (
                  <DoorClosedLockedIcon className="w-5 h-5 text-neutral-400" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-medium text-neutral-200">
                  {room.name}
                </h3>
                <p className="text-xs text-neutral-500">
                  ID: {room.slug.slice(0, 8)}...
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => copyInviteLink(room.slug)}
                className={cn(
                  "p-2 rounded-lg text-neutral-400  transition-colors ",
                  isCopying !== room.slug &&
                    "cursor-pointer hover:text-neutral-200 hover:bg-neutral-800"
                )}
                title="Copy invite link"
              >
                {isCopying === room.slug ? (
                  <Check size={16} />
                ) : (
                  <CopyIcon size={16} />
                )}
              </button>

              <Link href={`/canvas/${room.slug}`}>
                <Button
                  onClick={() => setIsEntering(room.slug)}
                  variant="primary"
                  className={cn(
                    "flex items-center border-b-0 text-shadow-none  justify-center gap-1.5 px-3 py-1.5 w-[75px] h-[31px]  text-sm",
                    isEntering && "cursor-default"
                  )}
                >
                  {isEntering === room.slug ? (
                    <span>
                      <LoaderIcon className="animate-spin" size={14} />
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      Enter
                      <ArrowRightIcon size={14} />
                    </span>
                  )}
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    );
  }
}
