const express = require('express');
const config = require('./config');
const { pool } = require('./db');
const booksRouter = require('./routes/books');
const requestLogger = require('./middleware/requestLogger');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandlers');

const app = express();

app.use(requestLogger);
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    name: config.appName,
    endpoints: {
      health: 'GET /health',
      listBooks: 'GET /api/books',
      getBook: 'GET /api/books/:id',
      createBook: 'POST /api/books',
      replaceBook: 'PUT /api/books/:id',
      updateBook: 'PATCH /api/books/:id',
      deleteBook: 'DELETE /api/books/:id',
    },
  });
});

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

app.use('/api/books', booksRouter);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
