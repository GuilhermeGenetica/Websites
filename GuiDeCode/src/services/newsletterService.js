// src/services/newsletterService.js
import api from '@/services/api';

export const subscribeToNewsletter = async (email) => {
  try {
    return await api.post('?action=subscribe', { email });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return { success: false, message: 'Falha na conexão com o servidor.' };
  }
};

export const getSubscribers = () => {
  return [];
};

export const notifySubscribers = (article) => {
  console.log(`Sending notification to backend for: ${article.title}`);
  return [];
};