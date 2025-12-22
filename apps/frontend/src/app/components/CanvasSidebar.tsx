"use client";

import { toTitleCase } from "../lib/util";

const availableColors = ["white", "red", "green", "blue", "yellow"];
export default function CanvasSidebar({
  currentColor,
  setCurrentColor,
}: {
  currentColor: CanvasRenderingContext2D["strokeStyle"];
  setCurrentColor: (color: CanvasRenderingContext2D["strokeStyle"]) => void;
}) {
  return (
    <div className="absolute flex flex-col gap-3  top-0 left-0  rounded-lg bg-neutral-800 m-4 p-4">
      <div className=" font-medium text-sm text-neutral-400 uppercase ">
        Stroke Color
      </div>
      <div className="flex gap-1">
        {availableColors.map((color, index) => {
          return (
            <div
              title={toTitleCase(color)}
              key={index}
              className={`rounded-md ${currentColor === color ? "border border-blue-500" : ""}`}
            >
              <div
                className="h-fit w-fit"
                onClick={() => setCurrentColor(color)}
              >
                <div
                  className={`size-7 m-1  cursor-pointer rounded-md `}
                  style={{ backgroundColor: color }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
