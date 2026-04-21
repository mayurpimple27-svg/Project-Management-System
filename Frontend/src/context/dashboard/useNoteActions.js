import { useCallback } from 'react'

export const useNoteActions = ({
  apiRequest,
  setBusy,
  pushToast,
  selectedProjectId,
  noteEditEnabled,
  loadProjectWorkspace,
}) => {
  const createNote = useCallback(
    async (content) => {
      if (!selectedProjectId || !content.trim()) return false
      if (!noteEditEnabled) {
        pushToast('Only admins can create notes in this project.', 'error')
        return false
      }

      setBusy(true)

      try {
        await apiRequest(`/notes/${selectedProjectId}`, {
          method: 'POST',
          body: JSON.stringify({ content: content.trim() }),
        })

        pushToast('Note saved.', 'success')
        await loadProjectWorkspace(selectedProjectId)
        return true
      } catch (error) {
        pushToast(error.message, 'error')
        return false
      } finally {
        setBusy(false)
      }
    },
    [
      apiRequest,
      loadProjectWorkspace,
      noteEditEnabled,
      pushToast,
      selectedProjectId,
      setBusy,
    ],
  )

  const updateNote = useCallback(
    async (noteId, content) => {
      if (!selectedProjectId || !content.trim()) return false

      setBusy(true)

      try {
        await apiRequest(`/notes/${selectedProjectId}/n/${noteId}`, {
          method: 'PUT',
          body: JSON.stringify({ content: content.trim() }),
        })

        await loadProjectWorkspace(selectedProjectId)
        pushToast('Note updated successfully.', 'success')
        return true
      } catch (error) {
        pushToast(error.message, 'error')
        return false
      } finally {
        setBusy(false)
      }
    },
    [apiRequest, loadProjectWorkspace, pushToast, selectedProjectId, setBusy],
  )

  const deleteNote = useCallback(
    async (noteId) => {
      if (!selectedProjectId || !noteEditEnabled) return false

      setBusy(true)

      try {
        await apiRequest(`/notes/${selectedProjectId}/n/${noteId}`, {
          method: 'DELETE',
        })

        await loadProjectWorkspace(selectedProjectId)
        pushToast('Note deleted successfully.', 'success')
        return true
      } catch (error) {
        pushToast(error.message, 'error')
        return false
      } finally {
        setBusy(false)
      }
    },
    [
      apiRequest,
      loadProjectWorkspace,
      noteEditEnabled,
      pushToast,
      selectedProjectId,
      setBusy,
    ],
  )

  return {
    createNote,
    updateNote,
    deleteNote,
  }
}
