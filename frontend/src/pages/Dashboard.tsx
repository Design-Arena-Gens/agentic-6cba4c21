import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, portfolioService, stockService } from '../services/api';
import { Button } from '../components/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/Card';
import { TrendingUp, TrendingDown, DollarSign, PieChart, LogOut, Search } from 'lucide-react';
import type { Portfolio, Stock } from '../types';

export default function Dashboard() {
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Stock[]>([]);
  const user = authService.getCurrentUser();

  useEffect(() => {
    loadPortfolio();
  }, []);

  const loadPortfolio = async () => {
    try {
      const data = await portfolioService.get();
      setPortfolio(data);
    } catch (error) {
      console.error('Failed to load portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length > 0) {
      try {
        const results = await stockService.search(query);
        setSearchResults(results);
      } catch (error) {
        console.error('Search failed:', error);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-primary">Stock Predictor</h1>
              <div className="hidden md:flex space-x-4">
                <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                  Dashboard
                </Button>
                <Button variant="ghost" onClick={() => navigate('/portfolio')}>
                  Portfolio
                </Button>
                <Button variant="ghost" onClick={() => navigate('/trade')}>
                  Trade
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search stocks (e.g., AAPL, GOOGL)..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {searchResults.length > 0 && (
            <div className="mt-2 bg-white rounded-lg shadow-lg border">
              {searchResults.map((stock) => (
                <button
                  key={stock.symbol}
                  onClick={() => {
                    navigate(`/stock/${stock.symbol}`);
                    setSearchResults([]);
                    setSearchQuery('');
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-b-0"
                >
                  <div className="font-semibold">{stock.symbol}</div>
                  <div className="text-sm text-gray-600">{stock.name}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${portfolio?.total_value.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Portfolio value
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cash Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${portfolio?.balance.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Available to trade
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total P/L</CardTitle>
              {portfolio && portfolio.total_profit_loss >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                portfolio && portfolio.total_profit_loss >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ${portfolio?.total_profit_loss.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {portfolio && portfolio.total_profit_loss >= 0 ? 'Profit' : 'Loss'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Holdings</CardTitle>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {portfolio?.holdings.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Active positions
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Holdings</CardTitle>
            <CardDescription>Current positions in your portfolio</CardDescription>
          </CardHeader>
          <CardContent>
            {portfolio && portfolio.holdings.length > 0 ? (
              <div className="space-y-4">
                {portfolio.holdings.map((holding) => (
                  <div
                    key={holding.symbol}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/stock/${holding.symbol}`)}
                  >
                    <div>
                      <div className="font-semibold">{holding.symbol}</div>
                      <div className="text-sm text-gray-600">
                        {holding.quantity} shares @ ${holding.avg_price.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">${holding.value.toFixed(2)}</div>
                      <div className={`text-sm ${
                        holding.profit_loss >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {holding.profit_loss >= 0 ? '+' : ''}${holding.profit_loss.toFixed(2)} (
                        {holding.profit_loss_percent.toFixed(2)}%)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No holdings yet. Start trading to build your portfolio!
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
