import { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type NotificationInput = {
  type: NotificationType;
  title: string;
  body?: string;
  href: string;
  actorId?: string;
};

export async function createNotifications(userIds: string[], input: NotificationInput) {
  const recipients = [...new Set(userIds)].filter((userId) => userId !== input.actorId);
  if (!recipients.length) return;

  await prisma.notification.createMany({
    data: recipients.map((userId) => ({
      userId,
      type: input.type,
      title: input.title,
      body: input.body,
      href: input.href,
    })),
  });
}

export async function getProjectMemberIds(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      creatorId: true,
      members: { select: { userId: true } },
    },
  });

  if (!project) return [];
  return [project.creatorId, ...project.members.map((member) => member.userId)];
}

export async function notifyProjectMembers(
  projectId: string,
  input: NotificationInput,
) {
  const userIds = await getProjectMemberIds(projectId);
  await createNotifications(userIds, input);
}
