import React, { useState, useEffect, useRef, useCallback } from 'react'
import { blogApi } from '@/services/api'

const GuidelinesApp = () => {
  const [articles, setArticles] = useState([])
  const [selectedArticle, setSelectedArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [selectedTag, setSelectedTag] = useState('all')
  const contentRef = useRef(null)

  useEffect(() => {
    loadArticles()
  }, [])

  const loadArticles = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await blogApi.getArticles()
      let list = []
      if (Array.isArray(data)) {
        list = data
      } else if (data && data.success && Array.isArray(data.articles)) {
        list = data.articles
      } else if (data && Array.isArray(data.articles)) {
        list = data.articles
      }

      list = list.map(a => ({
        ...a,
        tags: Array.isArray(a.tags) ? a.tags : (typeof a.tags === 'string' && a.tags ? a.tags.split(',').map(t => t.trim()) : [])
      }))

      list.sort((a, b) => {
        const da = new Date(a.published_at || a.publishedAt || a.created_at || a.createdAt || 0)
        const db = new Date(b.published_at || b.publishedAt || b.created_at || b.createdAt || 0)
        return db - da
      })

      setArticles(list)
    } catch (e) {
      console.error('GuidelinesApp: Erro ao carregar artigos:', e)
      setError('Falha ao carregar artigos. Verifique a conexão.')
    }
    setLoading(false)
  }

  // Interceptar cliques em links dentro do conteúdo do artigo
  useEffect(() => {
    if (!contentRef.current) return
    const handler = (e) => {
      const anchor = e.target.closest('a')
      if (!anchor) return
      const href = anchor.getAttribute('href')
      if (!href) return

      // Links internos de artigos: redirecionar para o próprio viewer
      if (href.startsWith('/article/') || href.includes('/article/')) {
        e.preventDefault()
        const idMatch = href.match(/\/article\/([^/?#]+)/)
        if (idMatch) {
          const targetArticle = articles.find(a => String(a.id) === idMatch[1])
          if (targetArticle) setSelectedArticle(targetArticle)
        }
        return
      }

      // Links externos: abrir no próprio painel como info, não em nova aba
      if (href.startsWith('http')) {
        e.preventDefault()
        // Permitir abrir em nova aba apenas com Ctrl/Cmd + click
        if (e.ctrlKey || e.metaKey) {
          window.open(href, '_blank', 'noopener,noreferrer')
        }
        // Caso contrário, ignorar ou podemos mostrar o URL numa tooltip
        return
      }
    }

    const el = contentRef.current
    el.addEventListener('click', handler)
    return () => el.removeEventListener('click', handler)
  }, [selectedArticle, articles])

  const allTags = React.useMemo(() => {
    const tagSet = new Set()
    articles.forEach(a => a.tags.forEach(t => tagSet.add(t)))
    return Array.from(tagSet).sort()
  }, [articles])

  const filteredArticles = React.useMemo(() => {
    let result = articles
    if (search) {
      const s = search.toLowerCase()
      result = result.filter(a =>
        (a.title || '').toLowerCase().includes(s) ||
        (a.excerpt || '').toLowerCase().includes(s) ||
        a.tags.some(t => t.toLowerCase().includes(s))
      )
    }
    if (selectedTag !== 'all') {
      result = result.filter(a => a.tags.includes(selectedTag))
    }
    return result
  }, [articles, search, selectedTag])

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    try {
      return new Date(dateStr).toLocaleDateString('pt-PT', {
        day: '2-digit', month: 'short', year: 'numeric'
      })
    } catch { return dateStr }
  }

  const getReadingTime = (content) => {
    if (!content) return '1 min'
    const text = content.replace(/<[^>]*>/g, '')
    const words = text.split(/\s+/).length
    return `${Math.max(1, Math.ceil(words / 200))} min`
  }

  return (
    <div style={styles.container}>
      {/* SIDEBAR */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.logoRow}>
            <span style={styles.logoIcon}>📖</span>
            <span style={styles.logoText}>GuideLines</span>
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Pesquisar artigos..."
            style={styles.searchInput}
          />
          {allTags.length > 0 && (
            <div style={styles.tagsBar}>
              <button
                onClick={() => setSelectedTag('all')}
                style={{ ...styles.tagBtn, ...(selectedTag === 'all' ? styles.tagBtnActive : {}) }}>
                Todos
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  style={{ ...styles.tagBtn, ...(selectedTag === tag ? styles.tagBtnActive : {}) }}>
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={styles.articleList}>
          {loading && (
            <div style={styles.statusMsg}>A carregar artigos...</div>
          )}
          {error && (
            <div style={{ ...styles.statusMsg, color: '#ff6b6b' }}>
              {error}
              <button onClick={loadArticles} style={styles.retryBtn}>Tentar novamente</button>
            </div>
          )}
          {!loading && !error && filteredArticles.length === 0 && (
            <div style={styles.statusMsg}>
              {search || selectedTag !== 'all' ? 'Nenhum artigo encontrado.' : 'Nenhum artigo publicado.'}
            </div>
          )}
          {filteredArticles.map(article => (
            <div
              key={article.id}
              onClick={() => setSelectedArticle(article)}
              style={{
                ...styles.articleItem,
                background: selectedArticle?.id === article.id ? 'rgba(137,180,250,0.12)' : 'transparent',
                borderLeft: selectedArticle?.id === article.id ? '3px solid #89b4fa' : '3px solid transparent',
              }}>
              <div style={styles.articleTitle}>{article.title}</div>
              <div style={styles.articleMeta}>
                <span>{formatDate(article.published_at || article.publishedAt || article.created_at || article.createdAt)}</span>
                <span style={styles.metaDot}>·</span>
                <span>{getReadingTime(article.content)}</span>
                {article.views > 0 && (
                  <>
                    <span style={styles.metaDot}>·</span>
                    <span>{article.views} views</span>
                  </>
                )}
              </div>
              {article.tags.length > 0 && (
                <div style={styles.articleTags}>
                  {article.tags.slice(0, 3).map((tag, i) => (
                    <span key={i} style={styles.articleTag}>{tag}</span>
                  ))}
                  {article.tags.length > 3 && (
                    <span style={styles.articleTagMore}>+{article.tags.length - 3}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={styles.sidebarFooter}>
          <span style={styles.footerCount}>{filteredArticles.length} artigo{filteredArticles.length !== 1 ? 's' : ''}</span>
          <button onClick={loadArticles} style={styles.refreshBtn} title="Atualizar">🔄</button>
        </div>
      </div>

      {/* CONTEÚDO */}
      <div style={styles.content} ref={contentRef}>
        {!selectedArticle && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📖</div>
            <h2 style={styles.emptyTitle}>GuideLines</h2>
            <p style={styles.emptyDesc}>Selecione um artigo no painel lateral para iniciar a leitura.</p>
            <p style={styles.emptyHint}>
              {articles.length > 0
                ? `${articles.length} artigos clínicos disponíveis`
                : 'A carregar biblioteca clínica...'}
            </p>
          </div>
        )}

        {selectedArticle && (
          <article style={styles.article}>
            <button
              onClick={() => setSelectedArticle(null)}
              style={styles.backBtn}>
              ← Voltar à lista
            </button>

            {selectedArticle.featured_image && (
              <div style={styles.heroImageWrap}>
                <img
                  src={selectedArticle.featured_image}
                  alt={selectedArticle.title}
                  style={styles.heroImage}
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              </div>
            )}

            <h1 style={styles.articleHeading}>{selectedArticle.title}</h1>

            <div style={styles.articleInfoBar}>
              <span>Dr. Guilherme de Macedo Oliveira</span>
              <span style={styles.metaDot}>·</span>
              <span>{formatDate(selectedArticle.published_at || selectedArticle.publishedAt || selectedArticle.created_at || selectedArticle.createdAt)}</span>
              <span style={styles.metaDot}>·</span>
              <span>{getReadingTime(selectedArticle.content)} de leitura</span>
              {selectedArticle.views > 0 && (
                <>
                  <span style={styles.metaDot}>·</span>
                  <span>{selectedArticle.views} visualizações</span>
                </>
              )}
            </div>

            {selectedArticle.tags.length > 0 && (
              <div style={styles.articleDetailTags}>
                {selectedArticle.tags.map((tag, i) => (
                  <span key={i} style={styles.detailTag}>{tag}</span>
                ))}
              </div>
            )}

            {selectedArticle.excerpt && (
              <blockquote style={styles.excerpt}>
                {selectedArticle.excerpt}
              </blockquote>
            )}

            <div
              style={styles.articleBody}
              dangerouslySetInnerHTML={{ __html: selectedArticle.content || '' }}
            />
          </article>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    height: '100%',
    background: '#1e1e2e',
    color: '#cdd6f4',
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    fontSize: '13px',
  },
  sidebar: {
    width: '280px',
    minWidth: '280px',
    borderRight: '1px solid #313244',
    display: 'flex',
    flexDirection: 'column',
    background: '#181825',
  },
  sidebarHeader: {
    padding: '12px',
    borderBottom: '1px solid #313244',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  logoIcon: { fontSize: '1.1rem' },
  logoText: {
    fontSize: '0.9rem',
    fontWeight: '700',
    color: '#f9e2af',
    letterSpacing: '0.03em',
  },
  searchInput: {
    width: '100%',
    padding: '7px 10px',
    background: '#11111b',
    border: '1px solid #313244',
    borderRadius: '6px',
    color: '#cdd6f4',
    fontSize: '12px',
    boxSizing: 'border-box',
    outline: 'none',
  },
  tagsBar: {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap',
  },
  tagBtn: {
    padding: '2px 8px',
    background: '#313244',
    border: 'none',
    borderRadius: '10px',
    color: '#a6adc8',
    fontSize: '10px',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  tagBtnActive: {
    background: '#f9e2af',
    color: '#1e1e2e',
    fontWeight: '600',
  },
  articleList: {
    flex: 1,
    overflowY: 'auto',
  },
  statusMsg: {
    padding: '20px',
    textAlign: 'center',
    color: '#585b70',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  retryBtn: {
    padding: '4px 12px',
    background: '#313244',
    border: 'none',
    borderRadius: '4px',
    color: '#cdd6f4',
    cursor: 'pointer',
    fontSize: '11px',
  },
  articleItem: {
    padding: '10px 12px',
    cursor: 'pointer',
    transition: 'background 0.12s',
    borderBottom: '1px solid rgba(49,50,68,0.5)',
  },
  articleTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#89b4fa',
    marginBottom: '3px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    lineHeight: '1.4',
  },
  articleMeta: {
    fontSize: '10px',
    color: '#585b70',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  metaDot: { color: '#45475a' },
  articleTags: {
    display: 'flex',
    gap: '3px',
    marginTop: '4px',
    flexWrap: 'wrap',
  },
  articleTag: {
    fontSize: '9px',
    background: '#313244',
    padding: '1px 6px',
    borderRadius: '3px',
    color: '#a6adc8',
  },
  articleTagMore: {
    fontSize: '9px',
    color: '#585b70',
    padding: '1px 4px',
  },
  sidebarFooter: {
    padding: '8px 12px',
    borderTop: '1px solid #313244',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerCount: {
    fontSize: '10px',
    color: '#585b70',
  },
  refreshBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '2px 4px',
    borderRadius: '4px',
    transition: 'background 0.15s',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '0',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#585b70',
    gap: '8px',
  },
  emptyIcon: { fontSize: '3rem', opacity: 0.3 },
  emptyTitle: {
    fontSize: '1.4rem',
    fontWeight: '700',
    color: '#f9e2af',
    margin: 0,
    fontFamily: "'Playfair Display', Georgia, serif",
  },
  emptyDesc: {
    fontSize: '0.85rem',
    color: '#585b70',
    margin: 0,
  },
  emptyHint: {
    fontSize: '0.75rem',
    color: '#45475a',
    margin: 0,
    fontFamily: 'monospace',
  },
  article: {
    padding: '24px 32px',
    maxWidth: '780px',
  },
  backBtn: {
    background: 'transparent',
    border: 'none',
    color: '#89b4fa',
    cursor: 'pointer',
    fontSize: '12px',
    padding: '4px 0',
    marginBottom: '16px',
    transition: 'color 0.15s',
  },
  heroImageWrap: {
    marginBottom: '20px',
    borderRadius: '8px',
    overflow: 'hidden',
    maxHeight: '320px',
  },
  heroImage: {
    width: '100%',
    height: 'auto',
    objectFit: 'cover',
    display: 'block',
  },
  articleHeading: {
    margin: '0 0 12px',
    color: '#f9e2af',
    fontSize: '1.5rem',
    lineHeight: '1.3',
    fontWeight: '700',
    fontFamily: "'Playfair Display', Georgia, serif",
  },
  articleInfoBar: {
    fontSize: '11px',
    color: '#585b70',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
  },
  articleDetailTags: {
    display: 'flex',
    gap: '6px',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  detailTag: {
    fontSize: '10px',
    background: 'rgba(137,180,250,0.12)',
    color: '#89b4fa',
    padding: '2px 10px',
    borderRadius: '12px',
    fontWeight: '500',
  },
  excerpt: {
    borderLeft: '3px solid #f9e2af',
    padding: '10px 16px',
    margin: '0 0 20px',
    background: 'rgba(249,226,175,0.05)',
    color: '#a6adc8',
    fontSize: '13px',
    lineHeight: '1.6',
    fontStyle: 'italic',
    borderRadius: '0 6px 6px 0',
  },
  articleBody: {
    color: '#cdd6f4',
    fontSize: '14px',
    lineHeight: '1.8',
  },
}

export default GuidelinesApp