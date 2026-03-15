import { workbenchApi } from '@/services/api'
import config from '@/config'

export const listFiles = async (path) => {
  try {
    const data = await workbenchApi.getFiles(path)
    if (data.success) {
      return {
        success: true,
        files: data.files || [],
        directories: data.directories || data.folders || [],
        currentPath: data.currentPath || data.path || path,
      }
    }
    return { success: false, error: data.error || 'Failed to list files', files: [], directories: [] }
  } catch (err) {
    console.error('fileExplorerService.listFiles:', err)
    return { success: false, error: err.message, files: [], directories: [] }
  }
}

export const previewFile = async (filePath) => {
  try {
    const data = await workbenchApi.previewFile(filePath)
    if (data.success) {
      return {
        success: true,
        content: data.content || '',
        mimeType: data.mimeType || data.mime_type || 'text/plain',
        fileName: data.fileName || data.filename || filePath.split('/').pop(),
        fileSize: data.fileSize || data.file_size || 0,
      }
    }
    return { success: false, error: data.error || 'Failed to preview file' }
  } catch (err) {
    console.error('fileExplorerService.previewFile:', err)
    return { success: false, error: err.message }
  }
}

export const getDownloadUrl = (filePath) => {
  return workbenchApi.getDownloadUrl(filePath)
}

export const downloadFile = (filePath) => {
  const url = getDownloadUrl(filePath)
  const token = localStorage.getItem('wb-token')
  const downloadUrl = token ? `${url}&token=${encodeURIComponent(token)}` : url
  const link = document.createElement('a')
  link.href = downloadUrl
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  const fileName = filePath.split('/').pop() || 'download'
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const getFileIcon = (fileName) => {
  if (!fileName) return '📄'
  const ext = fileName.split('.').pop().toLowerCase()
  const iconMap = {
    pdf: '📕',
    doc: '📘',
    docx: '📘',
    xls: '📗',
    xlsx: '📗',
    csv: '📗',
    ppt: '📙',
    pptx: '📙',
    txt: '📝',
    md: '📝',
    jpg: '🖼️',
    jpeg: '🖼️',
    png: '🖼️',
    gif: '🖼️',
    svg: '🖼️',
    webp: '🖼️',
    bmp: '🖼️',
    mp4: '🎬',
    avi: '🎬',
    mkv: '🎬',
    mov: '🎬',
    mp3: '🎵',
    wav: '🎵',
    ogg: '🎵',
    flac: '🎵',
    zip: '📦',
    rar: '📦',
    '7z': '📦',
    tar: '📦',
    gz: '📦',
    js: '⚡',
    jsx: '⚡',
    ts: '⚡',
    tsx: '⚡',
    py: '🐍',
    rb: '💎',
    php: '🐘',
    java: '☕',
    c: '⚙️',
    cpp: '⚙️',
    h: '⚙️',
    cs: '⚙️',
    go: '🔵',
    rs: '🦀',
    html: '🌐',
    css: '🎨',
    scss: '🎨',
    json: '📋',
    xml: '📋',
    yml: '📋',
    yaml: '📋',
    sql: '🗄️',
    sh: '🖥️',
    bat: '🖥️',
    r: '📊',
    R: '📊',
  }
  return iconMap[ext] || '📄'
}

export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const size = (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)
  return `${size} ${units[i]}`
}

export const isPreviewable = (fileName) => {
  if (!fileName) return false
  const ext = fileName.split('.').pop().toLowerCase()
  const previewableExtensions = [
    'txt', 'md', 'json', 'xml', 'yml', 'yaml', 'csv',
    'js', 'jsx', 'ts', 'tsx', 'py', 'rb', 'php', 'java',
    'c', 'cpp', 'h', 'cs', 'go', 'rs', 'r',
    'html', 'css', 'scss', 'sql', 'sh', 'bat',
    'log', 'ini', 'cfg', 'conf', 'env',
    'jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp',
    'pdf',
  ]
  return previewableExtensions.includes(ext)
}

export const isImageFile = (fileName) => {
  if (!fileName) return false
  const ext = fileName.split('.').pop().toLowerCase()
  return ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico'].includes(ext)
}

export const navigatePath = (currentPath, folderName) => {
  const cleanCurrent = (currentPath || '/').replace(/\/+$/, '')
  return `${cleanCurrent}/${folderName}`
}

export const getParentPath = (currentPath) => {
  if (!currentPath || currentPath === '/' || currentPath === '') return '/'
  const segments = currentPath.replace(/\/+$/, '').split('/')
  segments.pop()
  const parent = segments.join('/')
  return parent || '/'
}

export const getBreadcrumbs = (currentPath) => {
  if (!currentPath || currentPath === '/') return [{ name: 'Root', path: '/' }]
  const segments = currentPath.replace(/^\/+|\/+$/g, '').split('/')
  const crumbs = [{ name: 'Root', path: '/' }]
  let accumulated = ''
  segments.forEach((seg) => {
    accumulated += '/' + seg
    crumbs.push({ name: seg, path: accumulated })
  })
  return crumbs
}