"use client";
import {
  useIsFetching,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { createRoom } from "../api/rooms";
import { CreateRoomRequest, CreateRoomResponse } from "@/types/rooms";
import { useEffect, useState } from "react";
import CreateRoomModal from "./CreateRoomModal";
import { Button } from "./ui/Button";
import { RefreshCcwIcon, PlusIcon } from "lucide-react";
import { cn } from "../lib/util";

export default function RoomActions() {
  const [formData, setFormData] = useState({
    name: "",
    password: "",
    isProtected: false,
  });
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const isFetchingRooms = useIsFetching({ queryKey: ["rooms"] }) > 0;

  useEffect(() => {
    console.log("Is fetching", isFetchingRooms);
  }, [isFetchingRooms]);
  const mutation = useMutation<CreateRoomResponse, Error, CreateRoomRequest>({
    mutationFn: createRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });

  const handleCreateRoom = () => {
    mutation.mutate(formData);
    setIsCreateRoomModalOpen(false);
    setFormData({ name: "", password: "", isProtected: false });
  };

  const handleRefreshRooms = () => {
    queryClient.invalidateQueries({ queryKey: ["rooms"] });
  };

  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
      <h2 className="text-[16px] font-semibold font-manrope text-neutral-200">
        Available Rooms
      </h2>
      <div className="flex items-center gap-2">
        <button
          onClick={handleRefreshRooms}
          className="p-2 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer"
          title="Refresh rooms"
        >
          <RefreshCcwIcon
            size={18}
            className={cn(isFetchingRooms && "animate-spin")}
          />
        </button>
        <Button
          variant="primary"
          onClick={() => setIsCreateRoomModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5"
        >
          <PlusIcon size={16} />
          <span>New Room</span>
        </Button>
      </div>

      {isCreateRoomModalOpen && (
        <CreateRoomModal
          onClose={() => setIsCreateRoomModalOpen(false)}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleCreateRoom}
          mutation={mutation}
        />
      )}
    </div>
  );
}
