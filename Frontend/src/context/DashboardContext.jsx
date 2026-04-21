import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { apiRequest } from '../lib/api'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'
import { useNoteActions } from './dashboard/useNoteActions'
import { useProjectActions } from './dashboard/useProjectActions'
import { useTaskActions } from './dashboard/useTaskActions'

const API_BASE = (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/$/, '')

const canManageTasks = (role) => role === 'admin' || role === 'project_admin'
const canManageNotes = (role) => role === 'admin'

const DashboardContext = createContext(null)

export const DashboardProvider = ({ children }) => {
  const { currentUser } = useAuth()
  const { pushToast } = useToast()

  const [projects, setProjects] = useState([])
  const [discoverProjects, setDiscoverProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [notes, setNotes] = useState([])
  const [projectMembers, setProjectMembers] = useState([])
  const [joinRequests, setJoinRequests] = useState([])
  const [busy, setBusy] = useState(false)
  const [loadingBoard, setLoadingBoard] = useState(false)

  const selectedRole = selectedProject?.role
  const selectedProjectId = selectedProject?.project?._id || ''
  const taskEditEnabled = canManageTasks(selectedRole)
  const noteEditEnabled = canManageNotes(selectedRole)
  const canReviewJoinRequests = selectedRole === 'admin' || selectedRole === 'project_admin'
  const pendingRequestCount = joinRequests.length

  const visibleTasks = useMemo(() => {
    if (!currentUser?._id) return tasks
    if (selectedRole !== 'member') return tasks

    return tasks.filter((task) => task?.assignedTo?._id === currentUser._id)
  }, [currentUser?._id, selectedRole, tasks])

  const groupedTasks = useMemo(() => {
    const groups = { todo: [], in_progress: [], done: [] }

    for (const task of visibleTasks) {
      groups[task.status]?.push(task)
    }

    return groups
  }, [visibleTasks])

  const loadProjects = useCallback(async () => {
    const response = await apiRequest('/projects', { method: 'GET' })
    const incoming = response?.data || []
    setProjects(incoming)

    if (incoming.length > 0) {
      const stillSelected = incoming.find(
        (entry) => entry.project._id === selectedProject?.project?._id,
      )
      setSelectedProject(stillSelected || incoming[0])
    } else {
      setSelectedProject(null)
    }
  }, [selectedProject?.project?._id])

  const loadDiscoverProjects = useCallback(async () => {
    const response = await apiRequest('/projects/discover', { method: 'GET' })
    setDiscoverProjects(response?.data || [])
  }, [])

  const loadProjectWorkspace = useCallback(
    async (projectId) => {
      setLoadingBoard(true)

      try {
        const [tasksRes, notesRes] = await Promise.all([
          apiRequest(`/tasks/${projectId}`, { method: 'GET' }),
          apiRequest(`/notes/${projectId}`, { method: 'GET' }),
        ])

        setTasks(tasksRes?.data || [])
        setNotes(notesRes?.data || [])
      } catch (error) {
        pushToast(error.message, 'error')
      } finally {
        setLoadingBoard(false)
      }
    },
    [pushToast],
  )

  const loadProjectMembers = useCallback(
    async (projectId) => {
      try {
        const response = await apiRequest(`/projects/${projectId}/members`, {
          method: 'GET',
        })
        setProjectMembers(response?.data || [])
      } catch (error) {
        setProjectMembers([])
        pushToast(error.message, 'error')
      }
    },
    [pushToast],
  )

  const loadJoinRequests = useCallback(
    async (projectId) => {
      if (!canReviewJoinRequests) {
        setJoinRequests([])
        return
      }

      try {
        const response = await apiRequest(`/projects/${projectId}/join-requests`, {
          method: 'GET',
        })
        setJoinRequests(response?.data || [])
      } catch (error) {
        setJoinRequests([])
        pushToast(error.message, 'error')
      }
    },
    [canReviewJoinRequests, pushToast],
  )

  useEffect(() => {
    loadProjects().catch((error) => pushToast(error.message, 'error'))
    loadDiscoverProjects().catch((error) => pushToast(error.message, 'error'))
  }, [loadProjects, loadDiscoverProjects, pushToast])

  useEffect(() => {
    const projectId = selectedProject?.project?._id

    if (!projectId) {
      setTasks([])
      setNotes([])
      setProjectMembers([])
      setJoinRequests([])
      return
    }

    loadProjectWorkspace(projectId)
    loadProjectMembers(projectId)
    loadJoinRequests(projectId)
  }, [selectedProject, loadProjectWorkspace, loadProjectMembers, loadJoinRequests])

  const {
    selectProjectById,
    createProject,
    requestJoinProject,
    processJoinRequest,
    updateMemberRole,
    removeMember,
  } = useProjectActions({
    apiRequest,
    setBusy,
    pushToast,
    projects,
    setSelectedProject,
    selectedProjectId,
    tasks,
    loadProjects,
    loadDiscoverProjects,
    loadJoinRequests,
    loadProjectMembers,
    loadProjectWorkspace,
  })

  const {
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
    fetchTaskDetails,
    createSubTask,
    toggleSubTask,
    deleteSubTask,
    uploadTaskAttachments,
  } = useTaskActions({
    apiRequest,
    apiBase: API_BASE,
    setBusy,
    pushToast,
    selectedProjectId,
    taskEditEnabled,
    loadProjectWorkspace,
  })

  const { createNote, updateNote, deleteNote } = useNoteActions({
    apiRequest,
    setBusy,
    pushToast,
    selectedProjectId,
    noteEditEnabled,
    loadProjectWorkspace,
  })

  const value = useMemo(
    () => ({
      busy,
      loadingBoard,
      projects,
      discoverProjects,
      selectedProject,
      selectedProjectId,
      selectedRole,
      taskEditEnabled,
      noteEditEnabled,
      canReviewJoinRequests,
      pendingRequestCount,
      tasks,
      visibleTasks,
      groupedTasks,
      notes,
      projectMembers,
      joinRequests,
      selectProjectById,
      createProject,
      requestJoinProject,
      processJoinRequest,
      updateMemberRole,
      removeMember,
      createTask,
      updateTask,
      updateTaskStatus,
      deleteTask,
      fetchTaskDetails,
      createSubTask,
      toggleSubTask,
      deleteSubTask,
      uploadTaskAttachments,
      createNote,
      updateNote,
      deleteNote,
    }),
    [
      busy,
      canReviewJoinRequests,
      createNote,
      createProject,
      createSubTask,
      createTask,
      deleteNote,
      deleteSubTask,
      deleteTask,
      discoverProjects,
      fetchTaskDetails,
      groupedTasks,
      joinRequests,
      loadingBoard,
      noteEditEnabled,
      notes,
      pendingRequestCount,
      processJoinRequest,
      projectMembers,
      projects,
      removeMember,
      requestJoinProject,
      selectedProject,
      selectedProjectId,
      selectedRole,
      selectProjectById,
      taskEditEnabled,
      tasks,
      toggleSubTask,
      updateMemberRole,
      updateNote,
      updateTask,
      updateTaskStatus,
      uploadTaskAttachments,
      visibleTasks,
    ],
  )

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useDashboard = () => {
  const context = useContext(DashboardContext)

  if (!context) {
    throw new Error('useDashboard must be used within DashboardProvider')
  }

  return context
}
