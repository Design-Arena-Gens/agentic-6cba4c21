from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import os
import random
import string
import yfinance as yf
import pandas as pd
import numpy as np
from xgboost import XGBRegressor
import joblib
import cloudinary
import cloudinary.uploader
from cloudinary.utils import cloudinary_url

app = Flask(__name__)
CORS(app)

app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'super-secret-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)

jwt = JWTManager(app)

cloudinary.config(
    cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME', 'demo'),
    api_key=os.environ.get('CLOUDINARY_API_KEY', ''),
    api_secret=os.environ.get('CLOUDINARY_API_SECRET', '')
)

users_db = {}
portfolios_db = {}
transactions_db = {}
otp_store = {}

INITIAL_BALANCE = 100000.0

def generate_otp():
    return ''.join(random.choices(string.digits, k=6))

def send_otp(email, otp):
    print(f"OTP for {email}: {otp}")
    return True

def train_stock_model(symbol):
    try:
        stock = yf.Ticker(symbol)
        hist = stock.history(period="1y")
        
        if len(hist) < 30:
            return None
        
        hist['MA5'] = hist['Close'].rolling(window=5).mean()
        hist['MA20'] = hist['Close'].rolling(window=20).mean()
        hist['Returns'] = hist['Close'].pct_change()
        hist['Volatility'] = hist['Returns'].rolling(window=20).std()
        
        hist = hist.dropna()
        
        X = hist[['Open', 'High', 'Low', 'Volume', 'MA5', 'MA20', 'Volatility']].values
        y = hist['Close'].values
        
        split = int(len(X) * 0.8)
        X_train, y_train = X[:split], y[:split]
        
        model = XGBRegressor(n_estimators=100, max_depth=5, learning_rate=0.1)
        model.fit(X_train, y_train)
        
        return model, hist
    except Exception as e:
        print(f"Error training model: {e}")
        return None

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')
    
    if not email or not password or not name:
        return jsonify({'error': 'Missing required fields'}), 400
    
    if email in users_db:
        return jsonify({'error': 'User already exists'}), 400
    
    otp = generate_otp()
    otp_store[email] = {
        'otp': otp,
        'expires': datetime.now() + timedelta(minutes=10),
        'user_data': {
            'email': email,
            'password': generate_password_hash(password),
            'name': name,
            'verified': False
        }
    }
    
    send_otp(email, otp)
    
    return jsonify({'message': 'OTP sent to email', 'email': email}), 200

@app.route('/api/auth/verify-otp', methods=['POST'])
def verify_otp():
    data = request.json
    email = data.get('email')
    otp = data.get('otp')
    
    if email not in otp_store:
        return jsonify({'error': 'Invalid request'}), 400
    
    stored = otp_store[email]
    
    if datetime.now() > stored['expires']:
        del otp_store[email]
        return jsonify({'error': 'OTP expired'}), 400
    
    if stored['otp'] != otp:
        return jsonify({'error': 'Invalid OTP'}), 400
    
    user_data = stored['user_data']
    user_data['verified'] = True
    user_data['created_at'] = datetime.now().isoformat()
    
    users_db[email] = user_data
    
    portfolios_db[email] = {
        'balance': INITIAL_BALANCE,
        'holdings': {},
        'total_value': INITIAL_BALANCE
    }
    
    transactions_db[email] = []
    
    del otp_store[email]
    
    access_token = create_access_token(identity=email)
    
    return jsonify({
        'message': 'Account verified successfully',
        'access_token': access_token,
        'user': {
            'email': user_data['email'],
            'name': user_data['name']
        }
    }), 200

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'error': 'Missing credentials'}), 400
    
    user = users_db.get(email)
    
    if not user or not check_password_hash(user['password'], password):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    if not user.get('verified'):
        return jsonify({'error': 'Account not verified'}), 401
    
    access_token = create_access_token(identity=email)
    
    return jsonify({
        'access_token': access_token,
        'user': {
            'email': user['email'],
            'name': user['name']
        }
    }), 200

@app.route('/api/user/profile', methods=['GET'])
@jwt_required()
def get_profile():
    email = get_jwt_identity()
    user = users_db.get(email)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'email': user['email'],
        'name': user['name'],
        'profile_image': user.get('profile_image')
    }), 200

@app.route('/api/user/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    email = get_jwt_identity()
    user = users_db.get(email)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.json
    
    if 'name' in data:
        user['name'] = data['name']
    
    return jsonify({
        'message': 'Profile updated',
        'user': {
            'email': user['email'],
            'name': user['name']
        }
    }), 200

@app.route('/api/user/upload-image', methods=['POST'])
@jwt_required()
def upload_image():
    email = get_jwt_identity()
    user = users_db.get(email)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    
    file = request.files['image']
    
    try:
        result = cloudinary.uploader.upload(file)
        user['profile_image'] = result['secure_url']
        
        return jsonify({
            'message': 'Image uploaded',
            'url': result['secure_url']
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stocks/search', methods=['GET'])
@jwt_required()
def search_stocks():
    query = request.args.get('q', '')
    
    popular_stocks = [
        {'symbol': 'AAPL', 'name': 'Apple Inc.'},
        {'symbol': 'GOOGL', 'name': 'Alphabet Inc.'},
        {'symbol': 'MSFT', 'name': 'Microsoft Corporation'},
        {'symbol': 'AMZN', 'name': 'Amazon.com Inc.'},
        {'symbol': 'TSLA', 'name': 'Tesla Inc.'},
        {'symbol': 'META', 'name': 'Meta Platforms Inc.'},
        {'symbol': 'NVDA', 'name': 'NVIDIA Corporation'},
        {'symbol': 'JPM', 'name': 'JPMorgan Chase & Co.'},
        {'symbol': 'V', 'name': 'Visa Inc.'},
        {'symbol': 'WMT', 'name': 'Walmart Inc.'}
    ]
    
    if query:
        results = [s for s in popular_stocks if query.upper() in s['symbol'] or query.lower() in s['name'].lower()]
    else:
        results = popular_stocks
    
    return jsonify({'stocks': results}), 200

@app.route('/api/stocks/<symbol>/info', methods=['GET'])
@jwt_required()
def get_stock_info(symbol):
    try:
        stock = yf.Ticker(symbol)
        info = stock.info
        hist = stock.history(period="1d")
        
        if hist.empty:
            return jsonify({'error': 'Stock not found'}), 404
        
        current_price = hist['Close'].iloc[-1]
        
        return jsonify({
            'symbol': symbol,
            'name': info.get('longName', symbol),
            'price': float(current_price),
            'currency': info.get('currency', 'USD'),
            'market_cap': info.get('marketCap'),
            'volume': int(hist['Volume'].iloc[-1])
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stocks/<symbol>/history', methods=['GET'])
@jwt_required()
def get_stock_history(symbol):
    period = request.args.get('period', '1mo')
    
    try:
        stock = yf.Ticker(symbol)
        hist = stock.history(period=period)
        
        data = []
        for index, row in hist.iterrows():
            data.append({
                'date': index.strftime('%Y-%m-%d'),
                'open': float(row['Open']),
                'high': float(row['High']),
                'low': float(row['Low']),
                'close': float(row['Close']),
                'volume': int(row['Volume'])
            })
        
        return jsonify({'history': data}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stocks/<symbol>/predict', methods=['GET'])
@jwt_required()
def predict_stock(symbol):
    try:
        result = train_stock_model(symbol)
        
        if result is None:
            return jsonify({'error': 'Unable to generate prediction'}), 500
        
        model, hist = result
        
        latest = hist.iloc[-1]
        features = np.array([[
            latest['Open'],
            latest['High'],
            latest['Low'],
            latest['Volume'],
            latest['MA5'],
            latest['MA20'],
            latest['Volatility']
        ]])
        
        prediction = model.predict(features)[0]
        current_price = latest['Close']
        
        change_percent = ((prediction - current_price) / current_price) * 100
        
        return jsonify({
            'symbol': symbol,
            'current_price': float(current_price),
            'predicted_price': float(prediction),
            'change_percent': float(change_percent),
            'prediction_date': (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/portfolio', methods=['GET'])
@jwt_required()
def get_portfolio():
    email = get_jwt_identity()
    portfolio = portfolios_db.get(email)
    
    if not portfolio:
        return jsonify({'error': 'Portfolio not found'}), 404
    
    holdings_with_value = []
    total_holdings_value = 0
    
    for symbol, holding in portfolio['holdings'].items():
        try:
            stock = yf.Ticker(symbol)
            hist = stock.history(period="1d")
            if not hist.empty:
                current_price = float(hist['Close'].iloc[-1])
                value = current_price * holding['quantity']
                total_holdings_value += value
                
                holdings_with_value.append({
                    'symbol': symbol,
                    'quantity': holding['quantity'],
                    'avg_price': holding['avg_price'],
                    'current_price': current_price,
                    'value': value,
                    'profit_loss': value - (holding['avg_price'] * holding['quantity']),
                    'profit_loss_percent': ((current_price - holding['avg_price']) / holding['avg_price']) * 100
                })
        except:
            holdings_with_value.append({
                'symbol': symbol,
                'quantity': holding['quantity'],
                'avg_price': holding['avg_price'],
                'current_price': holding['avg_price'],
                'value': holding['avg_price'] * holding['quantity'],
                'profit_loss': 0,
                'profit_loss_percent': 0
            })
    
    total_value = portfolio['balance'] + total_holdings_value
    
    return jsonify({
        'balance': portfolio['balance'],
        'holdings': holdings_with_value,
        'total_value': total_value,
        'total_profit_loss': total_value - INITIAL_BALANCE
    }), 200

@app.route('/api/portfolio/trade', methods=['POST'])
@jwt_required()
def trade():
    email = get_jwt_identity()
    portfolio = portfolios_db.get(email)
    
    if not portfolio:
        return jsonify({'error': 'Portfolio not found'}), 404
    
    data = request.json
    symbol = data.get('symbol')
    action = data.get('action')
    quantity = data.get('quantity')
    
    if not symbol or not action or not quantity:
        return jsonify({'error': 'Missing required fields'}), 400
    
    if action not in ['buy', 'sell']:
        return jsonify({'error': 'Invalid action'}), 400
    
    try:
        quantity = int(quantity)
        if quantity <= 0:
            return jsonify({'error': 'Invalid quantity'}), 400
    except:
        return jsonify({'error': 'Invalid quantity'}), 400
    
    try:
        stock = yf.Ticker(symbol)
        hist = stock.history(period="1d")
        
        if hist.empty:
            return jsonify({'error': 'Stock not found'}), 404
        
        current_price = float(hist['Close'].iloc[-1])
        
        if action == 'buy':
            total_cost = current_price * quantity
            
            if portfolio['balance'] < total_cost:
                return jsonify({'error': 'Insufficient balance'}), 400
            
            portfolio['balance'] -= total_cost
            
            if symbol in portfolio['holdings']:
                holding = portfolio['holdings'][symbol]
                total_quantity = holding['quantity'] + quantity
                total_cost_basis = (holding['avg_price'] * holding['quantity']) + (current_price * quantity)
                holding['avg_price'] = total_cost_basis / total_quantity
                holding['quantity'] = total_quantity
            else:
                portfolio['holdings'][symbol] = {
                    'quantity': quantity,
                    'avg_price': current_price
                }
            
            transaction = {
                'type': 'buy',
                'symbol': symbol,
                'quantity': quantity,
                'price': current_price,
                'total': total_cost,
                'timestamp': datetime.now().isoformat()
            }
            
        else:
            if symbol not in portfolio['holdings']:
                return jsonify({'error': 'Stock not in portfolio'}), 400
            
            holding = portfolio['holdings'][symbol]
            
            if holding['quantity'] < quantity:
                return jsonify({'error': 'Insufficient shares'}), 400
            
            total_value = current_price * quantity
            portfolio['balance'] += total_value
            
            holding['quantity'] -= quantity
            
            if holding['quantity'] == 0:
                del portfolio['holdings'][symbol]
            
            transaction = {
                'type': 'sell',
                'symbol': symbol,
                'quantity': quantity,
                'price': current_price,
                'total': total_value,
                'timestamp': datetime.now().isoformat()
            }
        
        if email not in transactions_db:
            transactions_db[email] = []
        
        transactions_db[email].append(transaction)
        
        return jsonify({
            'message': f'Successfully {action} {quantity} shares of {symbol}',
            'transaction': transaction,
            'new_balance': portfolio['balance']
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/portfolio/transactions', methods=['GET'])
@jwt_required()
def get_transactions():
    email = get_jwt_identity()
    transactions = transactions_db.get(email, [])
    
    return jsonify({'transactions': transactions}), 200

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'}), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)
