// src/lib/utils.js
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString, locale = 'pt-BR') {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

export function truncateText(text, maxLength = 150) {
  if (!text || text.length <= maxLength) return text
  return text.substr(0, maxLength).trim() + '...'
}

export function sanitizeHtml(html) {
  const div = document.createElement('div')
  div.textContent = html
  return div.innerHTML
}

export function extractFirstImage(htmlContent) {
  if (!htmlContent) return null
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(htmlContent, 'text/html')
    const img = doc.querySelector('img')
    return img ? img.getAttribute('src') : null
  } catch (e) {
    return null
  }
}

export function debounce(fn, delay = 300) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}