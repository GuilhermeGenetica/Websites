import React, { useState, useEffect, useRef, useMemo } from 'react';
// Importações do React Quill
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Estilo padrão do editor
import ImageResize from 'quill-image-resize-module-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Save } from 'lucide-react';

// Regista o módulo de redimensionamento de imagem com o Quill
Quill.register('modules/imageResize', ImageResize);

const API_URL = import.meta.env.DEV ? '/api/api.php' : 'https://fenixpt.onnetweb.com/api/api.php';

// O componente LoginModal não precisa de alterações.
export const LoginModal = ({ isOpen, onClose, onLoginSuccess, loginUser }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const user = await loginUser({ email, password });
            onLoginSuccess(user);
        } catch (err) {
            setError(err.message || 'Falha no login. Verifique as suas credenciais.');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Login</DialogTitle>
                    <DialogDescription>
                        Aceda com as suas credenciais de administrador ou validador.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <DialogFooter>
                        <Button type="submit">Entrar</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};


export const PostModal = ({ post, isOpen, onClose, addPost, updatePost }) => {
    const { toast } = useToast();
    const [localPost, setLocalPost] = useState(null);
    const [editorContent, setEditorContent] = useState('');
    const quillRef = useRef(null); // Referência para a instância do editor Quill

    useEffect(() => {
        if (post) {
            const postCopy = JSON.parse(JSON.stringify(post));
            setLocalPost(postCopy);
            setEditorContent(postCopy.content || '');
        }
    }, [post]);

    // Lida com o upload de imagens
    const imageHandler = () => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = async () => {
            const file = input.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('file', file);

            try {
                toast({ title: 'A carregar imagem...', description: 'Por favor, aguarde.' });
                const response = await fetch(`${API_URL}?endpoint=upload_media`, { method: 'POST', body: formData });
                const result = await response.json();
                if (!result.success) throw new Error(result.message);

                // Insere a imagem no editor com o URL retornado pela API
                const quill = quillRef.current.getEditor();
                const range = quill.getSelection(true);
                quill.insertEmbed(range.index, 'image', result.url);
                toast({ title: 'Imagem carregada com sucesso!' });
            } catch (error) {
                toast({ title: 'Erro no upload', description: error.message, variant: 'destructive' });
            }
        };
    };

    // Configuração dos módulos do editor Quill
    const modules = useMemo(() => ({
        toolbar: {
            container: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
                ['link', 'image'], // O botão 'image' agora vai acionar o nosso 'imageHandler'
                [{ 'align': [] }],
                ['clean']
            ],
            handlers: {
                image: imageHandler // Associa o botão de imagem à nossa função customizada
            }
        },
        imageResize: {
            parchment: Quill.import('parchment'),
            modules: ['Resize', 'DisplaySize']
        }
    }), []);

    if (!isOpen || !localPost) return null;

    const handleInputChange = (field, value) => {
        setLocalPost(prev => ({ ...prev, [field]: value }));
    };

    const handleDateChange = (e) => {
        const localDate = new Date(e.target.value);
        if (isValid(localDate)) {
            handleInputChange('createdAt', localDate.toISOString());
        }
    };

    const formatDateForInput = (isoDate) => {
        if (!isoDate || !isValid(parseISO(isoDate))) return '';
        const date = new Date(isoDate);
        return date.getFullYear() +
               '-' + String(date.getMonth() + 1).padStart(2, '0') +
               '-' + String(date.getDate()).padStart(2, '0') +
               'T' + String(date.getHours()).padStart(2, '0') +
               ':' + String(date.getMinutes()).padStart(2, '0');
    };

    const handleSave = async () => {
        const isNew = !post.id || !post.createdAt;
        const finalPost = { ...localPost, content: editorContent, updatedAt: new Date().toISOString() };
        
        try {
            if (isNew) {
                await addPost(finalPost);
                toast({ title: "Post criado com sucesso!" });
            } else {
                await updatePost(finalPost);
                toast({ title: "Post atualizado com sucesso!" });
            }
            onClose();
        } catch (error) {
            toast({ title: "Erro ao salvar", description: `Não foi possível salvar o post. Detalhe: ${error.message}`, variant: "destructive" });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl w-[95vw] h-[90vh] flex flex-col">
                <DialogHeader className="flex-row justify-between items-center p-4 border-b">
                    <div className="flex flex-col">
                       <DialogTitle>{localPost.id ? 'Editar Post' : 'Novo Post'}</DialogTitle>
                       <DialogDescription>Use o editor abaixo para criar e formatar o seu conteúdo.</DialogDescription>
                    </div>
                    <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Salvar</Button>
                </DialogHeader>
                
                {/* ALTERAÇÃO: Adicionado 'overflow-y-auto' para permitir o scroll vertical */}
                <div className="p-4 flex-grow flex flex-col overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border rounded-md p-4 mb-4">
                        <div className="space-y-2"><Label htmlFor="title">Título</Label><Input id="title" value={localPost.title} onChange={e => handleInputChange('title', e.target.value)} /></div>
                        <div className="space-y-2"><Label htmlFor="theme">Tema</Label><Input id="theme" value={localPost.theme} onChange={e => handleInputChange('theme', e.target.value)} /></div>
                        <div className="space-y-2"><Label htmlFor="author">Autor</Label><Input id="author" value={localPost.author} onChange={e => handleInputChange('author', e.target.value)} /></div>
                        <div className="space-y-2"><Label htmlFor="createdAt">Criado em</Label><Input id="createdAt" type="datetime-local" value={formatDateForInput(localPost.createdAt)} onChange={handleDateChange} /></div>
                        <div className="space-y-2 col-span-full"><Label htmlFor="description">Descrição</Label><Textarea id="description" value={localPost.description} onChange={e => handleInputChange('description', e.target.value)} className="h-20" /></div>
                    </div>

                    {/* Componente Editor do React Quill */}
                    <div className="flex-grow min-h-[300px] flex flex-col">
                        <ReactQuill
                            ref={quillRef}
                            theme="snow"
                            value={editorContent}
                            onChange={setEditorContent}
                            modules={modules}
                            className="flex-grow"
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};


// O componente DetailModal não precisa de alterações.
export const DetailModal = ({ post, isOpen, onClose }) => {
    if (!isOpen || !post) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl w-[90vw] h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{post.title}</DialogTitle>
                    <DialogDescription>
                        Por {post.author} em {format(parseISO(post.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </DialogDescription>
                </DialogHeader>
                <div className="overflow-y-auto p-4 flex-grow prose dark:prose-invert max-w-none"
                     dangerouslySetInnerHTML={{ __html: post.content }}
                />
                <DialogFooter>
                    <Button onClick={onClose}>Fechar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
