import { Prisma, PrismaClient } from '@prisma/client';
import { BaseRepository } from './base.repository';
import type { CustomQuestionInput } from 'shared';

/** Event type always loaded with its custom questions in display order. */
const withQuestions = {
  customQuestions: { orderBy: { order: 'asc' } },
} satisfies Prisma.EventTypeInclude;

export type EventTypeWithQuestions = Prisma.EventTypeGetPayload<{ include: typeof withQuestions }>;

export interface IEventTypeRepository {
  findManyByUser(userId: string): Promise<EventTypeWithQuestions[]>;
  findByIdForUser(id: string, userId: string): Promise<EventTypeWithQuestions | null>;
  findActiveBySlug(userId: string, slug: string): Promise<EventTypeWithQuestions | null>;
  create(
    userId: string,
    data: Prisma.EventTypeCreateWithoutUserInput,
    questions?: CustomQuestionInput[],
  ): Promise<EventTypeWithQuestions>;
  update(
    id: string,
    data: Prisma.EventTypeUpdateInput,
    questions?: CustomQuestionInput[],
  ): Promise<EventTypeWithQuestions>;
  delete(id: string): Promise<void>;
}

export class EventTypeRepository extends BaseRepository implements IEventTypeRepository {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  findManyByUser(userId: string): Promise<EventTypeWithQuestions[]> {
    return this.prisma.eventType.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: withQuestions,
    });
  }

  findByIdForUser(id: string, userId: string): Promise<EventTypeWithQuestions | null> {
    return this.prisma.eventType.findFirst({ where: { id, userId }, include: withQuestions });
  }

  findActiveBySlug(userId: string, slug: string): Promise<EventTypeWithQuestions | null> {
    return this.prisma.eventType.findFirst({
      where: { userId, slug, isActive: true },
      include: withQuestions,
    });
  }

  create(
    userId: string,
    data: Prisma.EventTypeCreateWithoutUserInput,
    questions?: CustomQuestionInput[],
  ): Promise<EventTypeWithQuestions> {
    return this.prisma.eventType.create({
      data: {
        ...data,
        user: { connect: { id: userId } },
        customQuestions: questions?.length ? { create: questions } : undefined,
      },
      include: withQuestions,
    });
  }

  /**
   * Updates the event type and, when `questions` is provided, replaces the whole
   * custom-question set (delete + recreate) atomically — replace-all semantics that
   * let the client manage the list declaratively.
   */
  update(
    id: string,
    data: Prisma.EventTypeUpdateInput,
    questions?: CustomQuestionInput[],
  ): Promise<EventTypeWithQuestions> {
    return this.prisma.$transaction(async (tx) => {
      if (questions) {
        await tx.customQuestion.deleteMany({ where: { eventTypeId: id } });
        if (questions.length) {
          await tx.customQuestion.createMany({
            data: questions.map((q) => ({ ...q, eventTypeId: id })),
          });
        }
      }
      return tx.eventType.update({ where: { id }, data, include: withQuestions });
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.eventType.delete({ where: { id } });
  }
}
