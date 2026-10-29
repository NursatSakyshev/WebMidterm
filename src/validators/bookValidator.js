const MAX_YEAR = new Date().getFullYear() + 1;

const RULES = {
  title: { type: 'string', required: true, maxLength: 200 },
  author: { type: 'string', required: true, maxLength: 120 },
  isbn: { type: 'isbn' },
  publishedYear: { type: 'year' },
  genre: { type: 'string', maxLength: 50 },
  available: { type: 'boolean' },
};

// Values used for optional fields that are omitted from a full replacement (PUT)
const DEFAULTS = {
  isbn: null,
  publishedYear: null,
  genre: null,
  available: true,
};

function checkField(field, value, rule) {
  if (value === null) {
    if (rule.required || rule.type === 'boolean') {
      return { error: `${field} cannot be null` };
    }
    return { value: null };
  }

  switch (rule.type) {
    case 'string': {
      if (typeof value !== 'string') {
        return { error: `${field} must be a string` };
      }
      const trimmed = value.trim();
      if (!trimmed) {
        return rule.required ? { error: `${field} cannot be empty` } : { value: null };
      }
      if (trimmed.length > rule.maxLength) {
        return { error: `${field} must be at most ${rule.maxLength} characters` };
      }
      return { value: trimmed };
    }
    case 'isbn': {
      if (typeof value !== 'string') {
        return { error: `${field} must be a string` };
      }
      const normalized = value.replace(/[-\s]/g, '').toUpperCase();
      if (!/^(\d{9}[\dX]|\d{13})$/.test(normalized)) {
        return { error: `${field} must be a valid ISBN-10 or ISBN-13` };
      }
      return { value: normalized };
    }
    case 'year':
      if (!Number.isInteger(value) || value < 0 || value > MAX_YEAR) {
        return { error: `${field} must be an integer between 0 and ${MAX_YEAR}` };
      }
      return { value };
    case 'boolean':
      if (typeof value !== 'boolean') {
        return { error: `${field} must be true or false` };
      }
      return { value };
    default:
      throw new Error(`Unknown rule type: ${rule.type}`);
  }
}

/**
 * Validates a book payload.
 * partial = false: full object (POST, PUT), title and author are required.
 * partial = true: any subset of fields (PATCH), at least one is required.
 */
function validateBook(body, { partial = false } = {}) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { errors: ['request body must be a JSON object (Content-Type: application/json)'] };
  }

  const errors = [];
  const data = {};

  for (const key of Object.keys(body)) {
    if (!Object.hasOwn(RULES, key)) {
      errors.push(`unknown field: ${key}`);
    }
  }

  for (const [field, rule] of Object.entries(RULES)) {
    if (body[field] === undefined) {
      if (rule.required && !partial) {
        errors.push(`${field} is required`);
      }
      continue;
    }
    const result = checkField(field, body[field], rule);
    if (result.error) {
      errors.push(result.error);
    } else {
      data[field] = result.value;
    }
  }

  if (partial && errors.length === 0 && Object.keys(data).length === 0) {
    errors.push('at least one field must be provided');
  }

  return { errors, data };
}

function parseListQuery(query) {
  const errors = [];
  const filters = { limit: 20, offset: 0 };
  const { genre, author, available, limit, offset } = query;

  if (typeof genre === 'string' && genre.trim()) {
    filters.genre = genre.trim();
  }
  if (typeof author === 'string' && author.trim()) {
    filters.author = author.trim();
  }
  if (available !== undefined) {
    if (available === 'true' || available === 'false') {
      filters.available = available === 'true';
    } else {
      errors.push('available must be true or false');
    }
  }
  if (limit !== undefined) {
    const n = Number(limit);
    if (!Number.isInteger(n) || n < 1 || n > 100) {
      errors.push('limit must be an integer between 1 and 100');
    } else {
      filters.limit = n;
    }
  }
  if (offset !== undefined) {
    const n = Number(offset);
    if (!Number.isInteger(n) || n < 0) {
      errors.push('offset must be a non-negative integer');
    } else {
      filters.offset = n;
    }
  }

  return { errors, filters };
}

module.exports = { validateBook, parseListQuery, DEFAULTS };
