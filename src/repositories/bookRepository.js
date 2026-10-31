const { pool } = require('../db');

const COLUMNS = {
  title: 'title',
  author: 'author',
  isbn: 'isbn',
  publishedYear: 'published_year',
  genre: 'genre',
  available: 'available',
};

const SELECT_FIELDS = `
  id, title, author, isbn,
  published_year AS "publishedYear",
  genre, available,
  created_at AS "createdAt",
  updated_at AS "updatedAt"`;

async function findAll({ genre, author, available, limit, offset }) {
  const conditions = [];
  const params = [];

  if (genre !== undefined) {
    params.push(genre);
    conditions.push(`LOWER(genre) = LOWER($${params.length})`);
  }
  if (author !== undefined) {
    params.push(`%${author}%`);
    conditions.push(`author ILIKE $${params.length}`);
  }
  if (available !== undefined) {
    params.push(available);
    conditions.push(`available = $${params.length}`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const [countResult, rowsResult] = await Promise.all([
    pool.query(`SELECT COUNT(*)::int AS total FROM books ${where}`, params),
    pool.query(
      `SELECT ${SELECT_FIELDS} FROM books ${where}
       ORDER BY id
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    ),
  ]);

  return { books: rowsResult.rows, total: countResult.rows[0].total };
}

async function findById(id) {
  const result = await pool.query(`SELECT ${SELECT_FIELDS} FROM books WHERE id = $1`, [id]);
  return result.rows[0] ?? null;
}

async function create(book) {
  const fields = Object.keys(book);
  const columns = fields.map((field) => COLUMNS[field]);
  const placeholders = fields.map((_, i) => `$${i + 1}`);

  const result = await pool.query(
    `INSERT INTO books (${columns.join(', ')})
     VALUES (${placeholders.join(', ')})
     RETURNING ${SELECT_FIELDS}`,
    fields.map((field) => book[field])
  );
  return result.rows[0];
}

async function update(id, changes) {
  const fields = Object.keys(changes);
  const assignments = fields.map((field, i) => `${COLUMNS[field]} = $${i + 1}`);

  const result = await pool.query(
    `UPDATE books
     SET ${assignments.join(', ')}, updated_at = now()
     WHERE id = $${fields.length + 1}
     RETURNING ${SELECT_FIELDS}`,
    [...fields.map((field) => changes[field]), id]
  );
  return result.rows[0] ?? null;
}

async function remove(id) {
  const result = await pool.query('DELETE FROM books WHERE id = $1', [id]);
  return result.rowCount > 0;
}

module.exports = { findAll, findById, create, update, remove };
