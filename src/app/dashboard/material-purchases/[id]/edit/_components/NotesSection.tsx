'use client';

import { format, parseISO } from 'date-fns';
import { MessageSquare, User } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface Note {
  id: string;
  text: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

interface NotesSectionProps {
  notes?: Note[];
}

export function NotesSection({ notes }: NotesSectionProps) {
  if (!notes || notes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No notes yet. Add a note to start tracking comments.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notes.map((note) => (
        <Card key={note.id} className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{note.createdByName}</span>
                <span className="text-xs text-muted-foreground">
                  {format(parseISO(note.createdAt), 'MMM dd, yyyy h:mm a')}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{note.text}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}