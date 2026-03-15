// src/services/mediaService.js
import api from '@/services/api';

export const hashFileName = (fileName) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const extension = fileName.split('.').pop();
  return `${timestamp}_${random}.${extension}`;
};

export const uploadImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const result = await api.upload('?action=uploadImage', formData);
    return result.url;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};

export const getUploadedMedia = () => {
  return [];
};