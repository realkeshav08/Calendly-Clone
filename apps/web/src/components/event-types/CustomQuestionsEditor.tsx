'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface QuestionDraft {
  question: string;
  isRequired: boolean;
}

interface CustomQuestionsEditorProps {
  questions: QuestionDraft[];
  onChange: (questions: QuestionDraft[]) => void;
}

/** Editable list of custom invitee questions shown on the event type form. */
export function CustomQuestionsEditor({ questions, onChange }: CustomQuestionsEditorProps) {
  function update(index: number, patch: Partial<QuestionDraft>) {
    onChange(questions.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  }

  return (
    <div className="space-y-3">
      <Label>Custom questions</Label>
      {questions.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No custom questions. Invitees will only be asked for name and email.
        </p>
      )}
      {questions.map((q, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            value={q.question}
            placeholder="e.g. What would you like to discuss?"
            onChange={(e) => update(i, { question: e.target.value })}
          />
          <label className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={q.isRequired}
              onChange={(e) => update(i, { isRequired: e.target.checked })}
            />
            Required
          </label>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Remove question"
            onClick={() => onChange(questions.filter((_, idx) => idx !== i))}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...questions, { question: '', isRequired: false }])}
      >
        <Plus className="h-4 w-4" /> Add question
      </Button>
    </div>
  );
}
