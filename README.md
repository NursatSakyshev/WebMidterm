# Library API

A REST API for managing a library's books. It is built with Node.js (Express)
and PostgreSQL, and the whole application runs in Docker with one command.

## Features

- Full CRUD for the `books` resource: list, get by ID, create, replace (PUT),
  partial update (PATCH), delete
- Filtering (`genre`, `author`, `available`) and pagination (`limit`, `offset`)
- Input validation with clear error messages (`400`, `404`, `409`)
- PostgreSQL data stored in a named Docker volume, so it survives restarts
- Health check endpoint used by Docker
- API documentation and a Postman collection with tests for every endpoint

## Tech stack

| Part        | Technology                     |
|-------------|--------------------------------|
| Backend     | Node.js 20, Express 5          |
| Database    | PostgreSQL 16                  |
| DB driver   | `pg` (parameterized queries)   |
| Containers  | Docker, Docker Compose         |

## Quick start

Requirements: [Docker Desktop](https://www.docker.com/products/docker-desktop/)
(or Docker Engine with the Compose plugin).

```bash
git clone https://github.com/NursatSakyshev/WebMidterm.git
cd WebMidterm
docker compose up --build
```

The API is now available at **http://localhost:8080**. Check it:

```bash
curl http://localhost:8080/health
curl http://localhost:8080/api/books
```

On the first start the database is created and filled with 5 sample books
from [db/init.sql](db/init.sql).

Stop the app:

```bash
docker compose down        # stop containers, keep the data
docker compose down -v     # stop containers and delete the database volume
```

## Configuration

Configuration is passed through environment variables. The app works without
any setup because [compose.yaml](compose.yaml) has defaults. To change them,
create a `.env` file:

```bash
cp .env.example .env
```

| Variable      | Default        | Description                            |
|---------------|----------------|----------------------------------------|
| `APP_NAME`    | `Library API`  | Name shown in logs and on `/`          |
| `APP_PORT`    | `8080`         | Port on your machine for the API       |
| `DB_USER`     | `library_user` | PostgreSQL user                        |
| `DB_PASSWORD` | `library_pass` | PostgreSQL password                    |
| `DB_NAME`     | `library`      | PostgreSQL database name               |

Compose also sets these for the API container: `PORT=3000`, `DB_HOST=db`
and `DB_PORT=5432`.

> Database credentials are applied only when the volume is created. If you
> change them later, run `docker compose down -v` to recreate the database.

## Architecture

```
            http://localhost:8080
                     │
┌────────────────────┼───────── library-network (bridge) ─────────┐
│                    ▼                                             │
│   ┌──────────────────────────┐          ┌──────────────────────┐ │
│   │  api  (Dockerfile)       │   SQL    │  db  (postgres:16)   │ │
│   │  Node.js + Express :3000 │ ───────▶ │  host "db" :5432     │ │
│   └──────────────────────────┘          └──────────┬───────────┘ │
│                                                    │             │
└────────────────────────────────────────────────────┼─────────────┘
                                                     ▼
                                         named volume: db-data
```

- **api** is built from the custom [Dockerfile](Dockerfile). Port `3000`
  in the container is published as `8080` on the host.
- **db** uses the official PostgreSQL image. It has no published port, so it is
  reachable only from inside the Docker network.
- The services talk over the user-defined network `library-network`. Docker's
  DNS resolves the service name `db` to the database container, so the API
  connects with `DB_HOST=db`.
- `api` starts only after `db` passes its health check (`depends_on` with
  `condition: service_healthy`).
- Database files are kept in the named volume `db-data`.

## API

| Method   | Endpoint          | Description                      |
|----------|-------------------|----------------------------------|
| `GET`    | `/health`         | API and database status          |
| `GET`    | `/api/books`      | List books (filters, pagination) |
| `GET`    | `/api/books/:id`  | Get a book by ID                 |
| `POST`   | `/api/books`      | Create a book                    |
| `PUT`    | `/api/books/:id`  | Replace a book                   |
| `PATCH`  | `/api/books/:id`  | Update some fields of a book     |
| `DELETE` | `/api/books/:id`  | Delete a book                    |

Full documentation with request and response examples is in
**[docs/API.md](docs/API.md)**.

## Postman collection

The collection is in
[postman/Library-API.postman_collection.json](postman/Library-API.postman_collection.json).

1. In Postman, click **Import** and select the file.
2. Start the app with `docker compose up --build`.
3. Open the collection and click **Run** to run all requests in order.
   Each request has tests that check the response.

The `baseUrl` collection variable is `http://localhost:8080`. Change it if
you use a different `APP_PORT`.

The collection can also be run from the terminal with
[Newman](https://www.npmjs.com/package/newman):

```bash
npx newman run postman/Library-API.postman_collection.json
```

## Project structure

```
.
├── compose.yaml                 # Services: api + db, network, volume
├── Dockerfile                   # Image for the backend
├── .env.example                 # Example environment variables
├── db/
│   └── init.sql                 # Table schema + sample data
├── docs/
│   └── API.md                   # API documentation
├── postman/
│   └── Library-API.postman_collection.json
└── src/
    ├── server.js                # Starts the HTTP server, graceful shutdown
    ├── app.js                   # Express app: middleware and routes
    ├── config.js                # Reads and checks environment variables
    ├── db.js                    # PostgreSQL connection pool
    ├── routes/
    │   └── books.js             # HTTP handlers for /api/books
    ├── repositories/
    │   └── bookRepository.js    # SQL queries
    ├── validators/
    │   └── bookValidator.js     # Request body and query validation
    └── middleware/
        ├── requestLogger.js     # Logs each request
        └── errorHandlers.js     # 404 and error responses
```

## Running without Docker (optional)

You need Node.js 18+ and a running PostgreSQL with the table from
`db/init.sql`.

```bash
npm install
DB_HOST=localhost DB_USER=library_user DB_PASSWORD=library_pass DB_NAME=library npm run dev
```
