export interface Room {
  id: string;
  slug: string;
  name: string;
  inviteLink?: string;
  isProtected?: boolean;
  adminId?: string;
}

export interface CreateRoomRequest {
  name: string;
  isProtected?: boolean;
  password?: string;
}

export interface CreateRoomResponse {
  slug: string;
  inviteLink: string;
  message: string;
}

export interface GetRoomsResponse {
  rooms: Room[];
  success: boolean;
  message: string;
}
