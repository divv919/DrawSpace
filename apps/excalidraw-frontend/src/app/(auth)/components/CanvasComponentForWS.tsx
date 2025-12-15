"use client";

import { useEffect, useState } from "react";
import CanvasComponent from "./CanvasComponent";
import { WEBSOCKET_URL } from "@/config/variables";
import { Content } from "@/types/canvas";
import { fetchJSON } from "@/app/api/rooms";

type CreateMessage = Content & {
  tempId?: string;
  operation: "create";
  id: string;
};

type UpdateMessage = Content & {
  tempId?: string;
  operation: "update";
  id: string;
};
type DeleteMessage = Content & {
  tempId?: string;
  operation: "delete";
  id: string;
};
type WSMessage = UpdateMessage | DeleteMessage | CreateMessage;
function CanvasComponentForWS({
  slug,
  user,
}: {
  slug: string;
  user: {
    userId: undefined | string;
    access: "user" | "admin" | "moderator" | undefined;
  };
}) {
  const [socketConnection, setSocketConnection] = useState<WebSocket | null>(
    null
  );
  const [existingShapes, setExistingShapes] = useState<
    (Content & { id?: string; tempId?: string })[]
  >([]);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const handleCreateOperation = (
    message: Content & {
      tempId?: string;
      operation: "create";
      id: string;
    }
  ) => {
    const { tempId, operation, ...rest } = message;

    setExistingShapes((prev) => {
      // CASE 1: no tempId → normal create
      if (!tempId) {
        return [...prev, rest];
      }

      // CASE 2: reconcile temp shape
      const index = prev.findIndex((shape) => shape.tempId === tempId);

      if (index !== -1) {
        const updated = [...prev];
        updated[index] = {
          ...prev[index],
          ...rest,
        };
        return updated;
      }

      // CASE 3: tempId not found → append
      return [...prev, rest];
    });
  };
  const handleUpdateOperation = (
    message: Content & {
      tempId?: string;
      operation: "update";
      id: string;
    }
  ) => {
    const { operation, ...rest } = message;

    setExistingShapes((prev) => {
      const toChangeIndex = prev.findIndex((val) => val.id === message.id);
      if (toChangeIndex === -1) return [...prev];
      const updated = [...prev];
      updated[toChangeIndex] = rest;
      return updated;
    });
  };
  const handleDeleteOperation = (
    message: Content & {
      tempId?: string;
      operation: "delete";
      id: string;
    }
  ) => {
    setExistingShapes((prev) => prev.filter((val) => val.id !== message.id));
  };
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
        console.log({ responses: response.messages });
        setMessagesLoaded(true);
      } else {
        console.log("Error getting previous messages : ", response);
      }
    }
    getPreviousMessages();
  }, [slug]);

  //for test
  useEffect(() => {
    console.log({ existingShapes });
  }, [existingShapes]);

  useEffect(() => {
    if (!messagesLoaded) {
      return;
    }
    const socket = new WebSocket(`${WEBSOCKET_URL}`);
    socket.onopen = () => {
      setSocketConnection(socket);
    };
    socket.onmessage = (e: MessageEvent) => {
      const parsed = JSON.parse(e.data) as WSMessage;
      console.log("parsed message ", parsed);
      switch (parsed.operation) {
        case "create":
          handleCreateOperation(parsed);
          break;
        case "update":
          handleUpdateOperation(parsed);
          break;
        case "delete":
          handleDeleteOperation(parsed);
          break;
      }
    };
    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [messagesLoaded]);

  if (!messagesLoaded) {
    return <div>Loading canvas</div>;
  }
  if (!socketConnection) {
    return <div>Connecting to ws</div>;
  }
  return (
    <CanvasComponent
      user={user}
      existingShapes={existingShapes}
      socket={socketConnection}
      setExistingShapes={setExistingShapes}
    />
  );
}

export default CanvasComponentForWS;
