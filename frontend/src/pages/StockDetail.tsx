import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { stockService, portfolioService } from '../services/api';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import type { StockInfo, StockHistory, StockPrediction } from '../types';

export default function StockDetail() {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const [stockInfo, setStockInfo] = useState<StockInfo | null>(null);
  const [history, setHistory] = useState<StockHistory[]>([]);
  const [prediction, setPrediction] = useState<StockPrediction | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [loading, setLoading] = useState(true);
  const [trading, setTrading] = useState(false);
  const [period, setPeriod] = useState('1mo');

  useEffect(() => {
    if (symbol) {
      loadStockData();
    }
  }, [symbol, period]);

  const loadStockData = async () => {
    if (!symbol) return;
    
    setLoading(true);
    try {
      const [info, hist, pred] = await Promise.all([
        stockService.getInfo(symbol),
        stockService.getHistory(symbol, period),
        stockService.predict(symbol).catch(() => null),
      ]);
      
      setStockInfo(info);
      setHistory(hist);
      setPrediction(pred);
    } catch (error) {
      console.error('Failed to load stock data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTrade = async (action: 'buy' | 'sell') => {
    if (!symbol) return;
    
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    setTrading(true);
    try {
      await portfolioService.trade(symbol, action, qty);
      alert(`Successfully ${action === 'buy' ? 'bought' : 'sold'} ${qty} shares of ${symbol}`);
      setQuantity('1');
    } catch (error: any) {
      alert(error.response?.data?.error || `Failed to ${action}`);
    } finally {
      setTrading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!stockInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Stock not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-3xl">{stockInfo.symbol}</CardTitle>
                    <CardDescription>{stockInfo.name}</CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">${stockInfo.price.toFixed(2)}</div>
                    <div className="text-sm text-gray-600">{stockInfo.currency}</div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {prediction && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    AI Prediction
                    {prediction.change_percent >= 0 ? (
                      <TrendingUp className="w-5 h-5 ml-2 text-green-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 ml-2 text-red-600" />
                    )}
                  </CardTitle>
                  <CardDescription>Machine learning powered forecast</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Current Price</div>
                      <div className="text-2xl font-bold">${prediction.current_price.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Predicted Price</div>
                      <div className={`text-2xl font-bold ${
                        prediction.change_percent >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ${prediction.predicted_price.toFixed(2)}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-sm text-gray-600">Expected Change</div>
                      <div className={`text-xl font-bold ${
                        prediction.change_percent >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {prediction.change_percent >= 0 ? '+' : ''}{prediction.change_percent.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Price History</CardTitle>
                  <div className="flex space-x-2">
                    {['1d', '5d', '1mo', '3mo', '6mo', '1y'].map((p) => (
                      <Button
                        key={p}
                        variant={period === p ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPeriod(p)}
                      >
                        {p}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={['auto', 'auto']} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="close" stroke="#3b82f6" name="Close Price" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Trade</CardTitle>
                <CardDescription>Buy or sell {stockInfo.symbol}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quantity</label>
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Enter quantity"
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">Total Cost</div>
                  <div className="text-2xl font-bold">
                    ${(stockInfo.price * parseInt(quantity || '0')).toFixed(2)}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => handleTrade('buy')}
                    disabled={trading}
                    className="w-full"
                  >
                    Buy
                  </Button>
                  <Button
                    onClick={() => handleTrade('sell')}
                    disabled={trading}
                    variant="destructive"
                    className="w-full"
                  >
                    Sell
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stock Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Symbol</span>
                  <span className="font-medium">{stockInfo.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Price</span>
                  <span className="font-medium">${stockInfo.price.toFixed(2)}</span>
                </div>
                {stockInfo.market_cap && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Market Cap</span>
                    <span className="font-medium">
                      ${(stockInfo.market_cap / 1e9).toFixed(2)}B
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Volume</span>
                  <span className="font-medium">
                    {(stockInfo.volume / 1e6).toFixed(2)}M
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
