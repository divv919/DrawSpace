import AvailableRooms from "@/app/components/AvailableRooms";
import RoomActions from "@/app/components/RoomActions";

export default function RoomsPage() {
  return (
    <div className="flex-1 flex flex-col px-8 py-10 lg:py-8 ">
      <div className="max-w-4xl mx-auto w-full">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-xl font-bold text-neutral-100 mb-1">Rooms</h1>
          <p className="text-neutral-400 text-[15px] lg:text-base">
            Create a new room or join an existing one to collaborate with
            others.
          </p>
        </div>

        {/* Rooms Container */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
          <RoomActions />
          <AvailableRooms />
        </div>
      </div>
    </div>
  );
}
