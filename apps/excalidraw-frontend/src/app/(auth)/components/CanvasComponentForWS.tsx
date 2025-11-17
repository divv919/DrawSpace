"use client";

import { useEffect, useRef, useState } from "react";
import CanvasComponent from "./CanvasComponent";
import { WEBSOCKET_URL } from "@/config/variables";
import { Content } from "@/types/canvas";
import { fetchJSON } from "@/app/api/rooms";

function CanvasComponentForWS({ slug }: { slug: string }) {
  const [socketConnection, setSocketConnection] = useState<WebSocket | null>(
    null
  );
  const [existingShapes, setExistingShapes] = useState<Content[]>([]);

  useEffect(() => {
    console.log("slug : ", slug);
    async function getPreviousMessages() {
      const response = await fetchJSON<{
        messages: Content[];
        success: boolean;
      }>(`/contents/${slug}`, {
        method: "GET",
        credentials: "include",
      });
      if (response.success) {
        setExistingShapes(response.messages);
      } else {
        console.log("Error getting previous messages : ", response);
      }
    }
    getPreviousMessages();
  }, [slug]);

  useEffect(() => {
    const socket = new WebSocket(`${WEBSOCKET_URL}`);
    socket.onopen = () => {
      setSocketConnection(socket);
    };
    socket.onmessage = (e: MessageEvent) => {
      const parsed = JSON.parse(e.data) as { message: Content };
      setExistingShapes((prev) => [...prev, parsed.message]);
    };
  }, [existingShapes]);

  if (!socketConnection) {
    return <div>Connecting to ws</div>;
  }
  return (
    <CanvasComponent
      existingShapes={existingShapes}
      socket={socketConnection}
      setExistingShapes={setExistingShapes}
    />
  );
}

export default CanvasComponentForWS;
