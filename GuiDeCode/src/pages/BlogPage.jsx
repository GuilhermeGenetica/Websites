import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, Eye, Tag, ArrowRight, Feather, ChevronLeft, ChevronRight, Calendar, User, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import Header from '@/components/Header';
import { getPublishedArticles } from '@/services/articleService';

const ARTICLES_PER_PAGE = 9;

const BlogPage = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        const data = await getPublishedArticles();
        setArticles(data || []);
      } catch (error) {
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  const allTags = useMemo(() => {
    const tagSet = new Set();
    articles.forEach(article => {
      if (Array.isArray(article.tags)) {
        article.tags.forEach(tag => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [articles]);

  const filteredArticles = useMemo(() => {
    let result = [...articles];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(article =>
        (article.title || '').toLowerCase().includes(query) ||
        (article.excerpt || '').toLowerCase().includes(query) ||
        (Array.isArray(article.tags) && article.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }

    if (selectedTag !== 'all') {
      result = result.filter(article =>
        Array.isArray(article.tags) && article.tags.includes(selectedTag)
      );
    }

    return result;
  }, [articles, searchQuery, selectedTag]);

  const totalPages = Math.ceil(filteredArticles.length / ARTICLES_PER_PAGE);
  const paginatedArticles = filteredArticles.slice(
    (currentPage - 1) * ARTICLES_PER_PAGE,
    currentPage * ARTICLES_PER_PAGE
  );

  const goToPage = (page) => {
    setSearchParams({ page: page.toString() });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setSearchParams({ page: '1' });
  };

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

  const featuredArticle = articles.length > 0 ? articles[0] : null;

  return (
    <>
      <Helmet>
        <title>GuideLines | Clinical Articles & Medical Research</title>
        <meta name="description" content="Explore clinical guidelines, medical genetics articles, and precision medicine research by Dr. Guilherme de Macedo Oliveira." />
      </Helmet>

      <Header />

      <main className="min-h-screen bg-background">

        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--luxury-navy))] to-background"></div>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-10 w-72 h-72 bg-[hsl(var(--luxury-gold))] rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-20 w-96 h-96 bg-[hsl(var(--luxury-navy))] rounded-full blur-3xl"></div>
          </div>
          <div className="container mx-auto px-6 relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-[hsl(var(--luxury-gold))]/10 rounded-full border border-[hsl(var(--luxury-gold))]/20">
                <Feather size={18} className="text-[hsl(var(--luxury-gold))]" />
                <span className="text-sm font-medium text-[hsl(var(--luxury-gold))]">Clinical Knowledge Base</span>
              </div>
              <h1
                className="text-5xl md:text-6xl font-bold mb-4 text-white"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                Guide<span className="text-[hsl(var(--luxury-gold))]">Lines</span>
              </h1>
              <p className="text-lg text-white/70 max-w-2xl mx-auto">
                Clinical articles, medical genetics research, and precision medicine guidelines curated by Dr. Guilherme de Macedo Oliveira.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-10 max-w-xl mx-auto"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                <Input
                  type="search"
                  placeholder="Search articles, topics, tags..."
                  className="pl-12 h-14 bg-white/10 border-white/20 text-white placeholder:text-white/40 text-lg rounded-xl backdrop-blur-md"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </motion.div>
          </div>
        </section>

        {allTags.length > 0 && (
          <section className="py-6 border-b border-border bg-background/50 backdrop-blur-sm sticky top-16 z-30">
            <div className="container mx-auto px-6">
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                <Tag size={16} className="text-muted-foreground flex-shrink-0" />
                <button
                  onClick={() => { setSelectedTag('all'); setSearchParams({ page: '1' }); }}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    selectedTag === 'all'
                      ? 'bg-[hsl(var(--luxury-gold))] text-black'
                      : 'bg-muted hover:bg-muted/80 text-foreground'
                  }`}
                >
                  All
                </button>
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => { setSelectedTag(tag); setSearchParams({ page: '1' }); }}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      selectedTag === tag
                        ? 'bg-[hsl(var(--luxury-gold))] text-black'
                        : 'bg-muted hover:bg-muted/80 text-foreground'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {featuredArticle && !searchQuery && selectedTag === 'all' && currentPage === 1 && (
          <section className="py-12">
            <div className="container mx-auto px-6">
              <Link to={`/article/${featuredArticle.id}`}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="group relative rounded-2xl overflow-hidden border border-border hover:border-[hsl(var(--luxury-gold))]/50 transition-all duration-500"
                >
                  <div className="grid md:grid-cols-2 gap-0">
                    <div className="aspect-video md:aspect-auto md:h-full relative overflow-hidden">
                      {featuredArticle.featuredImage ? (
                        <img
                          src={featuredArticle.featuredImage}
                          alt={featuredArticle.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full min-h-[300px] bg-gradient-to-br from-[hsl(var(--luxury-navy))] to-[hsl(var(--luxury-navy))]/80 flex items-center justify-center">
                          <BookOpen size={64} className="text-[hsl(var(--luxury-gold))]/30" />
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-[hsl(var(--luxury-gold))] text-black text-xs font-bold rounded-full uppercase tracking-wider">
                          Featured
                        </span>
                      </div>
                    </div>
                    <div className="p-8 md:p-12 flex flex-col justify-center">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {formatDate(featuredArticle.publishedAt || featuredArticle.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye size={14} />
                          {featuredArticle.views || 0} views
                        </span>
                      </div>
                      <h2
                        className="text-3xl md:text-4xl font-bold mb-4 group-hover:text-[hsl(var(--luxury-gold))] transition-colors"
                        style={{ fontFamily: 'Playfair Display, serif' }}
                      >
                        {featuredArticle.title}
                      </h2>
                      <p className="text-muted-foreground leading-relaxed mb-6 line-clamp-3">
                        {featuredArticle.excerpt}
                      </p>
                      {Array.isArray(featuredArticle.tags) && featuredArticle.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-6">
                          {featuredArticle.tags.map(tag => (
                            <span key={tag} className="px-3 py-1 bg-muted rounded-full text-xs font-medium text-muted-foreground">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-[hsl(var(--luxury-gold))] font-medium group-hover:gap-4 transition-all">
                        Read Article <ArrowRight size={16} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            </div>
          </section>
        )}

        <section className="py-12">
          <div className="container mx-auto px-6">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-[hsl(var(--luxury-gold))]/30 border-t-[hsl(var(--luxury-gold))] rounded-full animate-spin"></div>
              </div>
            ) : paginatedArticles.length === 0 ? (
              <div className="text-center py-20">
                <BookOpen size={48} className="mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No articles found</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? 'Try adjusting your search terms.' : 'New content is coming soon.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence mode="popLayout">
                  {paginatedArticles.map((article, index) => (
                    <motion.div
                      key={article.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                    >
                      <Link to={`/article/${article.id}`} className="group block h-full">
                        <Card className="h-full overflow-hidden border-border hover:border-[hsl(var(--luxury-gold))]/50 hover:shadow-xl transition-all duration-500">
                          <div className="aspect-video relative overflow-hidden">
                            {article.featuredImage ? (
                              <img
                                src={article.featuredImage}
                                alt={article.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-[hsl(var(--luxury-navy))] to-[hsl(var(--luxury-navy))]/60 flex items-center justify-center">
                                <Feather size={40} className="text-[hsl(var(--luxury-gold))]/20" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                          </div>
                          <CardContent className="p-6">
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                              <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {formatDate(article.publishedAt || article.createdAt)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye size={12} />
                                {article.views || 0}
                              </span>
                            </div>
                            <h3
                              className="text-xl font-bold mb-2 line-clamp-2 group-hover:text-[hsl(var(--luxury-gold))] transition-colors"
                              style={{ fontFamily: 'Playfair Display, serif' }}
                            >
                              {article.title}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-3 mb-4 leading-relaxed">
                              {article.excerpt}
                            </p>
                            {Array.isArray(article.tags) && article.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {article.tags.slice(0, 3).map(tag => (
                                  <span key={tag} className="px-2 py-0.5 bg-muted rounded text-xs text-muted-foreground">
                                    {tag}
                                  </span>
                                ))}
                                {article.tags.length > 3 && (
                                  <span className="px-2 py-0.5 text-xs text-muted-foreground">
                                    +{article.tags.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-16">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft size={16} />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    variant={page === currentPage ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => goToPage(page)}
                    className={page === currentPage ? 'luxury-gold-gradient text-black' : ''}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            )}
          </div>
        </section>

        <footer className="py-12 border-t border-border">
          <div className="container mx-auto px-6 text-center">
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-[hsl(var(--luxury-gold))] transition-colors">
              <ArrowRight size={16} className="rotate-180" />
              Back to Portfolio
            </Link>
            <p className="text-xs text-muted-foreground mt-4">
              &copy; {new Date().getFullYear()} Dr. Guilherme de Macedo Oliveira. All rights reserved.
            </p>
          </div>
        </footer>
      </main>
    </>
  );
};

export default BlogPage;