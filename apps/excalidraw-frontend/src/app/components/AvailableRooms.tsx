"use client";
import { useQuery } from "@tanstack/react-query";
import { getRooms } from "../api/rooms";
import { GetRoomsResponse, Room } from "@/types/rooms";
import Link from "next/link";

const copyInviteLink = async (slug: string) => {
  const inviteLink = `${window.location.origin}/canvas/${slug}`;
  await navigator.clipboard.writeText(inviteLink);
  alert("Invite link copied to clipboard");
};
export default function AvailableRooms() {
  const { data, isLoading, error } = useQuery<GetRoomsResponse, Error>({
    queryKey: ["rooms"],
    queryFn: getRooms,
    staleTime: 1000 * 60 * 5,
  });
  console.log({ data });
  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>Error: {error.message}</div>;
  }
  if (data && data.rooms.length === 0) {
    return <div>No rooms found</div>;
  }
  if (data && data.rooms.length > 0) {
    return (
      <div>
        <h2>Available Rooms</h2>
        {data.rooms.map((room) => (
          <div key={room.id} className="flex gap-2">
            <h3>{room.name}</h3>
            <Link href={`/canvas/${room.slug}`}>Enter</Link>
            <button onClick={() => copyInviteLink(room.slug)}>
              Copy Invite Link
            </button>
          </div>
        ))}
      </div>
    );
  }
}
