# Library API — Endpoint Reference

Base URL: `http://localhost:8080` (the host port can be changed with `APP_PORT` in `.env`).

All request and response bodies are JSON. Requests with a body must send
`Content-Type: application/json`.

## Contents

- [Book object](#book-object)
- [Errors](#errors)
- [GET /health](#get-health)
- [GET /api/books](#get-apibooks) — list books
- [GET /api/books/:id](#get-apibooksid) — get a book by ID
- [POST /api/books](#post-apibooks) — create a book
- [PUT /api/books/:id](#put-apibooksid) — replace a book
- [PATCH /api/books/:id](#patch-apibooksid) — update some fields
- [DELETE /api/books/:id](#delete-apibooksid) — delete a book

---

## Book object

| Field           | Type              | Writable | Rules                                                            |
|-----------------|-------------------|----------|------------------------------------------------------------------|
| `id`            | integer           | no       | Assigned by the database                                         |
| `title`         | string            | yes      | **Required**, 1–200 characters                                   |
| `author`        | string            | yes      | **Required**, 1–120 characters                                   |
| `isbn`          | string \| null    | yes      | ISBN-10 or ISBN-13, unique. Hyphens and spaces are removed       |
| `publishedYear` | integer \| null   | yes      | Between 0 and next year                                          |
| `genre`         | string \| null    | yes      | Up to 50 characters                                              |
| `available`     | boolean           | yes      | Defaults to `true`                                               |
| `createdAt`     | string (ISO 8601) | no       | Set on create                                                    |
| `updatedAt`     | string (ISO 8601) | no       | Updated on every PUT/PATCH                                       |

Example:

```json
{
  "id": 4,
  "title": "Clean Code",
  "author": "Robert C. Martin",
  "isbn": "9780132350884",
  "publishedYear": 2008,
  "genre": "Programming",
  "available": true,
  "createdAt": "2026-10-29T18:00:00.000Z",
  "updatedAt": "2026-10-29T18:00:00.000Z"
}
```

Unknown fields in a request body are rejected with `400`.

## Errors

Every error response has an `error` message. Validation errors also list
each problem in `details`.

```json
{
  "error": "Validation failed",
  "details": ["author is required", "publishedYear must be an integer between 0 and 2027"]
}
```

| Status | When                                                        |
|--------|-------------------------------------------------------------|
| `400`  | Invalid JSON, invalid fields, invalid query params or `id`  |
| `404`  | Book or route does not exist                                |
| `409`  | A book with the same ISBN already exists                    |
| `500`  | Unexpected server error                                     |
| `503`  | `/health` only: the database is not reachable               |

---

## GET /health

Checks that the API is running and can reach the database.

**Response `200`**

```json
{ "status": "ok", "database": "connected" }
```

**Response `503`**

```json
{ "status": "error", "database": "disconnected" }
```

---

## GET /api/books

Returns a page of books ordered by `id`.

**Query parameters** (all optional)

| Param       | Type    | Default | Description                                     |
|-------------|---------|---------|-------------------------------------------------|
| `genre`     | string  | —       | Exact genre, case-insensitive                   |
| `author`    | string  | —       | Part of the author name, case-insensitive       |
| `available` | boolean | —       | `true` or `false`                               |
| `limit`     | integer | `20`    | Page size, 1–100                                |
| `offset`    | integer | `0`     | Number of books to skip                         |

**Example**

```
GET /api/books?genre=programming&available=true&limit=2
```

**Response `200`**

```json
{
  "data": [
    {
      "id": 4,
      "title": "Clean Code",
      "author": "Robert C. Martin",
      "isbn": "9780132350884",
      "publishedYear": 2008,
      "genre": "Programming",
      "available": true,
      "createdAt": "2026-10-29T18:00:00.000Z",
      "updatedAt": "2026-10-29T18:00:00.000Z"
    }
  ],
  "pagination": { "total": 2, "limit": 2, "offset": 0 }
}
```

`pagination.total` is the number of books that match the filters (not only
the ones on this page).

**Errors:** `400` for an invalid `available`, `limit` or `offset`.

---

## GET /api/books/:id

Returns one book.

**Example:** `GET /api/books/4`

**Response `200`:** a [book object](#book-object).

**Errors:** `400` if `id` is not a positive integer, `404` if the book does not exist.

---

## POST /api/books

Creates a book.

**Body**

```json
{
  "title": "Dune",
  "author": "Frank Herbert",
  "isbn": "978-0441172719",
  "publishedYear": 1965,
  "genre": "Science Fiction"
}
```

`title` and `author` are required. Other fields are optional.

**Response `201`:** the created [book object](#book-object). The `Location`
header contains the URL of the new book, for example `/api/books/6`.

**Errors:** `400` validation failed, `409` ISBN already exists.

---

## PUT /api/books/:id

Replaces the whole book. The body has the same rules as `POST`: `title` and
`author` are required, and any optional field that is left out is reset to
its default (`null`, or `true` for `available`).

**Example:** `PUT /api/books/6`

```json
{
  "title": "Dune Messiah",
  "author": "Frank Herbert",
  "publishedYear": 1969,
  "genre": "Science Fiction",
  "available": false
}
```

**Response `200`:** the updated [book object](#book-object).

**Errors:** `400` validation failed or invalid `id`, `404` book not found,
`409` ISBN already used by another book.

---

## PATCH /api/books/:id

Updates only the fields that are sent. At least one field is required.
Send `null` to clear an optional field.

**Example:** `PATCH /api/books/6`

```json
{ "available": true }
```

**Response `200`:** the updated [book object](#book-object).

**Errors:** `400` validation failed, empty body or invalid `id`,
`404` book not found, `409` ISBN already used by another book.

---

## DELETE /api/books/:id

Deletes a book.

**Example:** `DELETE /api/books/6`

**Response `204`:** no body.

**Errors:** `400` invalid `id`, `404` book not found.
