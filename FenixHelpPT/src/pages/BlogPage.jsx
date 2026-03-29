import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { AnimatePresence, motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { FilePlus, SortAsc, LogIn, LogOut } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { parseISO } from 'date-fns';
import { LoginModal, PostModal, DetailModal } from './PostModals';
import PostCard from './PostCard';

const BlogPage = () => {
    const { posts, addPost, updatePost, deletePost, loginUser } = useData();
    const { toast } = useToast();

    const [sortOrder, setSortOrder] = useState('createdAt');
    const [isLoginModalOpen, setLoginModalOpen] = useState(false);
    const [isPostModalOpen, setPostModalOpen] = useState(false);
    const [isDetailModalOpen, setDetailModalOpen] = useState(false);
    const [editingPost, setEditingPost] = useState(null);
    const [currentDetailPost, setCurrentDetailPost] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const storedUser = sessionStorage.getItem('fenixUser');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            if (user && (user.accessLevel === 'admin' || user.accessLevel === 'validator')) {
                setCurrentUser(user);
                setIsAuthenticated(true);
            }
        }
    }, []);

    const sortedPosts = useMemo(() => {
        if (!posts) return { pinned: [], sorted: [] };
        const nonPinned = posts.filter(p => !p.pinned);
        const sorted = [...nonPinned].sort((a, b) => {
            switch (sortOrder) {
                case 'title': return a.title.localeCompare(b.title);
                case 'theme': return a.theme.localeCompare(b.theme);
                case 'author': return a.author.localeCompare(b.author);
                case 'createdAt':
                default:
                    return parseISO(b.createdAt) - parseISO(a.createdAt);
            }
        });
        const pinned = posts.filter(p => p.pinned).sort((a, b) => parseISO(b.createdAt) - parseISO(a.createdAt));
        return { pinned, sorted };
    }, [posts, sortOrder]);

    const handleLoginSuccess = (user) => {
        setCurrentUser(user);
        setIsAuthenticated(true);
        setLoginModalOpen(false);
        toast({ title: "Login bem-sucedido", description: `Bem-vindo, ${user.name}!` });
    };

    const handleLogoutClick = () => {
        sessionStorage.removeItem('fenixUser');
        setCurrentUser(null);
        setIsAuthenticated(false);
        toast({ title: "Sessão terminada", description: "Volte sempre!" });
    };

    const handleNewPost = () => {
        const newPost = {
            title: 'Novo Rascunho',
            theme: 'Geral',
            author: currentUser.name,
            description: 'Breve descrição do seu novo post...',
            content: '<p>Comece a escrever aqui...</p>',
            pinned: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        setEditingPost(newPost);
        setPostModalOpen(true);
    };

    const handleEditPost = (post) => {
        setEditingPost(post);
        setPostModalOpen(true);
    };

    const handleDeletePost = async (post) => {
        if (window.confirm('Tem a certeza que deseja apagar este post? Todos os ficheiros associados serão removidos permanentemente.')) {
            try {
                await deletePost(post.id);
                toast({ title: "Post apagado", description: "O post e os seus ficheiros foram removidos." });
            } catch (error) {
                toast({ title: "Erro ao apagar", description: "Não foi possível apagar o post.", variant: "destructive" });
            }
        }
    };

    const handleViewDetails = (post) => {
        setCurrentDetailPost(post);
        setDetailModalOpen(true);
    };

    const togglePinPost = async (post) => {
        const updatedPost = { ...post, pinned: !post.pinned };
        await updatePost(updatedPost);
        toast({ title: `Post ${updatedPost.pinned ? 'afixado' : 'desafixado'} com sucesso!` });
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Helmet>
                <title>Blog - Projeto Fénix</title>
                <style>{`
                    .editor-content img { max-width: 100%; height: auto; }
                    .editor-content a { color: #2563eb; text-decoration: underline; }
                    .prose img { max-width: 100%; height: auto; margin: 1em 0; }
                `}</style>
            </Helmet>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <h1 className="text-3xl font-bold text-primary">Notas Importantes e Documentos Úteis </h1>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="outline"><SortAsc className="mr-2 h-4 w-4"/>Ordenar</Button></DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onSelect={() => setSortOrder('createdAt')}>Data</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setSortOrder('title')}>Título</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setSortOrder('theme')}>Tema</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setSortOrder('author')}>Autor</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        {isAuthenticated && (<Button onClick={handleNewPost}><FilePlus className="mr-2 h-4 w-4"/>Novo Post</Button>)}
                    </div>
                    <div className="flex items-center gap-2">
                        {isAuthenticated ? (
                               <Button variant="ghost" size="icon" onClick={handleLogoutClick} title="Sair"><LogOut className="h-5 w-5"/></Button>
                        ) : (
                            <Button variant="ghost" size="icon" onClick={() => setLoginModalOpen(true)} title="Entrar"><LogIn className="h-5 w-5"/></Button>
                        )}
                    </div>
                </div>
              <div className="masonry-grid">
                  <AnimatePresence>
                      {posts && posts.length > 0 ? (
                        <>
                          {sortedPosts.pinned.map(post => 
                            <PostCard 
                                key={post.id} 
                                post={post} 
                                isPinned={true}
                                isAuthenticated={isAuthenticated}
                                currentUser={currentUser}
                                onTogglePin={togglePinPost}
                                onViewDetails={handleViewDetails}
                                onEdit={handleEditPost}
                                onDelete={handleDeletePost}
                            />
                          )}
                          {sortedPosts.sorted.map(post => 
                            <PostCard 
                                key={post.id} 
                                post={post} 
                                isPinned={false}
                                isAuthenticated={isAuthenticated}
                                currentUser={currentUser}
                                onTogglePin={togglePinPost}
                                onViewDetails={handleViewDetails}
                                onEdit={handleEditPost}
                                onDelete={handleDeletePost}
                            />
                          )}
                        </>
                      ) : (
                        <p>A carregar posts ou nenhum post encontrado...</p>
                      )}
                  </AnimatePresence>
              </div>
            </main>
            <AnimatePresence>
                {isLoginModalOpen && <LoginModal isOpen={isLoginModalOpen} onClose={() => setLoginModalOpen(false)} onLoginSuccess={handleLoginSuccess} loginUser={loginUser} />}
                {isPostModalOpen && <PostModal key={editingPost ? editingPost.id || 'new' : 'empty'} post={editingPost} isOpen={isPostModalOpen} onClose={() => setPostModalOpen(false)} addPost={addPost} updatePost={updatePost} />}
                {isDetailModalOpen && <DetailModal post={currentDetailPost} isOpen={isDetailModalOpen} onClose={() => setDetailModalOpen(false)} />}
            </AnimatePresence>
        </div>
    );
};

export default BlogPage;
