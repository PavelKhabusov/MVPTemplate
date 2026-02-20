import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { mmkvStorage } from '@mvp/lib'

export interface Note {
  id: string
  text: string
  createdAt: number
}

interface NotesState {
  notes: Note[]
  addNote: (text: string) => void
  deleteNote: (id: string) => void
  updateNote: (id: string, text: string) => void
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set) => ({
      notes: [],
      addNote: (text: string) => {
        const note: Note = {
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          text,
          createdAt: Date.now(),
        }
        set((state) => ({ notes: [note, ...state.notes] }))
      },
      deleteNote: (id: string) => {
        set((state) => ({ notes: state.notes.filter((n) => n.id !== id) }))
      },
      updateNote: (id: string, text: string) => {
        set((state) => ({
          notes: state.notes.map((n) => (n.id === id ? { ...n, text } : n)),
        }))
      },
    }),
    {
      name: 'notes-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
)
