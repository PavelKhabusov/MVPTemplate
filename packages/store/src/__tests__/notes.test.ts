import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@mvp/lib', () => ({
  mmkvStorage: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}))

import { useNotesStore } from '../notes'

const initialState = useNotesStore.getState()

describe('useNotesStore', () => {
  beforeEach(() => {
    useNotesStore.setState(initialState, true)
  })

  it('should start with empty notes', () => {
    expect(useNotesStore.getState().notes).toEqual([])
  })

  it('should add a note with generated id and createdAt', () => {
    useNotesStore.getState().addNote('Hello world')

    const notes = useNotesStore.getState().notes
    expect(notes).toHaveLength(1)
    expect(notes[0].text).toBe('Hello world')
    expect(notes[0].id).toBeTruthy()
    expect(notes[0].createdAt).toBeGreaterThan(0)
  })

  it('should prepend new notes (newest first)', () => {
    useNotesStore.getState().addNote('First')
    useNotesStore.getState().addNote('Second')

    const notes = useNotesStore.getState().notes
    expect(notes).toHaveLength(2)
    expect(notes[0].text).toBe('Second')
    expect(notes[1].text).toBe('First')
  })

  it('should delete a note by id', () => {
    useNotesStore.getState().addNote('To delete')
    const id = useNotesStore.getState().notes[0].id

    useNotesStore.getState().deleteNote(id)
    expect(useNotesStore.getState().notes).toHaveLength(0)
  })

  it('should update a note text by id', () => {
    useNotesStore.getState().addNote('Original')
    const id = useNotesStore.getState().notes[0].id

    useNotesStore.getState().updateNote(id, 'Updated')
    expect(useNotesStore.getState().notes[0].text).toBe('Updated')
  })

  it('should not affect other notes when deleting one', () => {
    useNotesStore.getState().addNote('Keep')
    useNotesStore.getState().addNote('Delete me')

    const toDelete = useNotesStore.getState().notes[0] // "Delete me" (prepended)
    useNotesStore.getState().deleteNote(toDelete.id)

    const notes = useNotesStore.getState().notes
    expect(notes).toHaveLength(1)
    expect(notes[0].text).toBe('Keep')
  })
})
