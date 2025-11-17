"use client";

import createCanvas from "@/app/lib/draw";
import { Content } from "@/types/canvas";
import { useState, useRef, useEffect } from "react";

const CanvasComponent = ({
  existingShapes,
  socket,
  setExistingShapes,
}: {
  existingShapes: Content[];
  setExistingShapes: React.Dispatch<React.SetStateAction<Content[]>>;
  socket: WebSocket;
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canvas, setCanvas] = useState<ReturnType<typeof createCanvas> | null>(
    null
  );
  const [currentColor, setCurrentColor] =
    useState<CanvasRenderingContext2D["strokeStyle"]>("white");
  const [currentShape, setCurrentShape] =
    useState<Content["type"]>("rectangle");
  const [startXY, setStartXY] = useState({ clientX: 0, clientY: 0 });
  const [clicked, setClicked] = useState(false);

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      setCanvas(createCanvas(canvas));
    }
  }, [canvasRef.current]);

  useEffect(() => {
    if (!canvas) {
      return;
    }
    canvas.clearCanvas();
    existingShapes.map((shape: Content) => {
      const { clientX, clientY, height, width } = shape;

      canvas.drawRect(
        clientX ?? 0,
        clientY ?? 0,
        width ?? 0,
        height ?? 0,
        currentColor
      );
    });
  }, [existingShapes, canvas]);

  const handleMove = (e: React.MouseEvent) => {
    // console.log("x moved : ", e.clientX, " y moved : ", e.clientY);
    if (!canvas || !clicked) {
      return;
    }
    canvas.clearCanvas();
    existingShapes.map((shapeAsString: Content) => {
      const { clientX, clientY, height, width } = shapeAsString;
      canvas.drawRect(
        clientX ?? 0,
        clientY ?? 0,
        width ?? 0,
        height ?? 0,
        currentColor
      );
    });
    const height = e.clientY - startXY.clientY;
    const width = e.clientX - startXY.clientX;

    canvas.drawRect(
      startXY.clientX,
      startXY.clientY,
      width,
      height,
      currentColor
    );
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    setClicked(false);
    const { clientX, clientY } = e;
    const height = clientY - startXY.clientY;
    const width = clientX - startXY.clientX;
    setExistingShapes((prev) => [
      ...prev,
      {
        type: currentShape,
        height,
        width,
        clientX: startXY.clientX,
        clientY: startXY.clientY,
      },
    ]);
    socket.send(
      JSON.stringify({
        type: currentShape,
        height,
        width,
        clientX: startXY.clientX,
        clientY: startXY.clientY,
      })
    );
  };

  return (
    <div className="h-screen w-screen overflow-scroll scrollbar-none">
      <canvas
        onMouseDown={({ clientX, clientY }) => {
          console.log("x start : ", clientX, " y start : ", clientY);
          setStartXY({ clientX, clientY });
          setClicked(true);
        }}
        onMouseMove={handleMove}
        ref={canvasRef}
        width={innerWidth}
        height={innerHeight}
        onMouseUp={handleMouseUp}
      />
    </div>
  );
};
export default CanvasComponent;
