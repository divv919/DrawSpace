import { prismaClient } from "@repo/db";

export async function slugToRoom(slug: string) {
  const response = await prismaClient.room.findFirst({
    where: {
      slug,
    },
  });
  return response;
}
