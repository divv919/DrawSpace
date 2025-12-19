import type { Camera } from "@/app/lib/camera";
import { Minus, Plus } from "lucide-react";

export default function ZoomIndicator({
  camera,
  MAX_ZOOM,
  MIN_ZOOM,
  zoomLevel,
  setZoomLevel,
}: {
  camera: Camera | null;
  MAX_ZOOM: number;
  MIN_ZOOM: number;
  zoomLevel: number;
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>;
}) {
  if (!camera) {
    return;
  }
  return (
    <div className="flex gap-3 items-center overflow-hidden rounded-md absolute  bottom-18 md:bottom-0 my-4 right-5 bg-neutral-800">
      <button
        title="Zoom In"
        className="hover:bg-neutral-700 transition-all duration-200 cursor-pointer px-3 py-2"
        onClick={() => {
          const value = Math.min(
            MAX_ZOOM,
            Math.max(MIN_ZOOM, camera.scale + 0.1)
          );
          camera.scale = value;
          setZoomLevel(value);
        }}
      >
        <Plus size={16} />
      </button>
      <div>{(zoomLevel * 100).toFixed(0)}%</div>
      <button
        title="Zoom Out"
        onClick={() => {
          const value = Math.min(
            MAX_ZOOM,
            Math.max(MIN_ZOOM, camera.scale - 0.1)
          );
          camera.scale = value;
          setZoomLevel(value);
        }}
        className="px-3 py-2 hover:bg-neutral-700 transition-all duration-200 cursor-pointer"
      >
        <Minus size={16} />
      </button>
    </div>
  );
}
