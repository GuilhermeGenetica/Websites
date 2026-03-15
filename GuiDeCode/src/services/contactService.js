// src/services/contactService.js
import { contactApi } from '@/services/api';

export const submitContactForm = async (formData) => {
  try {
    return await contactApi.submit(formData);
  } catch (error) {
    return { success: false, message: 'Connection error' };
  }
};