import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getArticles, deleteArticle, publishArticle } from '@/services/articleService';
import { useToast } from '@/components/ui/use-toast';
import {
  Plus, Edit, Trash2, Eye, LogOut, CheckCircle, XCircle, Search,
  FileText, TrendingUp, Clock, BarChart3, Feather
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const AdminPanel = () => {
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [selectedTags, setSelectedTags] = useState(new Set());
  const [sortBy, setSortBy] = useState('updatedAt_desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const data = await getArticles();
      setArticles(data);
      setFilteredArticles(data);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load articles', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  useEffect(() => {
    let result = [...articles];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(article =>
        (article.title || '').toLowerCase().includes(query) ||
        (article.excerpt || '').toLowerCase().includes(query)
      );
    }

    if (selectedTags.size > 0) {
      result = result.filter(article =>
        article.tags?.some(tag => selectedTags.has(tag))
      );
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'updatedAt_desc':
          return new Date(b.updatedAt || b.updated_at || 0) - new Date(a.updatedAt || a.updated_at || 0);
        case 'created_at_desc':
          return new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0);
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        case 'views':
          return (b.views || 0) - (a.views || 0);
        default:
          return 0;
      }
    });

    setFilteredArticles(result);
  }, [articles, searchQuery, selectedTags, sortBy]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this article?')) {
      try {
        await deleteArticle(id);
        toast({ title: 'Success', description: 'Article deleted successfully' });
        fetchArticles();
      } catch {
        toast({ title: 'Error', description: 'Failed to delete article', variant: 'destructive' });
      }
    }
  };

  const handlePublish = async (id) => {
    try {
      await publishArticle(id);
      toast({ title: 'Success', description: 'Article published successfully' });
      fetchArticles();
    } catch {
      toast({ title: 'Error', description: 'Failed to publish article', variant: 'destructive' });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const allTags = [...new Set(articles.flatMap(a => a.tags || []))];
  const totalViews = articles.reduce((sum, a) => sum + (a.views || 0), 0);
  const publishedCount = articles.filter(a => a.published).length;
  const draftCount = articles.filter(a => !a.published).length;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - GuideLines</title>
      </Helmet>

      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-8">

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-full bg-[hsl(var(--luxury-gold))]">
                <Feather className="h-6 w-6 text-black" strokeWidth={1.5} />
              </div>
              <div>
                <h1 className="text-3xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Dashboard
                </h1>
                <p className="text-muted-foreground">Manage your GuideLines articles</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link to="/">
                <Button variant="outline">View Site</Button>
              </Link>
              <Link to="/blog">
                <Button variant="outline">View Blog</Button>
              </Link>
              <Button variant="destructive" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" /> Logout
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{articles.length}</p>
                  <p className="text-sm text-muted-foreground">Total Articles</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{publishedCount}</p>
                  <p className="text-sm text-muted-foreground">Published</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 rounded-lg">
                  <Clock className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{draftCount}</p>
                  <p className="text-sm text-muted-foreground">Drafts</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalViews.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Views</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-4 w-full md:w-auto flex-1">
              <div className="relative flex-1 md:max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search articles..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {allTags.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">Filter Tags</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuLabel>Filter by Tag</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {allTags.map(tag => (
                      <DropdownMenuCheckboxItem
                        key={tag}
                        checked={selectedTags.has(tag)}
                        onCheckedChange={(checked) => {
                          const newTags = new Set(selectedTags);
                          if (checked) { newTags.add(tag); } else { newTags.delete(tag); }
                          setSelectedTags(newTags);
                        }}
                      >
                        {tag}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updatedAt_desc">Last Updated</SelectItem>
                  <SelectItem value="created_at_desc">Newest Created</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="views">Most Views</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Link to="/admin/editor">
              <Button className="luxury-gold-gradient text-black font-semibold">
                <Plus className="h-4 w-4 mr-2" /> New Article
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-[hsl(var(--luxury-gold))]/30 border-t-[hsl(var(--luxury-gold))] rounded-full animate-spin"></div>
            </div>
          ) : filteredArticles.length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground text-lg">
                {searchQuery ? 'No articles match your search.' : 'No articles found. Create your first article!'}
              </p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredArticles.map((article, index) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card className="hover:border-[hsl(var(--luxury-gold))]/30 transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                          {article.featuredImage ? (
                            <img src={article.featuredImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FileText className="h-6 w-6 text-muted-foreground/30" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate">{article.title || 'Untitled'}</h3>
                            {article.published ? (
                              <span className="flex-shrink-0 px-2 py-0.5 bg-green-500/10 text-green-600 text-xs rounded-full font-medium">
                                Published
                              </span>
                            ) : (
                              <span className="flex-shrink-0 px-2 py-0.5 bg-amber-500/10 text-amber-600 text-xs rounded-full font-medium">
                                Draft
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{formatDate(article.updatedAt || article.updated_at)}</span>
                            <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {article.views || 0}</span>
                            {Array.isArray(article.tags) && article.tags.length > 0 && (
                              <span className="hidden md:inline">{article.tags.join(', ')}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!article.published && (
                            <Button variant="ghost" size="sm" onClick={() => handlePublish(article.id)} title="Publish">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            </Button>
                          )}
                          <Link to={`/article/${article.id}`} target="_blank">
                            <Button variant="ghost" size="sm" title="View">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link to={`/admin/editor/${article.id}`}>
                            <Button variant="ghost" size="sm" title="Edit">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(article.id)} title="Delete">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminPanel;