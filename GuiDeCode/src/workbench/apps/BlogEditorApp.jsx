import React, { useState, useEffect, useCallback } from 'react';
import { useWorkbench } from '@/contexts/WorkbenchContext';
import { blogApi } from '@/services/api';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Youtube from '@tiptap/extension-youtube';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3, List, ListOrdered, Quote,
  Link2, Image as ImageIcon, ImagePlus, Video, Film,
  Table as TableIcon, Undo, Redo, Code, AlignLeft, AlignCenter,
  AlignRight, AlignJustify
} from 'lucide-react';

const LineHeight = TextStyle.extend({
  addGlobalAttributes() {
    return [{
      types: ['paragraph', 'heading'],
      attributes: {
        lineHeight: {
          default: null,
          parseHTML: element => element.style.lineHeight,
          renderHTML: attributes => {
            if (!attributes.lineHeight) return {};
            return { style: `line-height: ${attributes.lineHeight}` };
          }
        }
      }
    }];
  },
  addCommands() {
    return {
      setLineHeight: lineHeight => ({ commands }) =>
        commands.updateAttributes('paragraph', { lineHeight }) ||
        commands.updateAttributes('heading', { lineHeight })
    };
  }
});

const FontSize = TextStyle.extend({
  addGlobalAttributes() {
    return [{
      types: ['textStyle'],
      attributes: {
        fontSize: {
          default: null,
          parseHTML: element => element.style.fontSize,
          renderHTML: attributes => {
            if (!attributes.fontSize) return {};
            return { style: `font-size: ${attributes.fontSize}` };
          }
        }
      }
    }];
  },
  addCommands() {
    return {
      setFontSize: fontSize => ({ chain }) => chain().setMark('textStyle', { fontSize }).run(),
      unsetFontSize: () => ({ chain }) => chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run()
    };
  }
});

const BlogEditorApp = ({ winId }) => {
  const { isAdmin, addNotification } = useWorkbench();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [editingArticle, setEditingArticle] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [htmlMode, setHtmlMode] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    excerpt: '',
    content: '',
    featured_image: '',
    tags: '',
    published: false,
  });
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await blogApi.getArticles();
      setArticles(Array.isArray(data) ? data : []);
    } catch (err) {
      addNotification('Failed to load articles: ' + err.message, 'error');
    }
    setLoading(false);
  }, [addNotification]);

  useEffect(() => {
    if (isAdmin) fetchArticles();
  }, [isAdmin, fetchArticles]);

  const editor = useEditor({
    extensions: [
      StarterKit, Underline, TextStyle, Color, FontFamily, FontSize, LineHeight,
      Link.configure({ openOnClick: false, linkOnPaste: true }),
      Image.configure({ allowBase64: true, inline: true }),
      Table.configure({ resizable: true }), TableRow, TableCell, TableHeader,
      TextAlign.configure({ types: ['heading', 'paragraph'], alignments: ['left', 'center', 'right', 'justify'] }),
      Youtube.configure({ controls: false, nocookie: true })
    ],
    content: '',
    onUpdate: ({ editor }) => {
      setFormData(prev => ({ ...prev, content: editor.getHTML() }));
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[400px] p-4 text-[#cdd6f4]'
      }
    }
  });

  if (!isAdmin) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#ff5f57' }}>
        <p style={{ fontSize: '2rem', marginBottom: '12px' }}>🔒</p>
        <p style={{ fontSize: '1rem', fontWeight: 'bold' }}>Administrator Access Required</p>
      </div>
    );
  }

  const handleNew = () => {
    setFormData({ id: '', title: '', excerpt: '', content: '', featured_image: '', tags: '', published: false });
    setEditingArticle(null);
    setHtmlMode(false);
    if (editor) editor.commands.setContent('');
    setView('editor');
  };

  const handleEdit = async (articleId) => {
    try {
      const article = await blogApi.getArticleById(articleId);
      if (article) {
        let tagsStr = '';
        if (article.tags) {
          try {
            const parsed = typeof article.tags === 'string' ? JSON.parse(article.tags) : article.tags;
            tagsStr = Array.isArray(parsed) ? parsed.join(', ') : '';
          } catch { tagsStr = article.tags; }
        }
        setFormData({
          id: article.id,
          title: article.title || '',
          excerpt: article.excerpt || '',
          content: article.content || '',
          featured_image: article.featured_image || '',
          tags: tagsStr,
          published: article.published == 1 || article.published === true,
        });
        setEditingArticle(article);
        setHtmlMode(false);
        if (editor) editor.commands.setContent(article.content || '');
        setView('editor');
      }
    } catch (err) {
      addNotification('Failed to load article: ' + err.message, 'error');
    }
  };

  const handleDelete = async (articleId) => {
    if (!window.confirm('Are you sure you want to delete this article?')) return;
    try {
      await blogApi.deleteArticle(articleId);
      addNotification('Article deleted', 'success');
      fetchArticles();
    } catch (err) {
      addNotification('Delete failed: ' + err.message, 'error');
    }
  };

  const handlePublishToggle = async (articleId, isPublished) => {
    try {
      if (isPublished) await blogApi.unpublishArticle(articleId);
      else await blogApi.publishArticle(articleId);
      addNotification(isPublished ? 'Article unpublished' : 'Article published', 'success');
      fetchArticles();
    } catch (err) {
      addNotification('Action failed: ' + err.message, 'error');
    }
  };

  const handleSave = async (publish = false) => {
    if (!formData.title.trim()) {
      addNotification('Title is required', 'error');
      return;
    }
    setSaving(true);
    try {
      const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
      const finalContent = htmlMode ? htmlContent : formData.content;
      
      const payload = {
        id: formData.id || undefined,
        title: formData.title,
        excerpt: formData.excerpt,
        content: finalContent,
        featured_image: formData.featured_image,
        tags: tagsArray,
        published: publish,
      };
      const result = await blogApi.saveArticle(payload);
      if (result.success || result) {
        addNotification(publish ? 'Article published!' : 'Article saved!', 'success');
        fetchArticles();
        setView('list');
      }
    } catch (err) {
      addNotification('Save error: ' + err.message, 'error');
    }
    setSaving(false);
  };

  const toggleHtmlMode = () => {
    if (htmlMode) {
      editor.commands.setContent(htmlContent);
      setFormData(prev => ({ ...prev, content: htmlContent }));
    } else {
      setHtmlContent(editor.getHTML());
    }
    setHtmlMode(!htmlMode);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const result = await blogApi.uploadMedia(fd);
      if (result.url) {
        setFormData(prev => ({ ...prev, featured_image: result.url }));
        addNotification('Image uploaded', 'success');
      }
    } catch (err) {
      addNotification('Upload failed: ' + err.message, 'error');
    }
    setUploadingImage(false);
    e.target.value = '';
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);
    if (url === null) return;
    if (url === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const cellStyle = { padding: '6px 10px', borderBottom: '1px solid #313244', fontSize: '12px', color: '#cdd6f4' };
  const headerCellStyle = { ...cellStyle, fontWeight: 'bold', color: '#a6adc8', background: '#1e1e2e', position: 'sticky', top: 0, zIndex: 2 };
  const btnStyle = (bg) => ({ background: bg, border: 'none', color: bg === '#f9e2af' || bg === '#a6e3a1' ? '#1e1e2e' : '#cdd6f4', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' });
  const toolBtnStyle = (active) => ({ padding: '6px', background: active ? '#45475a' : 'transparent', border: '1px solid #45475a', borderRadius: '4px', color: '#cdd6f4', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' });

  if (view === 'editor') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e2e', color: '#cdd6f4' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#11111b', borderBottom: '1px solid #313244' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => setView('list')} style={btnStyle('#313244')}>← Back</button>
            <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{editingArticle ? 'Edit Article' : 'New Article'}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => handleSave(false)} disabled={saving} style={btnStyle('#89b4fa')}>
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
            <button onClick={() => handleSave(true)} disabled={saving} style={btnStyle('#f9e2af')}>
              {saving ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', color: '#a6adc8', marginBottom: '6px', display: 'block' }}>Title</label>
              <input value={formData.title} onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))} placeholder="Article title..." style={{ width: '100%', padding: '10px 12px', background: '#11111b', border: '1px solid #313244', borderRadius: '6px', color: '#cdd6f4', fontSize: '16px', fontWeight: 'bold', outline: 'none' }} />
            </div>
            <div style={{ width: '250px' }}>
              <label style={{ fontSize: '12px', color: '#a6adc8', marginBottom: '6px', display: 'block' }}>Article ID (URL Slug)</label>
              <input value={formData.id} onChange={e => setFormData(prev => ({ ...prev, id: e.target.value }))} placeholder="auto-generated" style={{ width: '100%', padding: '10px 12px', background: '#11111b', border: '1px solid #313244', borderRadius: '6px', color: '#cdd6f4', fontSize: '13px', outline: 'none' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 2 }}>
              <label style={{ fontSize: '12px', color: '#a6adc8', marginBottom: '6px', display: 'block' }}>Excerpt</label>
              <textarea value={formData.excerpt} onChange={e => setFormData(prev => ({ ...prev, excerpt: e.target.value }))} placeholder="Short description..." rows={3} style={{ width: '100%', padding: '10px 12px', background: '#11111b', border: '1px solid #313244', borderRadius: '6px', color: '#cdd6f4', fontSize: '13px', resize: 'vertical', outline: 'none' }} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#a6adc8', marginBottom: '6px', display: 'block' }}>Tags (comma separated)</label>
                <input value={formData.tags} onChange={e => setFormData(prev => ({ ...prev, tags: e.target.value }))} placeholder="genetics, research" style={{ width: '100%', padding: '10px 12px', background: '#11111b', border: '1px solid #313244', borderRadius: '6px', color: '#cdd6f4', fontSize: '13px', outline: 'none' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#a6adc8', marginBottom: '6px', display: 'block' }}>Featured Image URL</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input value={formData.featured_image} onChange={e => setFormData(prev => ({ ...prev, featured_image: e.target.value }))} placeholder="https://..." style={{ flex: 1, padding: '10px 12px', background: '#11111b', border: '1px solid #313244', borderRadius: '6px', color: '#cdd6f4', fontSize: '13px', outline: 'none' }} />
                  <label style={{ ...btnStyle('#313244'), display: 'flex', alignItems: 'center' }}>
                    {uploadingImage ? '...' : <ImagePlus size={16} />}
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#11111b', border: '1px solid #313244', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '8px', borderBottom: '1px solid #313244', background: '#181825', alignItems: 'center' }}>
              <button onClick={toggleHtmlMode} style={{ ...btnStyle(htmlMode ? '#89b4fa' : '#313244'), color: htmlMode ? '#1e1e2e' : '#cdd6f4', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Code size={14} /> HTML
              </button>
              
              <div style={{ width: '1px', height: '24px', background: '#45475a', margin: '0 4px' }} />

              {!htmlMode && editor && (
                <>
                  <button onClick={() => editor.chain().focus().toggleBold().run()} style={toolBtnStyle(editor.isActive('bold'))}><Bold size={14} /></button>
                  <button onClick={() => editor.chain().focus().toggleItalic().run()} style={toolBtnStyle(editor.isActive('italic'))}><Italic size={14} /></button>
                  <button onClick={() => editor.chain().focus().toggleUnderline().run()} style={toolBtnStyle(editor.isActive('underline'))}><UnderlineIcon size={14} /></button>
                  <button onClick={() => editor.chain().focus().toggleStrike().run()} style={toolBtnStyle(editor.isActive('strike'))}><Strikethrough size={14} /></button>
                  
                  <div style={{ width: '1px', height: '24px', background: '#45475a', margin: '0 4px' }} />
                  
                  <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} style={toolBtnStyle(editor.isActive('heading', { level: 1 }))}><Heading1 size={14} /></button>
                  <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} style={toolBtnStyle(editor.isActive('heading', { level: 2 }))}><Heading2 size={14} /></button>
                  <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} style={toolBtnStyle(editor.isActive('heading', { level: 3 }))}><Heading3 size={14} /></button>

                  <div style={{ width: '1px', height: '24px', background: '#45475a', margin: '0 4px' }} />

                  <button onClick={() => editor.chain().focus().setTextAlign('left').run()} style={toolBtnStyle(editor.isActive({ textAlign: 'left' }))}><AlignLeft size={14} /></button>
                  <button onClick={() => editor.chain().focus().setTextAlign('center').run()} style={toolBtnStyle(editor.isActive({ textAlign: 'center' }))}><AlignCenter size={14} /></button>
                  <button onClick={() => editor.chain().focus().setTextAlign('right').run()} style={toolBtnStyle(editor.isActive({ textAlign: 'right' }))}><AlignRight size={14} /></button>

                  <div style={{ width: '1px', height: '24px', background: '#45475a', margin: '0 4px' }} />

                  <button onClick={() => editor.chain().focus().toggleBulletList().run()} style={toolBtnStyle(editor.isActive('bulletList'))}><List size={14} /></button>
                  <button onClick={() => editor.chain().focus().toggleOrderedList().run()} style={toolBtnStyle(editor.isActive('orderedList'))}><ListOrdered size={14} /></button>
                  <button onClick={() => editor.chain().focus().toggleBlockquote().run()} style={toolBtnStyle(editor.isActive('blockquote'))}><Quote size={14} /></button>
                  
                  <div style={{ width: '1px', height: '24px', background: '#45475a', margin: '0 4px' }} />
                  
                  <button onClick={setLink} style={toolBtnStyle(editor.isActive('link'))}><Link2 size={14} /></button>
                  <button onClick={() => { const url = window.prompt('Image URL'); if (url) editor.chain().focus().setImage({ src: url }).run(); }} style={toolBtnStyle(false)}><ImageIcon size={14} /></button>
                  <button onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run()} style={toolBtnStyle(false)}><TableIcon size={14} /></button>
                  
                  <div style={{ width: '1px', height: '24px', background: '#45475a', margin: '0 4px' }} />

                  <button onClick={() => editor.chain().focus().undo().run()} style={toolBtnStyle(false)}><Undo size={14} /></button>
                  <button onClick={() => editor.chain().focus().redo().run()} style={toolBtnStyle(false)}><Redo size={14} /></button>
                </>
              )}
            </div>
            
            <div style={{ flex: 1, padding: htmlMode ? '0' : '16px', overflowY: 'auto' }}>
              {htmlMode ? (
                <textarea
                  value={htmlContent}
                  onChange={e => setHtmlContent(e.target.value)}
                  style={{ width: '100%', height: '100%', minHeight: '400px', padding: '16px', background: '#11111b', color: '#a6e3a1', fontFamily: 'monospace', fontSize: '14px', border: 'none', outline: 'none', resize: 'none' }}
                />
              ) : (
                <EditorContent editor={editor} className="tiptap-workbench-editor" />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredArticles = articles.filter(a =>
    (a.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.excerpt || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const publishedCount = articles.filter(a => a.published == 1 || a.published === true).length;
  const draftCount = articles.length - publishedCount;
  const totalViews = articles.reduce((s, a) => s + (a.views || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e2e', color: '#cdd6f4' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#181825', borderBottom: '1px solid #313244' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.2rem' }}>✍️</span>
          <span style={{ fontWeight: 'bold', fontSize: '15px' }}>GuideLines Editor</span>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search articles..." style={{ padding: '6px 12px', background: '#11111b', border: '1px solid #313244', borderRadius: '6px', color: '#cdd6f4', fontSize: '13px', width: '220px', outline: 'none' }} />
          <button onClick={handleNew} style={btnStyle('#f9e2af')}>+ New Article</button>
          <button onClick={fetchArticles} style={btnStyle('#313244')}>↻ Refresh</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', padding: '10px 16px', background: '#11111b', borderBottom: '1px solid #313244' }}>
        <span style={{ fontSize: '12px', color: '#89b4fa' }}>Total: <strong>{articles.length}</strong></span>
        <span style={{ fontSize: '12px', color: '#a6e3a1' }}>Published: <strong>{publishedCount}</strong></span>
        <span style={{ fontSize: '12px', color: '#fab387' }}>Drafts: <strong>{draftCount}</strong></span>
        <span style={{ fontSize: '12px', color: '#cba6f7' }}>Views: <strong>{totalViews}</strong></span>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#585b70' }}>Loading articles...</div>
        ) : filteredArticles.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#585b70' }}>
            {searchQuery ? 'No articles match your search.' : 'No articles found. Create your first article!'}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={headerCellStyle}>Title & Tags</th>
                <th style={{ ...headerCellStyle, width: '90px' }}>Status</th>
                <th style={{ ...headerCellStyle, width: '70px', textAlign: 'center' }}>Views</th>
                <th style={{ ...headerCellStyle, width: '110px' }}>Updated</th>
                <th style={{ ...headerCellStyle, width: '200px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredArticles.map(article => {
                const isPublished = article.published == 1 || article.published === true;
                let tags = [];
                try { tags = typeof article.tags === 'string' ? JSON.parse(article.tags) : (article.tags || []); } catch { tags = []; }
                return (
                  <tr key={article.id} style={{ cursor: 'pointer', borderBottom: '1px solid #313244', background: '#1e1e2e' }} onDoubleClick={() => handleEdit(article.id)}>
                    <td style={cellStyle}>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '14px', color: '#f5c2e7' }}>{article.title}</div>
                      {tags.length > 0 && (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {tags.slice(0, 4).map(tag => (
                            <span key={tag} style={{ fontSize: '10px', background: '#313244', padding: '2px 6px', borderRadius: '4px', color: '#89b4fa' }}>{tag}</span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={cellStyle}>
                      <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold', background: isPublished ? 'rgba(166,227,161,0.15)' : 'rgba(249,226,175,0.15)', color: isPublished ? '#a6e3a1' : '#f9e2af' }}>
                        {isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td style={{ ...cellStyle, textAlign: 'center', fontWeight: 'bold', color: '#cba6f7' }}>{article.views || 0}</td>
                    <td style={cellStyle}>
                      {article.updated_at ? new Date(article.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                    </td>
                    <td style={{ ...cellStyle, textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button onClick={(e) => { e.stopPropagation(); handleEdit(article.id); }} style={btnStyle('#89b4fa')}>Edit</button>
                        <button onClick={(e) => { e.stopPropagation(); handlePublishToggle(article.id, isPublished); }} style={btnStyle(isPublished ? '#fab387' : '#a6e3a1')}>
                          {isPublished ? 'Unpublish' : 'Publish'}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(article.id); }} style={btnStyle('#f38ba8')}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default BlogEditorApp;