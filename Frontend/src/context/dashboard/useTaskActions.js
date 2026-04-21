import { useCallback } from 'react'

export const useTaskActions = ({
  apiRequest,
  apiBase,
  setBusy,
  pushToast,
  selectedProjectId,
  taskEditEnabled,
  loadProjectWorkspace,
}) => {
  const createTask = useCallback(
    async ({ title, description, status, assignedTo }) => {
      if (!selectedProjectId || !title.trim()) return false

      if (!taskEditEnabled) {
        pushToast('Your role cannot create tasks in this project.', 'error')
        return false
      }

      setBusy(true)

      try {
        await apiRequest(`/tasks/${selectedProjectId}`, {
          method: 'POST',
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
            status,
            assignedTo: assignedTo || undefined,
          }),
        })

        pushToast('Task added to board.', 'success')
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
      pushToast,
      selectedProjectId,
      setBusy,
      taskEditEnabled,
    ],
  )

  const updateTask = useCallback(
    async (taskId, payload, successMessage = 'Task updated successfully.') => {
      if (!selectedProjectId) return false

      setBusy(true)

      try {
        await apiRequest(`/tasks/${selectedProjectId}/t/${taskId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })

        await loadProjectWorkspace(selectedProjectId)
        if (successMessage) {
          pushToast(successMessage, 'success')
        }
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

  const updateTaskStatus = useCallback(
    async (taskId, status) => updateTask(taskId, { status }, 'Task status updated.'),
    [updateTask],
  )

  const deleteTask = useCallback(
    async (taskId) => {
      if (!selectedProjectId || !taskEditEnabled) return false

      setBusy(true)

      try {
        await apiRequest(`/tasks/${selectedProjectId}/t/${taskId}`, {
          method: 'DELETE',
        })

        await loadProjectWorkspace(selectedProjectId)
        pushToast('Task deleted successfully.', 'success')
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
      pushToast,
      selectedProjectId,
      setBusy,
      taskEditEnabled,
    ],
  )

  const fetchTaskDetails = useCallback(
    async (taskId) => {
      if (!selectedProjectId) return null

      try {
        const response = await apiRequest(`/tasks/${selectedProjectId}/t/${taskId}`, {
          method: 'GET',
        })
        return response?.data || null
      } catch (error) {
        pushToast(error.message, 'error')
        return null
      }
    },
    [apiRequest, pushToast, selectedProjectId],
  )

  const createSubTask = useCallback(
    async (taskId, title) => {
      if (!selectedProjectId || !taskId || !title.trim()) return false
      if (!taskEditEnabled) {
        pushToast('Your role cannot add subtasks.', 'error')
        return false
      }

      setBusy(true)

      try {
        await apiRequest(`/tasks/${selectedProjectId}/t/${taskId}/subtasks`, {
          method: 'POST',
          body: JSON.stringify({ title: title.trim() }),
        })

        pushToast('Subtask created.', 'success')
        return true
      } catch (error) {
        pushToast(error.message, 'error')
        return false
      } finally {
        setBusy(false)
      }
    },
    [apiRequest, pushToast, selectedProjectId, setBusy, taskEditEnabled],
  )

  const toggleSubTask = useCallback(
    async (subTask) => {
      if (!selectedProjectId) return false

      setBusy(true)

      try {
        await apiRequest(`/tasks/${selectedProjectId}/st/${subTask._id}`, {
          method: 'PUT',
          body: JSON.stringify({ isCompleted: !subTask.isCompleted }),
        })

        pushToast('Subtask updated.', 'success')
        return true
      } catch (error) {
        pushToast(error.message, 'error')
        return false
      } finally {
        setBusy(false)
      }
    },
    [apiRequest, pushToast, selectedProjectId, setBusy],
  )

  const deleteSubTask = useCallback(
    async (subTaskId) => {
      if (!selectedProjectId || !taskEditEnabled) return false

      setBusy(true)

      try {
        await apiRequest(`/tasks/${selectedProjectId}/st/${subTaskId}`, {
          method: 'DELETE',
        })

        pushToast('Subtask deleted.', 'success')
        return true
      } catch (error) {
        pushToast(error.message, 'error')
        return false
      } finally {
        setBusy(false)
      }
    },
    [apiRequest, pushToast, selectedProjectId, setBusy, taskEditEnabled],
  )

  const uploadTaskAttachments = useCallback(
    async (taskId, files) => {
      if (!files?.length || !selectedProjectId || !taskId) return null

      const formData = new FormData()
      for (const file of files) {
        formData.append('attachments', file)
      }

      try {
        const response = await fetch(`${apiBase}/tasks/${selectedProjectId}/t/${taskId}`, {
          method: 'PUT',
          credentials: 'include',
          body: formData,
        })

        if (!response.ok) {
          throw new Error('Failed to upload attachment')
        }

        const data = await response.json()
        pushToast('Attachment uploaded successfully.', 'success')
        return data?.data || null
      } catch (error) {
        pushToast(error.message || 'Failed to upload attachment', 'error')
        return null
      }
    },
    [apiBase, pushToast, selectedProjectId],
  )

  return {
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
    fetchTaskDetails,
    createSubTask,
    toggleSubTask,
    deleteSubTask,
    uploadTaskAttachments,
  }
}
