CREATE TABLE IF NOT EXISTS books (
  id             SERIAL PRIMARY KEY,
  title          VARCHAR(200) NOT NULL,
  author         VARCHAR(120) NOT NULL,
  isbn           VARCHAR(13)  UNIQUE,
  published_year INTEGER      CHECK (published_year BETWEEN 0 AND 2100),
  genre          VARCHAR(50),
  available      BOOLEAN      NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

INSERT INTO books (title, author, isbn, published_year, genre, available) VALUES
  ('1984',                     'George Orwell',               '9780451524935', 1949, 'Dystopian',   true),
  ('To Kill a Mockingbird',    'Harper Lee',                  '9780061120084', 1960, 'Fiction',     true),
  ('The Hobbit',               'J.R.R. Tolkien',              '9780547928227', 1937, 'Fantasy',     false),
  ('Clean Code',               'Robert C. Martin',            '9780132350884', 2008, 'Programming', true),
  ('The Pragmatic Programmer', 'David Thomas, Andrew Hunt',   '9780135957059', 2019, 'Programming', true)
ON CONFLICT (isbn) DO NOTHING;
