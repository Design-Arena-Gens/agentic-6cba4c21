export interface User {
  email: string;
  name: string;
  profile_image?: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
  message?: string;
}

export interface Stock {
  symbol: string;
  name: string;
}

export interface StockInfo {
  symbol: string;
  name: string;
  price: number;
  currency: string;
  market_cap?: number;
  volume: number;
}

export interface StockHistory {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockPrediction {
  symbol: string;
  current_price: number;
  predicted_price: number;
  change_percent: number;
  prediction_date: string;
}

export interface Holding {
  symbol: string;
  quantity: number;
  avg_price: number;
  current_price: number;
  value: number;
  profit_loss: number;
  profit_loss_percent: number;
}

export interface Portfolio {
  balance: number;
  holdings: Holding[];
  total_value: number;
  total_profit_loss: number;
}

export interface Transaction {
  type: 'buy' | 'sell';
  symbol: string;
  quantity: number;
  price: number;
  total: number;
  timestamp: string;
}
