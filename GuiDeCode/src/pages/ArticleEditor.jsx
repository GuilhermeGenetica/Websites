import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { getArticleById, saveArticle } from '@/services/articleService';
import { uploadImage } from '@/services/mediaService';
import { notifySubscribers } from '@/services/newsletterService';
import {
  ArrowLeft, Save, Send, Bold, Italic, UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3, List, ListOrdered, Quote,
  Link2, Image as ImageIcon, ImagePlus, Video, Film,
  Table as TableIcon, Undo, Redo, Code, AlignLeft, AlignCenter,
  AlignRight, AlignJustify, Eye
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

const ArticleEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [htmlMode, setHtmlMode] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');
  const [articleData, setArticleData] = useState({
    customId: '',
    title: '',
    excerpt: '',
    featuredImage: '',
    tags: ''
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      LineHeight,
      Link.configure({ openOnClick: false, linkOnPaste: true }),
      Image.configure({ allowBase64: true, inline: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify']
      }),
      Youtube.configure({ controls: false, nocookie: true })
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[400px] p-4 tiptap-editor'
      }
    }
  });

  useEffect(() => {
    if (id) {
      const fetchArticle = async () => {
        const foundArticle = await getArticleById(id);
        if (foundArticle) {
          setArticleData({
            customId: foundArticle.id || '',
            title: foundArticle.title || '',
            excerpt: foundArticle.excerpt || '',
            featuredImage: foundArticle.featuredImage || '',
            tags: Array.isArray(foundArticle.tags) ? foundArticle.tags.join(', ') : '',
          });
          if (editor && !editor.isDestroyed) {
            editor.commands.setContent(foundArticle.content || '');
          }
        }
      };
      fetchArticle();
    } else {
      setArticleData(prev => ({ ...prev, customId: Date.now().toString() }));
    }
  }, [id, editor]);

  const toggleHtmlMode = () => {
    if (htmlMode) {
      editor.commands.setContent(htmlContent);
    } else {
      setHtmlContent(editor.getHTML());
    }
    setHtmlMode(!htmlMode);
  };

  const handleHtmlChange = (e) => {
    setHtmlContent(e.target.value);
  };

  const handleSave = async (publish = false) => {
    if (!articleData.title) {
      toast({ title: 'Error', description: 'Title is required', variant: 'destructive' });
      return;
    }
    if (!articleData.customId) {
      toast({ title: 'Error', description: 'Article ID is required', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const tagsArray = articleData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag !== '');

      const finalContent = htmlMode ? htmlContent : editor.getHTML();

      const newArticle = {
        ...articleData,
        id: articleData.customId,
        content: finalContent,
        tags: tagsArray,
        published: publish === true,
        publishedAt: publish === true ? new Date().toISOString() : null,
      };

      await saveArticle(newArticle);

      if (publish === true) {
        notifySubscribers(newArticle);
      }

      toast({
        title: 'Success!',
        description: `Article ${publish ? 'published' : 'saved'} successfully.`,
      });

      if (id && id !== articleData.customId) {
        navigate(`/admin/editor/${articleData.customId}`);
      } else if (!id) {
        navigate('/admin');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save article.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const addImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const url = await uploadImage(file);
        editor.chain().focus().setImage({ src: url }).run();
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to upload image.', variant: 'destructive' });
      }
    }
    e.target.value = '';
  };

  const addImageUrl = () => {
    const url = window.prompt('Enter Image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const url = await uploadImage(file);
        const videoContent = `
          <div class="video-wrapper my-4">
            <video controls class="w-full rounded-lg shadow-lg" preload="metadata">
              <source src="${url}" type="${file.type}">
              Your browser does not support the video tag.
            </video>
          </div><p></p>`;
        editor.commands.insertContent(videoContent);
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to upload video.', variant: 'destructive' });
      }
    }
    e.target.value = '';
  };

  const addVideoUrl = () => {
    const url = window.prompt('Enter Video URL (YouTube or .mp4 link):');
    if (url) {
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        editor.commands.setYoutubeVideo({ src: url, width: 640, height: 480 });
      } else {
        const videoContent = `
          <div class="video-wrapper my-4">
            <video controls class="w-full rounded-lg shadow-lg" preload="metadata">
              <source src="${url}">
              Your browser does not support the video tag.
            </video>
          </div><p></p>`;
        editor.commands.insertContent(videoContent);
      }
    }
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  if (!editor) return null;

  return (
    <>
      <Helmet>
        <title>{id ? `Edit: ${articleData.title}` : 'New Article'} - GuideLines</title>
      </Helmet>

      <div className="min-h-screen bg-muted/30 pb-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={() => navigate('/admin')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-3xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
                {id ? 'Edit Article' : 'Create New Article'}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {id && (
                <Button variant="ghost" size="sm" onClick={() => window.open(`/article/${articleData.customId}`, '_blank')}>
                  <Eye className="h-4 w-4 mr-2" /> Preview
                </Button>
              )}
              <Button variant="outline" onClick={() => handleSave(false)} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" /> Save Draft
              </Button>
              <Button className="luxury-gold-gradient text-black font-semibold" onClick={() => handleSave(true)} disabled={isSaving}>
                <Send className="h-4 w-4 mr-2" /> Publish
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Article Title</label>
                    <Input
                      placeholder="Enter a compelling title..."
                      value={articleData.title}
                      onChange={(e) => setArticleData({ ...articleData, title: e.target.value })}
                      className="text-xl font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Excerpt</label>
                    <Textarea
                      placeholder="Brief summary for the preview card..."
                      value={articleData.excerpt}
                      onChange={(e) => setArticleData({ ...articleData, excerpt: e.target.value })}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <div className="border-b bg-muted/50 p-2 flex flex-wrap gap-2 sticky top-16 z-10 items-center">
                  <Button
                    type="button"
                    variant={htmlMode ? 'default' : 'outline'}
                    size="sm"
                    onClick={toggleHtmlMode}
                    title="Toggle HTML Mode"
                  >
                    <Code className="h-4 w-4 mr-1" /> HTML
                  </Button>

                  <div className="w-px bg-border h-6 mx-1"></div>

                  {!htmlMode && (
                    <>
                      <Button type="button" variant="outline" size="sm" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'bg-muted' : ''}>
                        <Bold className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'bg-muted' : ''}>
                        <Italic className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive('underline') ? 'bg-muted' : ''}>
                        <UnderlineIcon className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive('strike') ? 'bg-muted' : ''}>
                        <Strikethrough className="h-4 w-4" />
                      </Button>

                      <div className="w-px bg-border h-6 mx-1"></div>

                      <Button type="button" variant="outline" size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive('heading', { level: 1 }) ? 'bg-muted' : ''}>
                        <Heading1 className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'bg-muted' : ''}>
                        <Heading2 className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={editor.isActive('heading', { level: 3 }) ? 'bg-muted' : ''}>
                        <Heading3 className="h-4 w-4" />
                      </Button>

                      <div className="w-px bg-border h-6 mx-1"></div>

                      <Button type="button" variant="outline" size="sm" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={editor.isActive({ textAlign: 'left' }) ? 'bg-muted' : ''}>
                        <AlignLeft className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={editor.isActive({ textAlign: 'center' }) ? 'bg-muted' : ''}>
                        <AlignCenter className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={editor.isActive({ textAlign: 'right' }) ? 'bg-muted' : ''}>
                        <AlignRight className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={editor.isActive({ textAlign: 'justify' }) ? 'bg-muted' : ''}>
                        <AlignJustify className="h-4 w-4" />
                      </Button>

                      <div className="w-px bg-border h-6 mx-1"></div>

                      <Button type="button" variant="outline" size="sm" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'bg-muted' : ''}>
                        <List className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'bg-muted' : ''}>
                        <ListOrdered className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={editor.isActive('blockquote') ? 'bg-muted' : ''}>
                        <Quote className="h-4 w-4" />
                      </Button>

                      <div className="w-px bg-border h-6 mx-1"></div>

                      <Button type="button" variant="outline" size="sm" onClick={setLink} className={editor.isActive('link') ? 'bg-muted' : ''} title="Link">
                        <Link2 className="h-4 w-4" />
                      </Button>

                      <div className="relative inline-block">
                        <input type="file" id="editor-image-upload" className="hidden" accept="image/*" onChange={addImageUpload} />
                        <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('editor-image-upload').click()} title="Upload Image">
                          <ImageIcon className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={addImageUrl} title="Image from URL">
                        <ImagePlus className="h-4 w-4" />
                      </Button>

                      <div className="relative inline-block">
                        <input type="file" id="editor-video-upload" className="hidden" accept="video/*" onChange={addVideoUpload} />
                        <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('editor-video-upload').click()} title="Upload Video">
                          <Video className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={addVideoUrl} title="Video URL">
                        <Film className="h-4 w-4" />
                      </Button>

                      <Button type="button" variant="outline" size="sm" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run()} title="Table">
                        <TableIcon className="h-4 w-4" />
                      </Button>

                      <div className="w-px bg-border h-6 mx-1"></div>

                      <Button type="button" variant="outline" size="sm" onClick={() => editor.chain().focus().undo().run()}>
                        <Undo className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => editor.chain().focus().redo().run()}>
                        <Redo className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>

                {htmlMode ? (
                  <Textarea
                    className="min-h-[400px] font-mono text-sm p-4 w-full bg-slate-950 text-slate-50"
                    value={htmlContent}
                    onChange={handleHtmlChange}
                    spellCheck={false}
                  />
                ) : (
                  <EditorContent editor={editor} />
                )}
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Featured Image URL</label>
                    <div className="space-y-2">
                      <Input
                        placeholder="https://images.unsplash.com/..."
                        value={articleData.featuredImage}
                        onChange={(e) => setArticleData({ ...articleData, featuredImage: e.target.value })}
                      />
                      {articleData.featuredImage && (
                        <div className="aspect-video rounded-lg overflow-hidden border">
                          <img src={articleData.featuredImage} alt="Featured preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Tags (comma separated)</label>
                    <Input
                      placeholder="Genetics, Cardiology, Research"
                      value={articleData.tags}
                      onChange={(e) => setArticleData({ ...articleData, tags: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block text-primary">Article ID (URL Slug)</label>
                    <Input
                      placeholder="custom-article-url-id"
                      value={articleData.customId}
                      onChange={(e) => setArticleData({ ...articleData, customId: e.target.value })}
                      className="font-mono text-sm bg-muted/20 border-primary/20 focus:border-primary"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      This defines the article's URL address. Example: /article/my-article-slug
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ArticleEditor;