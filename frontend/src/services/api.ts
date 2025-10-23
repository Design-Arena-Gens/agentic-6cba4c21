import axios from 'axios';
import type { AuthResponse, Stock, StockInfo, StockHistory, StockPrediction, Portfolio, Transaction, User } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  signup: async (email: string, password: string, name: string) => {
    const response = await api.post<{ message: string; email: string }>('/auth/signup', {
      email,
      password,
      name,
    });
    return response.data;
  },

  verifyOtp: async (email: string, otp: string) => {
    const response = await api.post<AuthResponse>('/auth/verify-otp', {
      email,
      otp,
    });
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },
};

export const userService = {
  getProfile: async () => {
    const response = await api.get<User>('/user/profile');
    return response.data;
  },

  updateProfile: async (name: string) => {
    const response = await api.put<{ message: string; user: User }>('/user/profile', {
      name,
    });
    return response.data;
  },

  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post<{ message: string; url: string }>('/user/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export const stockService = {
  search: async (query: string) => {
    const response = await api.get<{ stocks: Stock[] }>('/stocks/search', {
      params: { q: query },
    });
    return response.data.stocks;
  },

  getInfo: async (symbol: string) => {
    const response = await api.get<StockInfo>(`/stocks/${symbol}/info`);
    return response.data;
  },

  getHistory: async (symbol: string, period: string = '1mo') => {
    const response = await api.get<{ history: StockHistory[] }>(`/stocks/${symbol}/history`, {
      params: { period },
    });
    return response.data.history;
  },

  predict: async (symbol: string) => {
    const response = await api.get<StockPrediction>(`/stocks/${symbol}/predict`);
    return response.data;
  },
};

export const portfolioService = {
  get: async () => {
    const response = await api.get<Portfolio>('/portfolio');
    return response.data;
  },

  trade: async (symbol: string, action: 'buy' | 'sell', quantity: number) => {
    const response = await api.post<{
      message: string;
      transaction: Transaction;
      new_balance: number;
    }>('/portfolio/trade', {
      symbol,
      action,
      quantity,
    });
    return response.data;
  },

  getTransactions: async () => {
    const response = await api.get<{ transactions: Transaction[] }>('/portfolio/transactions');
    return response.data.transactions;
  },
};

export default api;
