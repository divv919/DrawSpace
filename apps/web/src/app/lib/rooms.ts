import { BACKEND_BASE_URL } from "@/config/variables";
import {
  CreateRoomRequest,
  CreateRoomResponse,
  GetRoomsResponse,
  Room,
} from "@/types/rooms";

export const fetchJSON = async <T>(
  url: string,
  options: RequestInit
): Promise<T> => {
  const response = await fetch(`${BACKEND_BASE_URL}${url}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });
  if (!response.ok) {
    throw new Error(response.statusText);
  }
  return response.json() as Promise<T>;
};

export const getRooms = async (
  options?: RequestInit
): Promise<GetRoomsResponse> => {
  return fetchJSON<GetRoomsResponse>("/getRooms", {
    method: "GET",
    credentials: "include",
    ...options,
  });
};

export const createRoom = async (
  room: CreateRoomRequest
): Promise<CreateRoomResponse> => {
  return fetchJSON<CreateRoomResponse>("/createRoom", {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(room),
  });
};
