import axios from 'axios';

const API_URL = 'http://localhost:8000';
const API_KEY = import.meta.env.VITE_KG_API_KEY;
const authHeaders = API_KEY ? { 'x-api-key': API_KEY } : {};

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    ...authHeaders,
  },
});

export const graphApi = {
  queryGraph: async (question: string) => {
    const response = await api.post('/graphqa', { question });
    return response.data;
  },
  
  fetchGraph: async () => {
    const response = await api.get('/graph');
    const data = response.data;
    const results = data?.results || {};
    return {
      ...data,
      results: {
        nodes: results.nodes || [],
        links: results.links || results.relationships || [],
        ...results,
      },
    };
  },
  
  uploadPaper: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...authHeaders,
      },
    });
    return response.data;
  }
};
