"use client";

import { useEffect, useState } from "react";
import CanvasComponent from "./CanvasComponent";
import { WEBSOCKET_URL } from "@/config/variables";
import { Content } from "@/types/canvas";
import { fetchJSON } from "@/app/lib/rooms";
import { RevealLogo, RoomUser } from "@/app/(canvas)/canvas/[slug]/page";
import { OctagonAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import Dialog, {
  DialogActions,
  DialogBackground,
  DialogContent,
  DialogTitle,
} from "@/app/components/ui/Dialog";
import { Button } from "@/app/components/ui/Button";

type CreateMessage = Content & {
  channel: "canvas";
  tempId?: string;
  operation: "create";
  id: string;
};

type UpdateMessage = Content & {
  channel: "canvas";

  tempId?: string;
  operation: "update";
  id: string;
};
type DeleteMessage = Content & {
  channel: "canvas";

  tempId?: string;
  operation: "delete";
  id: string;
};
type BanMessage = {
  channel: "room_control";
  operation: "ban_user";
  ban: boolean;
  targetUserId: string;
  roomId: string;
  username: string;
};
type IsOnlineMessage = {
  channel: "room_control";
  operation: "is_online";
  isBanned: boolean;
  username: string;
  role: "user" | "admin" | "moderator";
  isOnline: boolean;
  userId: string;
};
type ChangeRoleMessage = {
  channel: "room_control";
  operation: "change_role";
  new_role: "user" | "admin" | "moderator";
  targetUserId: string;
  roomId: string;
  username: string;
};
type InitialMessage = {
  channel: "room_control";
  operation: "initial";
  onlineUsers: string[];
  roomName: string;
};
type RoomControlMessage =
  | BanMessage
  | IsOnlineMessage
  | ChangeRoleMessage
  | InitialMessage;
type CanvasMessage = UpdateMessage | DeleteMessage | CreateMessage;
type WSMessage = CanvasMessage | RoomControlMessage;

function CanvasComponentForWS({
  slug,
  user,
  roomUsers,
  setRoomUsers,
  setIsFullyLoaded,
}: {
  slug: string;
  user: {
    userId: undefined | string;
    access: "user" | "admin" | "moderator" | undefined;
    username: string | undefined;
  };
  roomUsers: RoomUser[];
  setRoomUsers: React.Dispatch<React.SetStateAction<RoomUser[]>>;
  setIsFullyLoaded: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const router = useRouter();
  const [socketConnection, setSocketConnection] = useState<WebSocket | null>(
    null
  );
  const [existingShapes, setExistingShapes] = useState<
    (Content & { id?: string; tempId?: string })[]
  >([]);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [isDisconnected, setIsDisconnected] = useState(false);
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
  const handleBanUserOperation = (message: BanMessage) => {
    if (message.targetUserId === user.userId) {
      setIsDisconnected(true);
      return;
    }

    setRoomUsers((prev) =>
      prev.map((user) => {
        if (user.username === message.username) {
          return {
            ...user,
            isBanned: message.ban,
          };
        }
        return user;
      })
    );
  };
  const handleChangeRoleOperation = (message: ChangeRoleMessage) => {
    if (message.targetUserId === user.userId) {
      setIsDisconnected(true);
      return;
    }
    console.log("old users are ", roomUsers);

    setRoomUsers((prev) =>
      prev.map((user) => {
        if (user.username === message.username) {
          return {
            ...user,
            role: message.new_role,
          };
        }
        return user;
      })
    );
  };
  const handleInitialOperation = (message: InitialMessage) => {
    console.log("initial message is ", message);
    setRoomUsers((prev) =>
      prev.map((user) => {
        if (message.onlineUsers.includes(user.username)) {
          return {
            ...user,
            isOnline: true,
          };
        }
        return user;
      })
    );
  };
  const handleIsOnlineOperation = (message: IsOnlineMessage) => {
    setRoomUsers((prev) => {
      const exists = prev.some((user) => user.userId === message.userId);
      if (!exists) {
        console.log("exists or not ", exists, message, prev);
        const newUser: RoomUser = {
          isBanned: message.isBanned,
          isOnline: message.isOnline,
          username: message.username,
          role: message.role,
          userId: message.userId,
        };
        return [...prev, newUser];
      }
      return prev.map((user) => {
        if (user.userId === message.userId) {
          return {
            ...user,
            isOnline: message.isOnline,
          };
        }
        return user;
      });
    });
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
      switch (parsed.channel) {
        case "room_control":
          switch (parsed.operation) {
            case "ban_user":
              handleBanUserOperation(parsed);
              break;
            case "change_role":
              handleChangeRoleOperation(parsed);
              break;
            case "is_online":
              handleIsOnlineOperation(parsed);
              break;
            case "initial":
              handleInitialOperation(parsed);
              break;
          }
          break;
        case "canvas":
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
          break;
        default:
          break;
      }
    };
    socket.onclose = () => {
      setIsDisconnected(true);
      // setSocketConnection(null);
      setRoomUsers([]);
      setExistingShapes([]);
      // setMessagesLoaded(false);
    };
    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [messagesLoaded]);
  useEffect(() => {
    if (socketConnection && messagesLoaded) {
      setIsFullyLoaded(true);
    }
  }, [socketConnection, messagesLoaded]);
  if (!socketConnection || !messagesLoaded) {
    return (
      <div className="w-full h-full min-h-screen flex flex-col items-center justify-center gap-3">
        <RevealLogo />
      </div>
    );
  }
  return (
    <div className="relative h-screen w-screen">
      {isDisconnected && (
        <DialogBackground>
          <Dialog>
            <DialogTitle>Disconnected From Server</DialogTitle>
            <DialogContent>
              You have been disconnected from the server.
            </DialogContent>
            <DialogActions>
              <Button
                variant="secondary"
                onClick={() => router.push("/dashboard")}
              >
                Home
              </Button>
              <Button
                variant="primary"
                onClick={() => window.location.reload()}
              >
                Reconnect
              </Button>
            </DialogActions>
          </Dialog>
        </DialogBackground>
      )}
      <CanvasComponent
        roomUsers={roomUsers}
        user={user}
        existingShapes={existingShapes}
        socket={socketConnection}
        setExistingShapes={setExistingShapes}
      />
    </div>
  );
}

export default CanvasComponentForWS;
