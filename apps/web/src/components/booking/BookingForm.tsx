'use client';

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { PublicEvent } from '@/types/api';
import type { CreateBookingInput } from 'shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

/** Form-only fields; startTime and timezone are supplied by the page. */
const formSchema = z.object({
  inviteeName: z.string().min(1, 'Name is required'),
  inviteeEmail: z.string().email('Enter a valid email'),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof formSchema>;

interface BookingFormProps {
  event: PublicEvent;
  submitting: boolean;
  errorMessage: string | null;
  onBack: () => void;
  onSubmit: (
    data: Pick<CreateBookingInput, 'inviteeName' | 'inviteeEmail' | 'notes' | 'answers'>,
  ) => void;
}

/**
 * Final booking step: invitee details plus any custom questions. Custom-question
 * answers are tracked separately and assembled into the API's `answers` array on
 * submit; required questions are enforced client-side before calling onSubmit.
 */
export function BookingForm({
  event,
  submitting,
  errorMessage,
  onBack,
  onSubmit,
}: BookingFormProps) {
  const questions = event.eventType.customQuestions;
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [answerError, setAnswerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema) });

  function submit(values: FormValues) {
    const missing = questions.find((q) => q.isRequired && !answers[q.id]?.trim());
    if (missing) {
      setAnswerError(`Please answer: "${missing.question}"`);
      return;
    }
    setAnswerError(null);
    onSubmit({
      inviteeName: values.inviteeName,
      inviteeEmail: values.inviteeEmail,
      notes: values.notes || null,
      answers: questions.map((q) => ({
        questionId: q.id,
        question: q.question,
        answer: answers[q.id] ?? '',
      })),
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <h3 className="mb-4 text-xl font-bold text-foreground">Enter Details</h3>

      {(errorMessage || answerError) && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{errorMessage ?? answerError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(submit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="inviteeName">Name *</Label>
          <Input id="inviteeName" {...register('inviteeName')} />
          {errors.inviteeName && (
            <p className="text-sm text-destructive">{errors.inviteeName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="inviteeEmail">Email *</Label>
          <Input id="inviteeEmail" type="email" {...register('inviteeEmail')} />
          {errors.inviteeEmail && (
            <p className="text-sm text-destructive">{errors.inviteeEmail.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">
            Please share anything that will help prepare for our meeting
          </Label>
          <Textarea id="notes" {...register('notes')} />
        </div>

        {questions.map((q) => (
          <div key={q.id} className="space-y-2">
            <Label htmlFor={`q-${q.id}`}>
              {q.question} {q.isRequired && '*'}
            </Label>
            <Textarea
              id={`q-${q.id}`}
              value={answers[q.id] ?? ''}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
            />
          </div>
        ))}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Scheduling…' : 'Schedule Event'}
        </Button>
      </form>
    </div>
  );
}
