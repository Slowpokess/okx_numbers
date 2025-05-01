// server.js - прокси-сервер для обхода CORS при запросах к API OKX
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

// Разрешаем CORS для всех источников (в продакшн лучше указать конкретный домен)
app.use(cors());

// Маршрут для тестирования разных URL API
app.get('/api/okx/test-endpoints', async (req, res) => {
  const endpoints = [
    'https://www.okx.com/v3/c2c/tradingOrders/books',
    'https://www.okx.com/api/v5/c2c/trade/orders',
    'https://www.okx.com/api/v5/c2c/otc-ticker/ticker'
  ];
  
  const results = {};
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(endpoint, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      results[endpoint] = {
        status: response.status,
        success: true,
        dataPreview: JSON.stringify(response.data).substring(0, 100) + '...'
      };
    } catch (error) {
      results[endpoint] = {
        success: false,
        error: error.message
      };
    }
  }
  
  res.json(results);
});

// Маршрут для получения предложений на покупку USDT (продажа UAH)
app.get('/api/okx/buy-orders', async (req, res) => {
  try {
    // Текущий основной URL API
    const baseUrl = 'https://www.okx.com/v3/c2c/tradingOrders/books';
    
    // Альтернативные URL на случай, если основной не работает
    const alternativeUrls = [
      'https://www.okx.com/api/v5/c2c/trade/orders',
      'https://www.okx.com/api/v5/c2c/otc-ticker/ticker'
    ];
    
    const response = await axios.get(
      baseUrl, 
      { 
        params: {
          quoteCurrency: 'UAH',
          baseCurrency: 'USDT',
          side: 'sell',
          paymentMethod: 'all',
          userType: 'all',
          showTrade: false,
          showFollow: false,
          showAlreadyTraded: false,
          isAbleFilter: false
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7'
        }
      }
    );
    
    console.log('Успешный ответ от OKX (buy-orders):', JSON.stringify(response.data).substring(0, 300) + '...');
    res.json(response.data);
  } catch (error) {
    console.error('Ошибка при получении данных с OKX (buy-orders):', error.message);
    
    if (error.response) {
      console.error('Статус ошибки:', error.response.status);
      console.error('Данные ошибки:', error.response.data);
      console.error('Заголовки ответа:', error.response.headers);
    } else if (error.request) {
      console.error('Запрос был сделан, но ответ не получен', error.request);
    }
    
    res.status(500).json({ 
      error: 'Не удалось получить данные с OKX',
      message: error.message,
      status: error.response ? error.response.status : 'unknown'
    });
  }
});

// Маршрут для получения предложений на продажу USDT (покупка UAH)
app.get('/api/okx/sell-orders', async (req, res) => {
  try {
    const response = await axios.get(
      'https://www.okx.com/v3/c2c/tradingOrders/books', 
      { 
        params: {
          quoteCurrency: 'UAH',
          baseCurrency: 'USDT',
          side: 'buy',
          paymentMethod: 'all',
          userType: 'all',
          showTrade: false,
          showFollow: false,
          showAlreadyTraded: false,
          isAbleFilter: false
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7'
        }
      }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('Ошибка при получении данных с OKX:', error.message);
    
    if (error.response) {
      console.error('Статус ошибки:', error.response.status);
      console.error('Данные ошибки:', error.response.data);
    }
    
    res.status(500).json({ 
      error: 'Не удалось получить данные с OKX',
      message: error.message,
      status: error.response ? error.response.status : 'unknown' 
    });
  }
});

// Тестовый маршрут для проверки работы сервера
app.get('/api/test', (req, res) => {
  res.json({ status: 'ok', message: 'Прокси-сервер работает' });
});

app.listen(PORT, () => {
  console.log(`Прокси-сервер запущен на порту ${PORT}`);
  console.log(`Тестовый маршрут: http://localhost:${PORT}/api/test`);
  console.log(`Маршрут предложений на покупку USDT: http://localhost:${PORT}/api/okx/buy-orders`);
  console.log(`Маршрут предложений на продажу USDT: http://localhost:${PORT}/api/okx/sell-orders`);
});