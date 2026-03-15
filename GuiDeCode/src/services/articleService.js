import { blogApi } from '@/services/api';

const getFirstImageFromContent = (htmlContent) => {
  if (!htmlContent) return null;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const img = doc.querySelector('img');
    return img ? img.getAttribute('src') : null;
  } catch (e) {
    console.warn("Erro ao extrair imagem do conteúdo:", e);
    return null;
  }
};

const normalizeArticle = (article) => {
  let parsedTags = [];
  try {
    parsedTags = typeof article.tags === 'string'
      ? JSON.parse(article.tags)
      : (Array.isArray(article.tags) ? article.tags : []);
  } catch (e) {
    if (typeof article.tags === 'string') {
      parsedTags = article.tags.split(',').map(t => t.trim());
    }
  }

  const contentImage = getFirstImageFromContent(article.content);
  const finalFeaturedImage = article.featured_image || article.featuredImage || contentImage;

  return {
    ...article,
    id: String(article.id),
    tags: parsedTags,
    featuredImage: finalFeaturedImage,
    featured_image: finalFeaturedImage,
    published: article.published === true || article.published === "1" || article.published === 1,
    createdAt: article.created_at || article.createdAt,
    updatedAt: article.updated_at || article.updatedAt,
    publishedAt: article.published_at || article.publishedAt,
  };
};

export const getArticles = async () => {
  try {
    const rawArticles = await blogApi.getArticles();
    if (!Array.isArray(rawArticles)) {
      console.error("API response is not an array:", rawArticles);
      return [];
    }
    return rawArticles.map(normalizeArticle);
  } catch (error) {
    console.error("Failed to fetch articles:", error);
    return [];
  }
};

export const getPublishedArticles = async () => {
  try {
    const rawArticles = await blogApi.getPublishedArticles();
    if (!Array.isArray(rawArticles)) return [];
    return rawArticles.map(normalizeArticle);
  } catch (error) {
    console.error("Failed to fetch published articles:", error);
    return [];
  }
};

export const getArticleById = async (id) => {
  try {
    const article = await blogApi.getArticleById(id);
    if (!article || article.error) return null;
    return normalizeArticle(article);
  } catch (error) {
    console.error("Failed to get article", error);
    return null;
  }
};

export const saveArticle = async (article) => {
  try {
    const articleData = {
      ...article,
      id: article.id || Date.now().toString(),
      featured_image: article.featuredImage || article.featured_image || '',
      published: article.published ? 1 : 0,
    };
    return await blogApi.saveArticle(articleData);
  } catch (error) {
    console.error("Error saving article:", error);
    throw error;
  }
};

export const publishArticle = async (id) => {
  try {
    return await blogApi.publishArticle(id);
  } catch (err) {
    throw err;
  }
};

export const deleteArticle = async (id) => {
  try {
    await blogApi.deleteArticle(id);
    return true;
  } catch (error) {
    console.error("Error deleting article:", error);
    throw error;
  }
};

export const incrementViews = async (id) => {
  try {
    await blogApi.incrementViews(id);
  } catch (error) {
    console.error("Error incrementing views:", error);
  }
};

export const initializeSampleArticles = async () => {
  console.log("Sample articles initializer called (No-op in production)");
};