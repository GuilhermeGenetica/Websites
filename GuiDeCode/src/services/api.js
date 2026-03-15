// src/services/api.js
import config from '@/config'

const BASE = config.API_URL

async function request(endpoint, options = {}) {
  const url = `${BASE}${endpoint}`
  const defaultHeaders = {}

  const token = localStorage.getItem('wb-token')
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`
    defaultHeaders['X-Wb-Token'] = token 
  }

  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json'
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }

  return res.json()
}

export const blogApi = {
  getArticles: () => request('/blog.php?action=getArticles'),
  getPublishedArticles: () => request('/blog.php?action=getPublishedArticles'),
  getArticleById: (id) => request(`/blog.php?action=getArticleById&id=${id}`),
  saveArticle: (data) => request('/blog.php?action=saveArticle', { method: 'POST', body: JSON.stringify(data) }),
  deleteArticle: (id) => request('/blog.php?action=deleteArticle', { method: 'POST', body: JSON.stringify({ id }) }),
  publishArticle: (id) => request('/blog.php?action=publishArticle', { method: 'POST', body: JSON.stringify({ id }) }),
  unpublishArticle: (id) => request('/blog.php?action=unpublishArticle', { method: 'POST', body: JSON.stringify({ id }) }),
  incrementViews: (id) => request('/blog.php?action=incrementViews', { method: 'POST', body: JSON.stringify({ id }) }),
  uploadMedia: (formData) => request('/blog.php?action=uploadImage', { method: 'POST', body: formData }),
}

export const adminApi = {
  login: (email, password) => request('/blog.php?action=login', { method: 'POST', body: JSON.stringify({ email, password }) }),
}

export const contactApi = {
  submit: (data) => request('/contact.php?action=send', { method: 'POST', body: JSON.stringify(data) }),
  getMessages: () => request('/contact.php?action=getMessages'),
}

export const newsletterApi = {
  subscribe: (email) => request('/blog.php?action=subscribe', { method: 'POST', body: JSON.stringify({ email }) }),
}

export const authApi = {
  login: (email, password) => request('/auth.php?action=login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (data) => request('/auth.php?action=register', { method: 'POST', body: JSON.stringify(data) }),
  forgotPassword: (email) => request('/auth.php?action=forgotPassword', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token, password) => request('/auth.php?action=resetPassword', { method: 'POST', body: JSON.stringify({ token, password }) }),
  getProfile: () => request('/auth.php?action=getProfile'),
  updateProfile: (data) => request('/auth.php?action=updateProfile', { method: 'POST', body: JSON.stringify(data) }),
  checkSubscription: () => request('/auth.php?action=checkSubscription'),
  createCheckoutSession: (plan) => request('/auth.php?action=createCheckout', { method: 'POST', body: JSON.stringify({ plan }) }),
  cancelSubscription: (reason) => request('/auth.php?action=cancelSubscription', { method: 'POST', body: JSON.stringify({ reason }) }),
}

export const workbenchApi = {
  getFiles: (path) => request(`/workbench.php?action=listFiles&path=${encodeURIComponent(path || '/')}`),
  previewFile: (path) => request(`/workbench.php?action=previewFile&path=${encodeURIComponent(path || '')}`),
  getDownloadUrl: (path) => `${BASE}/workbench.php?action=downloadFile&path=${encodeURIComponent(path || '')}`,
  getUserPrefs: () => request('/workbench.php?action=getUserPrefs'),
  saveUserPrefs: (prefs) => request('/workbench.php?action=saveUserPrefs', { method: 'POST', body: JSON.stringify(prefs) }),
  
  getNotes: () => request('/workbench.php?action=getNotes'),
  createNote: (data) => request('/workbench.php?action=createNote', { method: 'POST', body: JSON.stringify(data) }),
  saveNote: (note) => request('/workbench.php?action=saveNote', { method: 'POST', body: JSON.stringify(note) }),
  deleteNote: (id) => request('/workbench.php?action=deleteNote', { method: 'POST', body: JSON.stringify({ id }) }),
  adminGetUsers: () => request('/workbench.php?action=adminGetUsers'),
  adminGetUserNotes: (userId) => request(`/workbench.php?action=adminGetUserNotes&userId=${userId}`),
  dbDropColumn: (data) => request('/workbench.php?action=dbDropColumn', { method: 'POST', body: JSON.stringify(data) }),
  dbRenameTable: (data) => request('/workbench.php?action=dbRenameTable', { method: 'POST', body: JSON.stringify(data) }),

  dbConnect: (creds) => request('/workbench.php?action=dbConnect', { method: 'POST', body: JSON.stringify(creds) }),
  dbDisconnect: () => request('/workbench.php?action=dbDisconnect', { method: 'POST' }),
  dbListDatabases: (creds) => request('/workbench.php?action=dbListDatabases', { method: 'POST', body: JSON.stringify(creds) }),
  dbListTables: (creds) => request('/workbench.php?action=dbListTables', { method: 'POST', body: JSON.stringify(creds) }),
  dbGetColumns: (creds) => request('/workbench.php?action=dbGetColumns', { method: 'POST', body: JSON.stringify(creds) }),
  dbQuery: (creds) => request('/workbench.php?action=dbQuery', { method: 'POST', body: JSON.stringify(creds) }),
  dbInsertRow: (creds) => request('/workbench.php?action=dbInsertRow', { method: 'POST', body: JSON.stringify(creds) }),
  dbUpdateRow: (creds) => request('/workbench.php?action=dbUpdateRow', { method: 'POST', body: JSON.stringify(creds) }),
  dbDeleteRow: (creds) => request('/workbench.php?action=dbDeleteRow', { method: 'POST', body: JSON.stringify(creds) }),
  dbGetTableContent: (data) => request('/workbench.php?action=dbGetTableContent', { method: 'POST', body: JSON.stringify(data) }),
  dbGetPrimaryKey: (data) => request('/workbench.php?action=dbGetPrimaryKey', { method: 'POST', body: JSON.stringify(data) }),
  dbSaveChanges: (data) => request('/workbench.php?action=dbSaveChanges', { method: 'POST', body: JSON.stringify(data) }),
  dbDeleteRecords: (data) => request('/workbench.php?action=dbDeleteRecords', { method: 'POST', body: JSON.stringify(data) }),
  dbCreateDatabase: (data) => request('/workbench.php?action=dbCreateDatabase', { method: 'POST', body: JSON.stringify(data) }),
  dbDropDatabase: (data) => request('/workbench.php?action=dbDropDatabase', { method: 'POST', body: JSON.stringify(data) }),
  dbCreateTable: (data) => request('/workbench.php?action=dbCreateTable', { method: 'POST', body: JSON.stringify(data) }),
  dbDropTable: (data) => request('/workbench.php?action=dbDropTable', { method: 'POST', body: JSON.stringify(data) }),
  dbAddColumn: (data) => request('/workbench.php?action=dbAddColumn', { method: 'POST', body: JSON.stringify(data) }),
  dbRenameColumn: (data) => request('/workbench.php?action=dbRenameColumn', { method: 'POST', body: JSON.stringify(data) }),
  dbExecuteSQL: (data) => request('/workbench.php?action=dbExecuteSQL', { method: 'POST', body: JSON.stringify(data) }),
  graphoLoad: (mapId) => request(`/workbench.php?action=graphoLoad${mapId ? '&mapId=' + mapId : ''}`),
  graphoSave: (data) => request('/workbench.php?action=graphoSave', { method: 'POST', body: JSON.stringify(data) }),
  graphoDelete: (mapId) => request('/workbench.php?action=graphoDelete', { method: 'POST', body: JSON.stringify({ mapId }) }),
  getConsultationSlots: (month) => request(`/workbench.php?action=getConsultationSlots&month=${encodeURIComponent(month || '')}`),
  bookConsultation: (data) => request('/workbench.php?action=bookConsultation', { method: 'POST', body: JSON.stringify(data) }),
  getMyConsultations: () => request('/workbench.php?action=getMyConsultations'),
  cancelConsultation: (slotId, reason) => request('/workbench.php?action=cancelConsultation', { method: 'POST', body: JSON.stringify({ slotId, reason }) }),
  verifyPayment: (slotId) => request('/workbench.php?action=verifyPayment', { method: 'POST', body: JSON.stringify({ slotId }) }),
  adminCreateSlot: (data) => request('/workbench.php?action=adminCreateSlot', { method: 'POST', body: JSON.stringify(data) }),
  adminDeleteSlot: (slotId) => request('/workbench.php?action=adminDeleteSlot', { method: 'POST', body: JSON.stringify({ slotId }) }),
  adminBulkCreateSlots: (data) => request('/workbench.php?action=adminBulkCreateSlots', { method: 'POST', body: JSON.stringify(data) }),
  adminGetAllBookings: (month) => request(`/workbench.php?action=adminGetAllBookings&month=${encodeURIComponent(month || '')}`),
  adminCancelBooking: (slotId, reason) => request('/workbench.php?action=adminCancelBooking', { method: 'POST', body: JSON.stringify({ slotId, reason }) }),
  listScripts: () => request('/workbench.php?action=listScripts'),
  getScriptContent: (filename) => request(`/workbench.php?action=getScriptContent&filename=${encodeURIComponent(filename)}`),
}

const api = {
  get: (endpoint, params = {}) => {
    const query = new URLSearchParams(params).toString()
    const separator = endpoint.includes('?') ? '&' : (endpoint ? '?' : '?')
    const url = query ? `${endpoint}${separator}${query}` : endpoint
    return request(url)
  },
  post: (endpoint, body) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  upload: (endpoint, formData) => request(endpoint, { method: 'POST', body: formData }),
}

export default api;