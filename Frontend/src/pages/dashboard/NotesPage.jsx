import { useState } from 'react'
import { useDashboard } from '../../context/DashboardContext'

export const NotesPage = () => {
  const { busy, selectedProjectId, noteEditEnabled, notes, createNote, updateNote, deleteNote } =
    useDashboard()

  const [noteForm, setNoteForm] = useState({ content: '' })
  const [editingNoteId, setEditingNoteId] = useState(null)
  const [editNoteForm, setEditNoteForm] = useState({ content: '' })

  const handleCreateNote = async (event) => {
    event.preventDefault()

    const created = await createNote(noteForm.content)
    if (created) {
      setNoteForm({ content: '' })
    }
  }

  const handleEditNote = async (event) => {
    event.preventDefault()

    const updated = await updateNote(editingNoteId, editNoteForm.content)
    if (updated) {
      setEditingNoteId(null)
      setEditNoteForm({ content: '' })
    }
  }

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return
    await deleteNote(noteId)
  }

  return (
    <section className="grid gap-4">
      <header>
        <p className="text-xs uppercase tracking-wide text-slate-500">Notes</p>
        <h3 className="text-xl font-bold text-slate-900">Project Notes</h3>
      </header>

      {!selectedProjectId ? (
        <p className="rounded-xl border border-dashed border-slate-300 px-3 py-5 text-sm text-slate-600">
          Select a project from the quick selector to manage notes.
        </p>
      ) : (
        <>
          <form className="rounded-xl border border-slate-200 bg-white p-3" onSubmit={handleCreateNote}>
            <textarea
              className="min-h-24 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-teal-500"
              placeholder="Write a note"
              maxLength={500}
              value={noteForm.content}
              onChange={(e) => setNoteForm({ content: e.target.value })}
              disabled={!noteEditEnabled}
              required
            />
            <button
              className="mt-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-75"
              disabled={busy || !noteEditEnabled}
            >
              Save Note
            </button>
            {!noteEditEnabled && (
              <p className="mt-2 text-xs text-amber-700">Only project admins can add notes.</p>
            )}
          </form>

          <ul className="grid max-h-[58vh] gap-2 overflow-y-auto pr-1">
            {notes.map((note) => (
              <li key={note._id} className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
                <p className="text-slate-800">{note.content}</p>
                <p className="mt-2 text-xs text-slate-500">by {note.createdBy?.username || 'unknown'}</p>
                {noteEditEnabled && (
                  <div className="mt-2 flex gap-1">
                    <button
                      className="flex-1 rounded-md border border-blue-200 px-2 py-1 text-xs font-semibold text-blue-700"
                      onClick={() => {
                        setEditingNoteId(note._id)
                        setEditNoteForm({ content: note.content })
                      }}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      className="flex-1 rounded-md border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-700"
                      onClick={() => handleDeleteNote(note._id)}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </li>
            ))}
            {notes.length === 0 && (
              <li className="rounded-xl border border-dashed border-slate-300 px-3 py-6 text-center text-sm text-slate-500">
                Notes for this project will appear here.
              </li>
            )}
          </ul>
        </>
      )}

      {editingNoteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-3">
          <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl md:p-6">
            <div className="mb-4">
              <h4 className="text-lg font-semibold text-slate-900">Edit Note</h4>
            </div>

            <form className="grid gap-3" onSubmit={handleEditNote}>
              <textarea
                className="min-h-24 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-teal-500"
                placeholder="Edit note content"
                maxLength={500}
                value={editNoteForm.content}
                onChange={(e) => setEditNoteForm({ content: e.target.value })}
                required
              />
              <div className="flex gap-2">
                <button
                  className="flex-1 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-75"
                  disabled={busy}
                  type="submit"
                >
                  Save Note
                </button>
                <button
                  className="flex-1 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  onClick={() => setEditingNoteId(null)}
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  )
}
