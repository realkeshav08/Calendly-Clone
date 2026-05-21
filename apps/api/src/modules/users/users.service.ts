import { prisma } from '../../lib/prisma';
import { NotFoundError } from '../../lib/errors';
import type { UpdateUserInput } from 'shared';

/** Returns the public-safe profile for a user, or throws if missing. */
export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, username: true, timezone: true },
  });
  if (!user) throw new NotFoundError('User not found');
  return user;
}

/** Updates the current user's editable profile fields. */
export async function updateUser(id: string, data: UpdateUserInput) {
  return prisma.user.update({
    where: { id },
    data,
    select: { id: true, email: true, name: true, username: true, timezone: true },
  });
}
