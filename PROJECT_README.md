# Stock Market Prediction App

A full-stack web application for stock market prediction and demo trading, featuring machine learning-powered price predictions using XGBoost.

## 🚀 Live Demo

**Frontend:** https://agentic-6cba4c21.vercel.app

## 📋 Features

### Authentication & User Management
- User registration with OTP verification
- Secure JWT-based authentication
- Profile management with Cloudinary image upload support

### Stock Market Features
- Real-time stock price data from Yahoo Finance
- Interactive price history charts with multiple timeframes (1d, 5d, 1mo, 3mo, 6mo, 1y)
- AI-powered stock price predictions using XGBoost machine learning model
- Stock search functionality with popular stocks

### Demo Trading
- Virtual trading account with $100,000 starting balance
- Buy and sell stocks with real-time pricing
- Portfolio tracking with profit/loss calculations
- Transaction history
- Holdings overview with performance metrics

### UI/UX
- Modern, responsive design with Tailwind CSS
- Interactive charts using Recharts
- Real-time portfolio updates
- Clean dashboard with key metrics

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Routing:** React Router v6
- **Charts:** Recharts
- **Icons:** Lucide React
- **HTTP Client:** Axios
- **UI Components:** Custom components with Radix UI primitives

### Backend
- **Framework:** Flask 3.0
- **Authentication:** Flask-JWT-Extended
- **CORS:** Flask-CORS
- **Password Hashing:** Werkzeug
- **ML Model:** XGBoost 2.0
- **Data Processing:** Pandas, NumPy
- **Stock Data:** yfinance
- **Image Storage:** Cloudinary
- **Server:** Gunicorn

### Database
- In-memory storage (Python dictionaries)
- Note: Data is reset when the backend restarts (suitable for demo/proof-of-concept)

## 📁 Project Structure

```
agentic-6cba4c21/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API service layer
│   │   ├── types/           # TypeScript type definitions
│   │   ├── lib/             # Utility functions
│   │   ├── App.tsx          # Main app component
│   │   └── main.tsx         # Entry point
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── backend/                  # Flask backend API
│   ├── app.py               # Main Flask application
│   ├── requirements.txt     # Python dependencies
│   ├── .env.example         # Environment variables template
│   └── Procfile             # Deployment configuration
└── vercel.json              # Vercel deployment config
```

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Node.js 18+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```
JWT_SECRET_KEY=your-secret-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

5. Run the Flask development server:
```bash
python app.py
```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```bash
echo "VITE_API_URL=http://localhost:8000" > .env
```

4. Run the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/verify-otp` - Verify OTP and activate account
- `POST /api/auth/login` - Login user

### User
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `POST /api/user/upload-image` - Upload profile image

### Stocks
- `GET /api/stocks/search?q={query}` - Search stocks
- `GET /api/stocks/{symbol}/info` - Get stock information
- `GET /api/stocks/{symbol}/history?period={period}` - Get price history
- `GET /api/stocks/{symbol}/predict` - Get AI price prediction

### Portfolio
- `GET /api/portfolio` - Get user portfolio
- `POST /api/portfolio/trade` - Execute buy/sell trade
- `GET /api/portfolio/transactions` - Get transaction history

## 🤖 Machine Learning Model

The application uses XGBoost (Extreme Gradient Boosting) for stock price prediction:

### Features Used
- Open price
- High price
- Low price
- Volume
- 5-day moving average
- 20-day moving average
- 20-day volatility

### Model Training
- Uses 1 year of historical data
- 80/20 train/test split
- 100 estimators with max depth of 5
- Learning rate of 0.1

### Prediction
- Generates next-day price prediction
- Calculates expected change percentage
- Provides confidence indicators

## 🎨 UI Components

### Pages
- **Login** - User authentication
- **Signup** - User registration with OTP verification
- **Dashboard** - Portfolio overview and stock search
- **Stock Detail** - Detailed stock view with charts and trading

### Key Components
- **Button** - Customizable button with variants
- **Input** - Styled input field
- **Card** - Container component for content sections

## 📊 Demo Trading Features

### Initial Setup
- Each user starts with $100,000 virtual balance
- No real money involved - perfect for learning

### Trading
- Buy stocks at current market price
- Sell stocks from your holdings
- Real-time profit/loss calculations
- Transaction history tracking

### Portfolio Metrics
- Total portfolio value
- Available cash balance
- Total profit/loss
- Individual holding performance
- Profit/loss percentage per stock

## 🔒 Security Features

- JWT token-based authentication
- Password hashing with Werkzeug
- CORS protection
- Input validation
- Secure HTTP-only cookies (recommended for production)

## 🚀 Deployment

### Frontend (Vercel)
The frontend is deployed on Vercel with automatic builds from the repository.

### Backend Deployment Options

1. **Heroku:**
```bash
heroku create your-app-name
git push heroku main
```

2. **AWS/GCP/Azure:**
Use the provided `Procfile` for deployment with Gunicorn

3. **Docker:**
Create a Dockerfile for containerized deployment

## 📝 Environment Variables

### Backend
- `JWT_SECRET_KEY` - Secret key for JWT tokens
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret

### Frontend
- `VITE_API_URL` - Backend API URL

## 🐛 Known Limitations

1. **In-Memory Database:** Data is lost when the backend restarts. For production, integrate MongoDB or PostgreSQL.

2. **OTP Delivery:** Currently prints OTP to console. For production, integrate with email service (SendGrid, AWS SES) or SMS service (Twilio).

3. **ML Model:** Predictions are based on historical patterns and should not be used for actual trading decisions.

4. **Rate Limiting:** No rate limiting implemented. Add rate limiting for production use.

5. **Real-time Updates:** Stock prices update on page refresh. Consider WebSocket integration for real-time updates.

## 🔮 Future Enhancements

- [ ] Persistent database integration (MongoDB/PostgreSQL)
- [ ] Real-time stock price updates via WebSockets
- [ ] Email/SMS OTP delivery
- [ ] Advanced charting with technical indicators
- [ ] Portfolio performance analytics
- [ ] Watchlist functionality
- [ ] Price alerts and notifications
- [ ] Social features (share trades, leaderboard)
- [ ] Multiple ML models comparison
- [ ] News sentiment analysis integration
- [ ] Mobile app (React Native)

## 📄 License

This project is for educational and demonstration purposes.

## 👥 Contributing

This is a demo project. Feel free to fork and customize for your needs.

## 🙏 Acknowledgments

- Yahoo Finance for stock data
- XGBoost for machine learning capabilities
- Vercel for hosting
- Cloudinary for image storage

## 📞 Support

For issues or questions, please open an issue on GitHub.

---

**Note:** This application is for educational purposes only. Do not use for actual trading decisions. Past performance does not guarantee future results.
