import { NotFoundError } from '../../lib/errors';
import type { IUserRepository, PublicUser } from '../../repositories/user.repository';
import type { UpdateUserInput } from 'shared';

/**
 * Application logic for the current user's profile. Depends on the
 * {@link IUserRepository} abstraction (Dependency Inversion) rather than Prisma,
 * so it can be unit-tested with a fake repository.
 */
export class UserService {
  constructor(private readonly users: IUserRepository) {}

  async getById(id: string): Promise<PublicUser> {
    const user = await this.users.findById(id);
    if (!user) throw new NotFoundError('User not found');
    return user;
  }

  update(id: string, data: UpdateUserInput): Promise<PublicUser> {
    return this.users.update(id, data);
  }
}
