import { Prisma, PrismaClient, User } from '@prisma/client';
import { BaseRepository } from './base.repository';

/** Public-safe subset of user fields returned to clients. */
const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  username: true,
  timezone: true,
} satisfies Prisma.UserSelect;

export type PublicUser = Prisma.UserGetPayload<{ select: typeof publicUserSelect }>;

/** Host profile joined with the host's active event types (for /:username). */
const profileInclude = {
  eventTypes: {
    where: { isActive: true },
    orderBy: { durationMinutes: 'asc' },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      durationMinutes: true,
      color: true,
    },
  },
} satisfies Prisma.UserInclude;

export type UserWithEvents = Prisma.UserGetPayload<{ include: typeof profileInclude }>;

/**
 * Abstraction (DIP): services depend on this interface, not on Prisma. A different
 * data store could implement it without changing a single service.
 */
export interface IUserRepository {
  findById(id: string): Promise<PublicUser | null>;
  findRawById(id: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findByUsernameWithActiveEvents(username: string): Promise<UserWithEvents | null>;
  update(id: string, data: Prisma.UserUpdateInput): Promise<PublicUser>;
}

export class UserRepository extends BaseRepository implements IUserRepository {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  findById(id: string): Promise<PublicUser | null> {
    return this.prisma.user.findUnique({ where: { id }, select: publicUserSelect });
  }

  /** Full record — used by the auth-stub middleware to resolve the current user. */
  findRawById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { username } });
  }

  findByUsernameWithActiveEvents(username: string): Promise<UserWithEvents | null> {
    return this.prisma.user.findUnique({ where: { username }, include: profileInclude });
  }

  update(id: string, data: Prisma.UserUpdateInput): Promise<PublicUser> {
    return this.prisma.user.update({ where: { id }, data, select: publicUserSelect });
  }
}
