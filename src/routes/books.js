const express = require('express');
const books = require('../repositories/bookRepository');
const { validateBook, parseListQuery, DEFAULTS } = require('../validators/bookValidator');

const router = express.Router();

function validationError(res, details) {
  return res.status(400).json({ error: 'Validation failed', details });
}

function notFound(res) {
  return res.status(404).json({ error: 'Book not found' });
}

router.param('id', (req, res, next, id) => {
  if (!/^[1-9]\d{0,8}$/.test(id)) {
    return res.status(400).json({ error: 'id must be a positive integer' });
  }
  req.bookId = Number(id);
  next();
});

router.get('/', async (req, res) => {
  const { errors, filters } = parseListQuery(req.query);
  if (errors.length > 0) {
    return validationError(res, errors);
  }
  const { books: data, total } = await books.findAll(filters);
  res.json({
    data,
    pagination: { total, limit: filters.limit, offset: filters.offset },
  });
});

router.get('/:id', async (req, res) => {
  const book = await books.findById(req.bookId);
  if (!book) {
    return notFound(res);
  }
  res.json(book);
});

router.post('/', async (req, res) => {
  const { errors, data } = validateBook(req.body);
  if (errors.length > 0) {
    return validationError(res, errors);
  }
  const book = await books.create(data);
  res.status(201).location(`/api/books/${book.id}`).json(book);
});

router.put('/:id', async (req, res) => {
  const { errors, data } = validateBook(req.body);
  if (errors.length > 0) {
    return validationError(res, errors);
  }
  const book = await books.update(req.bookId, { ...DEFAULTS, ...data });
  if (!book) {
    return notFound(res);
  }
  res.json(book);
});

router.patch('/:id', async (req, res) => {
  const { errors, data } = validateBook(req.body, { partial: true });
  if (errors.length > 0) {
    return validationError(res, errors);
  }
  const book = await books.update(req.bookId, data);
  if (!book) {
    return notFound(res);
  }
  res.json(book);
});

router.delete('/:id', async (req, res) => {
  const deleted = await books.remove(req.bookId);
  if (!deleted) {
    return notFound(res);
  }
  res.status(204).end();
});

module.exports = router;
