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
  HashIcon,
  DoorClosedIcon,
  DoorClosedLockedIcon,
  Check,
  ArrowDown,
} from "lucide-react";
import { useState, useRef } from "react";
import { cn } from "../lib/util";
import { useSession } from "next-auth/react";

export default function AvailableRooms() {
  const [isCopying, setIsCopying] = useState<string | null>(null);
  const [isEntering, setIsEntering] = useState<string | null>(null);
  const { data: session } = useSession();
  const { data, isLoading, error } = useQuery<GetRoomsResponse, Error>({
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

  if (isLoading) {
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
                  className="flex items-center border-b-0 text-shadow-none  justify-center gap-1.5 px-3 py-1.5 w-[75px] h-[31px]  text-sm"
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

const DrawArrow = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      fill="oklch(70.8% 0 0)"
      // className="fill-(-var(-color-neutral-100))"
      version="1.1"
      id="Capa_1"
      width="100px"
      height="100px"
      viewBox="0 0 404.774 404.774"
      xmlSpace="preserve"
    >
      <g>
        <g>
          <path d="M145.76,82.63c-0.612-0.612-1.224-1.224-1.836-1.224c-1.224-9.18-6.12-19.584-8.568-27.54    c-4.896-15.912-9.18-32.436-13.464-48.348c-1.836-7.956-12.24-6.732-14.688,0c-9.792,25.704-18.972,50.796-29.988,75.888    c-1.836,3.672,0.612,6.732,3.672,7.344c0.612,1.224,1.836,2.448,4.284,3.06c8.568,0.612,17.748,1.224,26.316,1.836    c-12.24,37.944-8.568,83.844-7.956,123.012c0.612,50.797,1.836,102.204,5.508,153.612c0.612,7.956,11.628,7.956,12.24,0    c3.06-47.736-0.612-95.472-1.224-143.208c-0.612-44.676,5.508-88.74,5.508-132.804c7.344,1.224,16.524,2.448,20.808-2.448    C148.208,88.75,148.208,85.078,145.76,82.63z M121.892,80.182c-11.016,0.612-22.644,0.612-33.66,1.836    c9.792-15.912,17.748-33.048,25.092-50.184c2.448,8.568,4.896,17.136,6.732,25.704c1.836,6.12,3.06,15.3,6.12,22.644    C124.34,80.182,123.116,80.182,121.892,80.182z" />
          {/* <path d="M326.912,315.802c-0.611-3.672-5.508-6.12-9.18-4.896c-3.061,1.225-6.732,2.448-10.404,3.672    c18.359-21.42,7.344-80.172,6.121-103.428c-3.061-52.632-6.121-105.876-12.854-157.896c-1.223-7.956-11.627-7.956-12.24,0    c-3.672,45.288,4.285,92.412,7.346,137.088c2.447,37.944,9.791,83.844-0.613,121.176c-0.611,1.836,0,3.672,1.225,5.508    c-5.508,0.612-11.629,0.612-17.137,0c-7.344-1.224-11.016,7.956-6.119,11.628c-17.748,7.956,11.016,61.2,17.135,72.217    c2.449,4.896,11.018,5.508,13.465,0c11.016-25.093,20.195-50.797,23.867-78.337C328.748,319.474,328.136,317.025,326.912,315.802z     M284.683,348.85c-0.611-1.836-3.059-14.076-6.73-18.972c9.18,1.836,22.643,3.06,33.047,0    c-3.061,16.523-8.568,31.823-14.076,47.735C292.027,367.821,288.355,358.642,284.683,348.85z" /> */}
        </g>
      </g>
    </svg>
  );
};
