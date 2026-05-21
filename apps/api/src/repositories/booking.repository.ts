import { BookingStatus, Prisma, PrismaClient } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { ConflictError } from '../lib/errors';

/** Every booking is returned with the joined event type + host needed to render it. */
const bookingInclude = {
  eventType: { select: { id: true, title: true, slug: true, durationMinutes: true, color: true } },
  host: { select: { id: true, name: true, username: true, timezone: true } },
} satisfies Prisma.BookingInclude;

export type BookingWithRelations = Prisma.BookingGetPayload<{ include: typeof bookingInclude }>;

/** A booked interval as absolute UTC instants — the slot engine's conflict input. */
export interface BookingInterval {
  startTime: Date;
  endTime: Date;
}

/** Fields needed to create a booking; start/end are pre-computed UTC instants. */
export interface NewBooking {
  eventTypeId: string;
  hostId: string;
  inviteeName: string;
  inviteeEmail: string;
  inviteeTimezone: string;
  startTime: Date;
  endTime: Date;
  notes?: string | null;
  answers?: Prisma.InputJsonValue;
}

export interface IBookingRepository {
  findById(id: string): Promise<BookingWithRelations | null>;
  findByIdForHost(id: string, hostId: string): Promise<BookingWithRelations | null>;
  findManyByHost(hostId: string, filter: 'upcoming' | 'past'): Promise<BookingWithRelations[]>;
  findHostIntervalsBetween(hostId: string, from: Date, to: Date): Promise<BookingInterval[]>;
  countByEventType(eventTypeId: string): Promise<number>;
  updateStatus(
    id: string,
    status: BookingStatus,
    extra?: { cancellationReason?: string | null; cancelledAt?: Date },
  ): Promise<BookingWithRelations>;
  createIfSlotFree(data: NewBooking): Promise<BookingWithRelations>;
}

export class BookingRepository extends BaseRepository implements IBookingRepository {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  findById(id: string): Promise<BookingWithRelations | null> {
    return this.prisma.booking.findUnique({ where: { id }, include: bookingInclude });
  }

  findByIdForHost(id: string, hostId: string): Promise<BookingWithRelations | null> {
    return this.prisma.booking.findFirst({ where: { id, hostId }, include: bookingInclude });
  }

  /**
   * Meetings for the dashboard. Both tabs show only CONFIRMED bookings — a
   * cancelled or rescheduled booking is no longer an active meeting, so it drops
   * off both lists (the soft-deleted row is retained for history/audit).
   */
  findManyByHost(hostId: string, filter: 'upcoming' | 'past'): Promise<BookingWithRelations[]> {
    const now = new Date();
    const isUpcoming = filter === 'upcoming';
    return this.prisma.booking.findMany({
      where: {
        hostId,
        status: 'CONFIRMED',
        startTime: isUpcoming ? { gte: now } : { lt: now },
      },
      orderBy: { startTime: isUpcoming ? 'asc' : 'desc' },
      include: bookingInclude,
    });
  }

  /**
   * Active reservations overlapping a UTC window — the slot engine's conflict
   * input. Only CONFIRMED bookings hold a slot; cancelling or rescheduling frees it.
   */
  findHostIntervalsBetween(hostId: string, from: Date, to: Date): Promise<BookingInterval[]> {
    return this.prisma.booking.findMany({
      where: { hostId, status: 'CONFIRMED', startTime: { lt: to }, endTime: { gt: from } },
      select: { startTime: true, endTime: true },
    });
  }

  countByEventType(eventTypeId: string): Promise<number> {
    return this.prisma.booking.count({ where: { eventTypeId } });
  }

  updateStatus(
    id: string,
    status: BookingStatus,
    extra?: { cancellationReason?: string | null; cancelledAt?: Date },
  ): Promise<BookingWithRelations> {
    return this.prisma.booking.update({
      where: { id },
      data: { status, ...extra },
      include: bookingInclude,
    });
  }

  /**
   * Atomically inserts a booking only if no overlapping, non-cancelled booking
   * exists for the host. The overlap re-check and the insert run in a SERIALIZABLE
   * transaction (see {@link BaseRepository.runSerializable}); a lost race surfaces
   * either as our explicit {@link ConflictError} or as Postgres serialization
   * failure P2034, which we normalize to the same ConflictError.
   *
   * We use this instead of a unique index because conflicts are interval *overlaps*
   * (durations + buffers differ), which a unique constraint cannot express.
   */
  async createIfSlotFree(data: NewBooking): Promise<BookingWithRelations> {
    try {
      return await this.runSerializable(async (tx) => {
        const overlap = await tx.booking.findFirst({
          where: {
            hostId: data.hostId,
            status: 'CONFIRMED',
            startTime: { lt: data.endTime },
            endTime: { gt: data.startTime },
          },
          select: { id: true },
        });
        if (overlap) throw new ConflictError();
        return tx.booking.create({ data, include: bookingInclude });
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2034') {
        throw new ConflictError();
      }
      throw err;
    }
  }
}
