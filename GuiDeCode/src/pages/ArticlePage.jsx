import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Eye, Tag, Share2, Calendar, User, Facebook, Twitter, Linkedin, Copy, Check, BookOpen, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Header from '@/components/Header';
import { getArticleById, getPublishedArticles, incrementViews } from '@/services/articleService';
import { useToast } from '@/components/ui/use-toast';

const ArticlePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [readProgress, setReadProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setReadProgress(progress);
      setShowScrollTop(scrollTop > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const foundArticle = await getArticleById(id);
        if (foundArticle) {
          setArticle(foundArticle);
          incrementViews(id);

          const allArticles = await getPublishedArticles();
          const related = allArticles
            .filter(a => a.id !== id)
            .filter(a => {
              if (!Array.isArray(foundArticle.tags) || !Array.isArray(a.tags)) return false;
              return a.tags.some(tag => foundArticle.tags.includes(tag));
            })
            .slice(0, 3);
          setRelatedArticles(related);
        } else {
          setArticle(null);
        }
      } catch (error) {
        setArticle(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    window.scrollTo({ top: 0 });
  }, [id]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast({ title: 'Link copied!', description: 'Article link copied to clipboard.' });
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-[hsl(var(--luxury-gold))]/30 border-t-[hsl(var(--luxury-gold))] rounded-full animate-spin"></div>
        </div>
      </>
    );
  }

  if (!article) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
          <BookOpen size={64} className="text-muted-foreground/30 mb-6" />
          <h1 className="text-3xl font-bold mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
            Article Not Found
          </h1>
          <p className="text-muted-foreground mb-8">The article you are looking for does not exist or has been removed.</p>
          <Link to="/blog">
            <Button className="luxury-gold-gradient text-black font-semibold">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog
            </Button>
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{article.title} | GuideLines</title>
        <meta name="description" content={article.excerpt || ''} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.excerpt || ''} />
        {article.featuredImage && <meta property="og:image" content={article.featuredImage} />}
      </Helmet>

      <Header />

      <div className="fixed top-0 left-0 w-full h-1 z-[100]">
        <div
          className="h-full bg-gradient-to-r from-[hsl(var(--luxury-gold))] to-amber-400 transition-all duration-150"
          style={{ width: `${readProgress}%` }}
        ></div>
      </div>

      <main className="min-h-screen bg-background">

        {article.featuredImage && (
          <section className="relative h-[50vh] md:h-[60vh] overflow-hidden">
            <img
              src={article.featuredImage}
              alt={article.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent"></div>
          </section>
        )}

        <article className="container mx-auto px-6 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={article.featuredImage ? '-mt-32 relative z-10' : 'pt-12'}
          >
            <div className="mb-6">
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-[hsl(var(--luxury-gold))] transition-colors mb-6"
              >
                <ArrowLeft size={16} /> Back to Blog
              </Link>
            </div>

            {Array.isArray(article.tags) && article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {article.tags.map(tag => (
                  <Link
                    key={tag}
                    to={`/blog?tag=${encodeURIComponent(tag)}`}
                    className="px-3 py-1 bg-[hsl(var(--luxury-gold))]/10 text-[hsl(var(--luxury-gold))] rounded-full text-xs font-medium hover:bg-[hsl(var(--luxury-gold))]/20 transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            )}

            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              {article.title}
            </h1>

            {article.excerpt && (
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed border-l-4 border-[hsl(var(--luxury-gold))] pl-6 italic">
                {article.excerpt}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-8 pb-8 border-b border-border">
              <span className="flex items-center gap-2">
                <User size={16} />
                Dr. Guilherme de Macedo Oliveira
              </span>
              <span className="flex items-center gap-2">
                <Calendar size={16} />
                {formatDate(article.publishedAt || article.createdAt)}
              </span>
              <span className="flex items-center gap-2">
                <Eye size={16} />
                {article.views || 0} views
              </span>
            </div>

            <div
              className="article-content prose prose-lg max-w-none dark:prose-invert mb-16"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            <div className="flex items-center justify-between py-8 border-t border-b border-border mb-16">
              <span className="text-sm text-muted-foreground font-medium">Share this article</span>
              <div className="flex items-center gap-3">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <Twitter size={18} />
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <Facebook size={18} />
                </a>
                <a
                  href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(article.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <Linkedin size={18} />
                </a>
                <button onClick={copyLink} className="p-2 rounded-full hover:bg-muted transition-colors">
                  {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                </button>
              </div>
            </div>
          </motion.div>

          {relatedArticles.length > 0 && (
            <section className="mb-16">
              <h2 className="text-2xl font-bold mb-8" style={{ fontFamily: 'Playfair Display, serif' }}>
                Related Articles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedArticles.map(related => (
                  <Link key={related.id} to={`/article/${related.id}`} className="group">
                    <Card className="overflow-hidden hover:border-[hsl(var(--luxury-gold))]/50 transition-all duration-300">
                      <div className="aspect-video overflow-hidden">
                        {related.featuredImage ? (
                          <img
                            src={related.featuredImage}
                            alt={related.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[hsl(var(--luxury-navy))] to-[hsl(var(--luxury-navy))]/60 flex items-center justify-center">
                            <BookOpen size={32} className="text-[hsl(var(--luxury-gold))]/20" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold line-clamp-2 group-hover:text-[hsl(var(--luxury-gold))] transition-colors" style={{ fontFamily: 'Playfair Display, serif' }}>
                          {related.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDate(related.publishedAt || related.createdAt)}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>

        {showScrollTop && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-8 right-8 p-3 rounded-full bg-[hsl(var(--luxury-gold))] text-black shadow-lg hover:scale-110 transition-transform z-50"
          >
            <ChevronUp size={20} />
          </button>
        )}
      </main>
    </>
  );
};

export default ArticlePage;