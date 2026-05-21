'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createEventTypeSchema, type CreateEventTypeInput } from 'shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { DURATION_OPTIONS, EVENT_COLORS } from '@/lib/constants';
import { useSchedules } from '@/hooks/useAvailability';
import { CustomQuestionsEditor, type QuestionDraft } from './CustomQuestionsEditor';
import type { EventType } from '@/types/api';
import { ApiError } from '@/lib/api';

interface EventTypeFormProps {
  /** Existing event type when editing; omitted when creating. */
  initial?: EventType;
  onSubmit: (data: CreateEventTypeInput) => Promise<unknown>;
  submitLabel: string;
}

/** Generates a URL-safe slug from a free-text title. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Create/edit form for an event type. Validation reuses the shared Zod schema, so
 * the client enforces exactly the same rules the API does. Custom questions are
 * managed as local state and merged into the payload on submit.
 */
export function EventTypeForm({ initial, onSubmit, submitLabel }: EventTypeFormProps) {
  const router = useRouter();
  const { data: schedules } = useSchedules();
  const [questions, setQuestions] = useState<QuestionDraft[]>(
    initial?.customQuestions.map((q) => ({ question: q.question, isRequired: q.isRequired })) ?? [],
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateEventTypeInput>({
    resolver: zodResolver(createEventTypeSchema),
    defaultValues: {
      title: initial?.title ?? '',
      slug: initial?.slug ?? '',
      description: initial?.description ?? '',
      durationMinutes: initial?.durationMinutes ?? 30,
      color: initial?.color ?? EVENT_COLORS[0],
      bufferBeforeMins: initial?.bufferBeforeMins ?? 0,
      bufferAfterMins: initial?.bufferAfterMins ?? 0,
      scheduleId: initial?.scheduleId ?? undefined,
      isActive: initial?.isActive ?? true,
    },
  });

  const color = watch('color');
  const duration = watch('durationMinutes');
  const scheduleId = watch('scheduleId');

  async function submit(values: CreateEventTypeInput) {
    setSubmitError(null);
    const payload: CreateEventTypeInput = {
      ...values,
      // Fall back to a slug derived from the title if the field is empty.
      slug: values.slug || slugify(values.title),
      customQuestions: questions
        .filter((q) => q.question.trim())
        .map((q, order) => ({ ...q, order })),
    };
    try {
      await onSubmit(payload);
      router.push('/event-types');
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Something went wrong.');
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6">
      {submitError && (
        <Alert variant="destructive">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Event name</Label>
        <Input
          id="title"
          {...register('title')}
          placeholder="30 Minute Meeting"
          onBlur={(e) => {
            if (!watch('slug')) setValue('slug', slugify(e.target.value));
          }}
        />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">URL slug</Label>
        <Input id="slug" {...register('slug')} placeholder="30min" />
        {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="What is this meeting about?"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Duration</Label>
          <Select
            value={String(duration)}
            onValueChange={(v) => setValue('durationMinutes', Number(v))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DURATION_OPTIONS.map((d) => (
                <SelectItem key={d} value={String(d)}>
                  {d} minutes
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Availability schedule</Label>
          <Select value={scheduleId ?? ''} onValueChange={(v) => setValue('scheduleId', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Use default schedule" />
            </SelectTrigger>
            <SelectContent>
              {schedules?.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                  {s.isDefault ? ' (default)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Color</Label>
        <div className="flex gap-2">
          {EVENT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Select color ${c}`}
              onClick={() => setValue('color', c)}
              className={cn(
                'h-8 w-8 rounded-full border-2 transition',
                color === c ? 'border-foreground' : 'border-transparent',
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="bufferBefore">Buffer before (min)</Label>
          <Input
            id="bufferBefore"
            type="number"
            min={0}
            {...register('bufferBeforeMins', { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bufferAfter">Buffer after (min)</Label>
          <Input
            id="bufferAfter"
            type="number"
            min={0}
            {...register('bufferAfterMins', { valueAsNumber: true })}
          />
        </div>
      </div>

      <CustomQuestionsEditor questions={questions} onChange={setQuestions} />

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/event-types')}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
