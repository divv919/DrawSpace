import { BACKEND_BASE_URL } from "@/config/variables";
import {
  CreateRoomRequest,
  CreateRoomResponse,
  GetRoomsResponse,
} from "@/types/rooms";
import { getSession } from "next-auth/react";

export const fetchJSON = async <T>(
  url: string,
  options: RequestInit
): Promise<T> => {
  const session = await getSession();
  let header = null;
  if (session && session.user && session.user.accessToken) {
    header = session.user.accessToken;
  }

  console.log("header is ", header);
  const response = await fetch(`${BACKEND_BASE_URL}${url}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(header ? { Authorization: `Bearer ${header}` } : {}),
      ...(options?.headers || {}),
    },
  });
  if (!response.ok) {
    new Error(response.statusText);
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
