import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Pin, PinOff, Eye } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PostCard = ({ post, isPinned, isAuthenticated, currentUser, onTogglePin, onViewDetails, onEdit, onDelete }) => {
    return (
        <motion.div 
            layout 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }} 
            transition={{ duration: 0.3 }} 
            key={post.id}
            className={`bg-card text-card-foreground rounded-xl shadow-lg p-5 flex flex-col border-l-4 ${isPinned ? 'border-amber-400' : 'border-green-600'} masonry-item`}
        >
            <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-primary">{post.title}</h3>
                {isAuthenticated && (
                    <Button variant="ghost" size="icon" onClick={() => onTogglePin(post)}>
                        {post.pinned ? <PinOff className="h-5 w-5 text-amber-400" /> : <Pin className="h-5 w-5" />}
                    </Button>
                )}
            </div>
            <p className="text-sm font-semibold text-primary/80 mb-3">{post.theme}</p>
            <p className="text-sm text-muted-foreground mb-4 flex-grow">{post.description}</p>
            <div className="text-xs text-muted-foreground border-t pt-3 mt-auto space-y-1">
                <p><strong>Autor:</strong> {post.author}</p>
                <p><strong>Publicado:</strong> {format(parseISO(post.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
            </div>
            <div className="flex justify-between items-center mt-4">
                <Button onClick={() => onViewDetails(post)}><Eye className="mr-2 h-4 w-4" /> Ver Post</Button>
                {isAuthenticated && (currentUser.accessLevel === 'admin' || currentUser.name === post.author) && (
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => onEdit(post)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="destructive" size="icon" onClick={() => onDelete(post)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default PostCard;
