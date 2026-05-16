import axios from 'axios';

const API_URL = 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const graphApi = {
  queryGraph: async (question: string) => {
    const response = await api.post('/graphqa', { question });
    return response.data;
  },
  
  fetchGraph: async () => {
    const response = await api.get('/graph');
    return response.data;
  },
  
  uploadPaper: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};
