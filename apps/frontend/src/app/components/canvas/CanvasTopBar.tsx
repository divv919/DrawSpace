import { cn, toTitleCase } from "@/app/lib/util";
import type { Shape } from "@/types/canvas";
import {
  Circle,
  Eraser,
  Hand,
  Minus,
  MousePointer2,
  MoveUpRight,
  Pencil,
  Square,
  Type,
} from "lucide-react";

const shapeToIcon: Record<Shape, React.ReactElement> = {
  rectangle: <Square size={16} />,
  ellipse: <Circle size={16} />,
  pencil: <Pencil size={16} />,
  line: <Minus size={16} />,
  arrow: <MoveUpRight size={16} />,
  hand: <Hand size={16} />,
  text: <Type size={16} />,
  select: <MousePointer2 size={16} />,
  erasor: <Eraser size={16} />,
};

export default function CanvasTopBar({
  currentShape,
  setCurrentShape,
  shapes,
}: {
  currentShape: Shape;
  setCurrentShape: (shape: Shape) => void;
  shapes: Shape[];
}) {
  return (
    <div className="absolute uppercase bg-neutral-800 p-1 rounded-md bottom-5   md:top-5 w-fit left-1/2 -translate-x-1/2  h-fit flex items-center gap-1 md:gap-2 ">
      {shapes.map((shape: Shape, index) => (
        <div
          key={index + shape}
          onClick={() => setCurrentShape(shape)}
          title={toTitleCase(shape)}
          className={cn(
            "px-2 py-1 cursor-pointer hover:bg-neutral-700 text-neutral-400 relative rounded-md p-[10px] ",
            currentShape === shape && "bg-neutral-700 text-neutral-50 "
          )}
        >
          <div className={cn("absolute bottom-0 right-[4px]  text-[10px]")}>
            {index + 1}
          </div>
          {shapeToIcon[shape]}
        </div>
      ))}
    </div>
  );
}
