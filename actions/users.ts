'use server';

import { addEvent } from '~/actions/activityFeed';
import { safeRevalidateTag } from '~/lib/cache';
import { prisma } from '~/lib/db';
import { createUserSchema } from '~/schemas/auth';
import { auth, requireApiAuth } from '~/utils/auth';

export async function getUsers() {
  await requireApiAuth();
  return prisma.user.findMany({
    select: { id: true, username: true },
    orderBy: { username: 'asc' },
  });
}

export async function createUser(data: unknown) {
  await requireApiAuth();

  const parsed = createUserSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.flatten(),
    };
  }

  const { username, password } = parsed.data;

  try {
    await auth.createUser({
      key: {
        providerId: 'username',
        providerUserId: username,
        password,
      },
      attributes: {
        username,
        networkId: null,
      },
    });

    void addEvent('User Created', `Created user "${username}"`);
    safeRevalidateTag('getUsers');

    return { success: true, error: null };
  } catch (error) {
    return {
      success: false,
      error: 'Username already exists',
    };
  }
}

export async function deleteUser(userId: string) {
  const session = await requireApiAuth();

  // Prevent deleting yourself
  if (session.user.userId === userId) {
    return {
      success: false,
      error: 'You cannot delete your own account',
    };
  }

  // Prevent deleting the last user
  const count = await prisma.user.count();
  if (count <= 1) {
    return {
      success: false,
      error: 'Cannot delete the last user',
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true },
  });

  if (!user) {
    return {
      success: false,
      error: 'User not found',
    };
  }

  await prisma.user.delete({ where: { id: userId } });

  void addEvent('User Deleted', `Deleted user "${user.username}"`);
  safeRevalidateTag('getUsers');

  return { success: true, error: null };
}
