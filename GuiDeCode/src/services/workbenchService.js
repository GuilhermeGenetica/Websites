import { workbenchApi } from '@/services/api'

export const getUserPrefs = async () => {
  try {
    const data = await workbenchApi.getUserPrefs()
    if (data.success) return data.prefs || data.preferences || {}
    return {}
  } catch (err) {
    console.error('workbenchService.getUserPrefs:', err)
    return {}
  }
}

export const saveUserPrefs = async (prefs) => {
  try {
    const data = await workbenchApi.saveUserPrefs(prefs)
    return data
  } catch (err) {
    console.error('workbenchService.saveUserPrefs:', err)
    return { success: false, error: err.message }
  }
}

/* STICKER NOTES SERVICES v2 */
export const getNotes = async () => {
  try {
    const data = await workbenchApi.getNotes()
    if (data.success) return data.notes || []
    return []
  } catch (err) {
    console.error('workbenchService.getNotes:', err)
    return []
  }
}

export const createNote = async (data) => {
  try {
    return await workbenchApi.createNote(data)
  } catch (err) {
    console.error('workbenchService.createNote:', err)
    return { success: false, error: err.message }
  }
}

export const saveNote = async (note) => {
  try {
    return await workbenchApi.saveNote(note)
  } catch (err) {
    console.error('workbenchService.saveNote:', err)
    return { success: false, error: err.message }
  }
}

export const deleteNoteService = async (id) => {
  try {
    return await workbenchApi.deleteNote(id)
  } catch (err) {
    console.error('workbenchService.deleteNote:', err)
    return { success: false, error: err.message }
  }
}

export const adminGetUsers = async () => {
  try {
    const data = await workbenchApi.adminGetUsers()
    if (data.success) return data.users || []
    return []
  } catch (err) {
    console.error('workbenchService.adminGetUsers:', err)
    return []
  }
}

export const adminGetUserNotes = async (userId) => {
  try {
    const data = await workbenchApi.adminGetUserNotes(userId)
    if (data.success) return data.notes || []
    return []
  } catch (err) {
    console.error('workbenchService.adminGetUserNotes:', err)
    return []
  }
}

//export const adminBroadcastGlobal = async (content) => { ... }
//export const adminUpdateShared = async (userId, content) => { ... }
//export const adminGetSharedNote = async (userId) => { ... }
/* FIM STICKER NOTES SERVICES v2 */

export const dbConnect = async (creds) => {
  try {
    return await workbenchApi.dbConnect(creds)
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export const dbDisconnect = async () => {
  try {
    return await workbenchApi.dbDisconnect()
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export const dbListDatabases = async (creds) => {
  try {
    return await workbenchApi.dbListDatabases(creds)
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export const dbListTables = async (creds) => {
  try {
    return await workbenchApi.dbListTables(creds)
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export const dbGetTableContent = async (data) => {
  try {
    return await workbenchApi.dbGetTableContent(data)
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export const dbGetPrimaryKey = async (data) => {
  try {
    return await workbenchApi.dbGetPrimaryKey(data)
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export const dbSaveChanges = async (data) => {
  try {
    return await workbenchApi.dbSaveChanges(data)
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export const dbDeleteRecords = async (data) => {
  try {
    return await workbenchApi.dbDeleteRecords(data)
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export const dbCreateDatabase = async (data) => {
  try {
    return await workbenchApi.dbCreateDatabase(data)
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export const dbDropDatabase = async (data) => {
  try {
    return await workbenchApi.dbDropDatabase(data)
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export const dbCreateTable = async (data) => {
  try {
    return await workbenchApi.dbCreateTable(data)
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export const dbDropTable = async (data) => {
  try {
    return await workbenchApi.dbDropTable(data)
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export const dbAddColumn = async (data) => {
  try {
    return await workbenchApi.dbAddColumn(data)
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export const dbRenameColumn = async (data) => {
  try {
    return await workbenchApi.dbRenameColumn(data)
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export const dbExecuteSQL = async (data) => {
  try {
    return await workbenchApi.dbExecuteSQL(data)
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export const graphoLoad = async (mapId) => {
  try {
    return await workbenchApi.graphoLoad(mapId)
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export const graphoSave = async (data) => {
  try {
    return await workbenchApi.graphoSave(data)
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export const graphoDelete = async (mapId) => {
  try {
    return await workbenchApi.graphoDelete(mapId)
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export const getConsultationSlots = async (month) => {
  try {
    return await workbenchApi.getConsultationSlots(month)
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export const bookConsultation = async (data) => {
  try {
    return await workbenchApi.bookConsultation(data)
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export const getMyConsultations = async () => {
  try {
    return await workbenchApi.getMyConsultations()
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export const cancelConsultation = async (slotId, reason) => {
  try {
    return await workbenchApi.cancelConsultation(slotId, reason)
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export const listScripts = async () => {
  try {
    return await workbenchApi.listScripts()
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export const getScriptContent = async (filename) => {
  try {
    return await workbenchApi.getScriptContent(filename)
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export const verifyPayment = async (slotId) => {
  try {
    return await workbenchApi.verifyPayment(slotId)
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export const adminCreateSlot = async (data) => {
  try {
    return await workbenchApi.adminCreateSlot(data)
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export const adminDeleteSlot = async (slotId) => {
  try {
    return await workbenchApi.adminDeleteSlot(slotId)
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export const adminBulkCreateSlots = async (data) => {
  try {
    return await workbenchApi.adminBulkCreateSlots(data)
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export const adminGetAllBookings = async (month) => {
  try {
    return await workbenchApi.adminGetAllBookings(month)
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export const adminCancelBooking = async (slotId, reason) => {
  try {
    return await workbenchApi.adminCancelBooking(slotId, reason)
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export const dbDropColumn = async (data) => {
  try {
    return await workbenchApi.dbDropColumn(data)
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export const dbRenameTable = async (data) => {
  try {
    return await workbenchApi.dbRenameTable(data)
  } catch (err) {
    return { success: false, error: err.message }
  }
}