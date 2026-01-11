'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useFirestore } from '@/firebase';
import { doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Note {
  id: string;
  text: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

interface AddNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseId: string;
  onNoteAdded?: () => void;
}

export function AddNoteDialog({ open, onOpenChange, purchaseId, onNoteAdded }: AddNoteDialogProps) {
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const firestore = useFirestore();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim() || !user) return;

    setIsSaving(true);
    try {
      const noteData: Note = {
        id: `note_${Date.now()}`,
        text: note.trim(),
        createdBy: user.id,
        createdByName: user.name,
        createdAt: new Date().toISOString(),
      };

      const purchaseRef = doc(firestore, 'materialPurchases', purchaseId);
      await updateDoc(purchaseRef, {
        notes: arrayUnion(noteData),
        updatedAt: serverTimestamp(),
      });

      toast({
        title: "Success",
        description: "Note added successfully",
      });
      setNote('');
      onOpenChange(false);
      onNoteAdded?.();
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: "Error",
        description: "Failed to add note",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
            <DialogDescription>
              Add a note or comment to this purchase order. Notes are visible to all team members.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="note">Note</Label>
              <Textarea
                id="note"
                placeholder="Enter your note here..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={5}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || !note.trim()}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Note'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}