import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi, workbenchApi } from '@/services/api'

const WorkbenchContext = createContext()

export const useWorkbench = () => {
  const context = useContext(WorkbenchContext)
  if (!context) throw new Error('useWorkbench must be used within WorkbenchProvider')
  return context
}

export const WorkbenchProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isWbAuthenticated, setIsWbAuthenticated] = useState(() => {
    return !!localStorage.getItem('wb-token')
  })
  const [subscriptionActive, setSubscriptionActive] = useState(false)
  const [subscriptionType, setSubscriptionType] = useState('free')
  const [loading, setLoading] = useState(false)
  
  const [userPrefs, setUserPrefs] = useState({
    wallpaper: 'default',
    theme: 'amiga-dark',
    accentColor: '#496E9B',
    iconSize: 'medium',
    taskbarPosition: 'bottom',
    iconPositions: {},
  })

  const [openWindows, setOpenWindows]         = useState([])
  const [activeWindowId, setActiveWindowId]   = useState(null)
  const [zIndexCounter, setZIndexCounter]     = useState(100)
  const [startMenuOpen, setStartMenuOpen]     = useState(false)
  const [contextMenu, setContextMenu]         = useState(null)
  const [notifications, setNotifications]     = useState([])

  const [stickyNotes, setStickyNotes]         = useState([])

  const isSubscribed = subscriptionActive || (user?.role === 'admin') || (user?.is_admin)
  const isAdmin      = user?.role === 'admin' || user?.is_admin
  const wbUser       = user
  const wbToken      = localStorage.getItem('wb-token')
  const wbPrefs      = userPrefs

  const fetchNotes = useCallback(async () => {
    try {
      const data = await workbenchApi.getNotes()
      if (data.success && data.notes) {
        setStickyNotes(data.notes)
      }
    } catch (err) { console.error('Error fetching notes', err) }
  }, [])

  const loadProfile = useCallback(async () => {
    if (!localStorage.getItem('wb-token')) return
    try {
      setLoading(true)
      const data = await authApi.getProfile()
      if (data.success) {
        setUser(data.user)
        setSubscriptionActive(data.user.subscription_active || false)
        setSubscriptionType(data.user.subscription_type || 'free')
        fetchNotes()
      }
    } catch (err) {
      console.error('Failed to load profile:', err)
      wbLogout()
    } finally {
      setLoading(false)
    }
  }, [fetchNotes])

  useEffect(() => {
    if (isWbAuthenticated) {
      loadProfile()
    }
  }, [isWbAuthenticated, loadProfile])

  const wbLogin = async (email, password) => {
    try {
      const data = await authApi.login(email, password)
      if (data.success && data.token) {
        localStorage.setItem('wb-token', data.token)
        setIsWbAuthenticated(true)
        setUser(data.user)
        setSubscriptionActive(data.user.subscription_active || false)
        setSubscriptionType(data.user.subscription_type || 'free')
        fetchNotes()
        return { success: true }
      }
      return { success: false, error: data.error || 'Login failed' }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  const wbRegister = async (email, password, fullName) => {
    try {
      const data = await authApi.register({ email, full_name: fullName, password })
      if (data.success && data.token) {
        localStorage.setItem('wb-token', data.token)
        setIsWbAuthenticated(true)
        setUser(data.user)
        setSubscriptionActive(false)
        setSubscriptionType('free')
        fetchNotes()
        return { success: true }
      }
      if (data.success) {
        return { success: true }
      }
      return { success: false, error: data.error || 'Registration failed' }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  const wbLogout = () => {
    localStorage.removeItem('wb-token')
    setIsWbAuthenticated(false)
    setUser(null)
    setSubscriptionActive(false)
    setSubscriptionType('free')
    setOpenWindows([])
    setActiveWindowId(null)
    setStartMenuOpen(false)
    setContextMenu(null)
    setStickyNotes([])
  }

  const checkSubscription = async () => {
    try {
      const data = await authApi.checkSubscription()
      setSubscriptionActive(data.active || false)
      setSubscriptionType(data.type || 'free')
      return data.active || false
    } catch {
      return false
    }
  }

  const updatePrefs = (newPrefs) => {
    setUserPrefs(prev => ({ ...prev, ...newPrefs }))
  }

  const addNotification = useCallback((msg, type = 'info') => {
    const id = Date.now()
    setNotifications(prev => [...prev, { id, msg, type }])
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000)
  }, [])

  const openWindow = useCallback((appId, title, component, props = {}, options = {}) => {
    const restrictedApps = ['BlogEditorApp', 'DataBankEditor', 'blog_editor', 'databank_editor']
    
    if ((restrictedApps.includes(appId) || restrictedApps.includes(component)) && !isAdmin) {
      addNotification('🔒 This application is restricted to administrators.', 'error')
      return
    }
    
    setOpenWindows(prev => {
      const existing = prev.find(w => w.id === appId)
      if (existing) {
        setActiveWindowId(appId)
        setZIndexCounter(z => {
          const newZ = z + 1
          setOpenWindows(ws => ws.map(w => w.id === appId ? { ...w, zIndex: newZ, minimized: false } : w))
          return newZ
        })
        return prev
      }
      
      const newZ = zIndexCounter + 1
      setZIndexCounter(newZ)
      setActiveWindowId(appId)
      
      const isAutoW = options.width === null || options.width === 'auto'
      const isAutoH = options.height === null || options.height === 'auto'
      
      const defaultW = isAutoW ? window.innerWidth * 0.88 : (options.width || 700)
      const defaultH = isAutoH ? window.innerHeight * 0.88 : (options.height || 500)
      
      const centerX = isAutoW 
        ? (window.innerWidth - defaultW) / 2 
        : Math.max(40, (window.innerWidth - defaultW) / 2 + Math.random() * 40 - 20)
        
      const centerY = isAutoH 
        ? (window.innerHeight - defaultH) / 2 
        : Math.max(40, (window.innerHeight - defaultH) / 2 + Math.random() * 40 - 20)

      return [...prev, {
        id: appId, title, component, props,
        x: options.x ?? centerX, y: options.y ?? centerY,
        width: defaultW, height: defaultH,
        minimized: false, maximized: false,
        zIndex: newZ, icon: options.icon || null,
        resizable: options.resizable !== false
      }]
    })
    
  }, [zIndexCounter, isAdmin, addNotification])

  const closeWindow = useCallback((id) => {
    setOpenWindows(prev => prev.filter(w => w.id !== id))
    setActiveWindowId(prev => prev === id ? null : prev)
  }, [])

  const minimizeWindow = useCallback((id) => {
    setOpenWindows(prev => prev.map(w => w.id === id ? { ...w, minimized: !w.minimized } : w))
  }, [])

  const maximizeWindow = useCallback((id) => {
    setOpenWindows(prev => prev.map(w => w.id === id ? { ...w, maximized: !w.maximized } : w))
  }, [])

  const focusWindow = useCallback((id) => {
    setZIndexCounter(z => {
      const newZ = z + 1
      setOpenWindows(ws => ws.map(w => w.id === id ? { ...w, zIndex: newZ, minimized: false } : w))
      return newZ
    })
    setActiveWindowId(id)
  }, [])

  const updateWindowPosition = useCallback((id, x, y) => {
    setOpenWindows(prev => prev.map(w => w.id === id ? { ...w, x, y } : w))
  }, [])

  const updateWindowSize = useCallback((id, width, height) => {
    setOpenWindows(prev => prev.map(w => w.id === id ? { ...w, width, height } : w))
  }, [])

  const updateNoteState = useCallback((id, updates) => {
    setStickyNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n))
    workbenchApi.saveNote({ id, ...updates }).catch(err => console.error(err))
  }, [])

  const createNote = useCallback(async (data) => {
    try {
      const result = await workbenchApi.createNote(data)
      if (result.success) {
        await fetchNotes()
      }
      return result
    } catch (err) {
      console.error('Error creating note', err)
      return { success: false, error: err.message }
    }
  }, [fetchNotes])

  const deleteNote = useCallback(async (id) => {
    setStickyNotes(prev => prev.filter(n => String(n.id) !== String(id)))
    try {
      await workbenchApi.deleteNote(id)
    } catch (err) {
      console.error('Error deleting note', err)
      fetchNotes()
    }
  }, [fetchNotes])

  return (
    <WorkbenchContext.Provider value={{
      user, wbUser, wbToken, wbPrefs, isWbAuthenticated, subscriptionActive, subscriptionType,
      loading, userPrefs, setUserPrefs, updatePrefs, wbLogin, wbRegister, wbLogout, checkSubscription, loadProfile,
      isSubscribed, isAdmin, openWindows, activeWindowId, openWindow, closeWindow, minimizeWindow, maximizeWindow,
      focusWindow, updateWindowPosition, updateWindowSize, startMenuOpen, setStartMenuOpen, contextMenu, setContextMenu,
      stickyNotes, updateNoteState, createNote, deleteNote, fetchNotes, notifications, addNotification,
    }}>
      {children}
    </WorkbenchContext.Provider>
  )
}