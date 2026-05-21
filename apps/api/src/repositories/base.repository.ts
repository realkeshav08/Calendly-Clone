import { Prisma, PrismaClient } from '@prisma/client';

/** A Prisma client or an in-transaction client — repository methods accept either. */
export type Db = PrismaClient | Prisma.TransactionClient;

/**
 * Abstract base for all repositories.
 *
 * Demonstrates two ideas the rest of the data layer builds on:
 *  - **Encapsulation**: every concrete repository receives the PrismaClient here
 *    and exposes only intention-revealing methods, so no service ever touches
 *    Prisma directly.
 *  - **Inheritance**: shared persistence concerns (notably running a Serializable
 *    transaction) live here once and are reused by subclasses via `runSerializable`.
 */
export abstract class BaseRepository {
  protected constructor(protected readonly prisma: PrismaClient) {}

  /**
   * Runs `work` inside a SERIALIZABLE transaction. Used by the booking flow to make
   * the "no overlapping booking exists" check and the insert atomic — the strongest
   * isolation level, so concurrent bookings for the same slot can't both succeed.
   */
  protected runSerializable<T>(work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(work, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  }
}
