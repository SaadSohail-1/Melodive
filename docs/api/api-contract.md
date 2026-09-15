# Melodive API

## Authentication Routes

**Prefix:** `/api/auth`

---

### `POST /register`

Registers a new user.

#### Request

**Body Example**

```json
{
  "username": "saad",
  "email": "saad@example.com",
  "password": "examplePassword123"
}
```

**Body Fields**

| Field      | Type   | Required | Description                     |
| ---------- | ------ | -------- | ------------------------------- |
| `username` | string | Yes      | Unique username for the account |
| `email`    | string | Yes      | User's email address            |
| `password` | string | Yes      | Password for the account        |

#### Response

**201 Created**

**Response Example**

```json
{
  "user": {
    "id": "aeb43381-1e28-4943-9ae5-2151c5c6c398",
    "username": "saad",
    "email": "saad@example.com"
  }
}
```

**Response Fields**

| Field           | Type          | Required | Description          |
| --------------- | ------------- | -------- | -------------------- |
| `user`          | object        | Yes      | Newly created user   |
| `user.id`       | string (UUID) | Yes      | Unique user ID       |
| `user.username` | string        | Yes      | User's username      |
| `user.email`    | string        | Yes      | User's email address |

---

### `POST /login`

Authenticates an existing user and creates a session.

#### Request

**Body Example**

```json
{
  "email": "saad@example.com",
  "password": "examplePassword123"
}
```

**Body Fields**

| Field      | Type   | Required | Description                               |
| ---------- | ------ | -------- | ----------------------------------------- |
| `email`    | string | Yes      | Email address associated with the account |
| `password` | string | Yes      | Account password                          |

#### Response

**200 OK**

**Response Example**

```json
{
  "user": {
    "id": "aeb43381-1e28-4943-9ae5-2151c5c6c398",
    "username": "saad",
    "email": "saad@example.com"
  }
}
```

**Response Fields**

| Field           | Type          | Required | Description          |
| --------------- | ------------- | -------- | -------------------- |
| `user`          | object        | Yes      | Authenticated user   |
| `user.id`       | string (UUID) | Yes      | Unique user ID       |
| `user.username` | string        | Yes      | User's username      |
| `user.email`    | string        | Yes      | User's email address |

**401 Unauthorized**

**Response Example**

```json
{
  "error": "Invalid email or password"
}
```

**Response Fields**

| Field   | Type   | Required | Description                                        |
| ------- | ------ | -------- | -------------------------------------------------- |
| `error` | string | Yes      | Error message describing why authentication failed |

---

### `POST /logout`

Logs out the currently authenticated user and ends their session.

#### Response

**200 OK**

**Response Example**

```json
{
  "message": "Logged out"
}
```

**Response Fields**

| Field     | Type   | Required | Description                                    |
| --------- | ------ | -------- | ---------------------------------------------- |
| `message` | string | Yes      | Confirmation that the user has been logged out |

---

# User Routes

**Prefix:** `/api/users`

---

### `GET /me`

Returns the ID of the currently authenticated user.

#### Request

**Cookie**

```text
session=<token>
```

**Request Fields**

| Field     | Type   | Required | Description                                    |
| --------- | ------ | -------- | ---------------------------------------------- |
| `session` | string | Yes      | Session token used to authenticate the request |

#### Response

**200 OK**

**Response Example**

```json
{
  "userId": "aeb43381-1e28-4943-9ae5-2151c5c6c398"
}
```

**Response Fields**

| Field    | Type          | Required | Description                            |
| -------- | ------------- | -------- | -------------------------------------- |
| `userId` | string (UUID) | Yes      | ID of the currently authenticated user |

**401 Unauthorized**

**Response Example**

```json
{
  "error": "Invalid or expired session"
}
```

**Response Fields**

| Field   | Type   | Required | Description                                                     |
| ------- | ------ | -------- | --------------------------------------------------------------- |
| `error` | string | Yes      | Error message indicating that the session is invalid or expired |

---

# Library Routes

**Prefix:** `/api/library`

---

### `POST /scan`

Creates a `SCAN_LIBRARY` job for scanning a music library.

The scan is processed asynchronously by the worker.

#### Request

**Body Example**

```json
{
  "path": "/path/to/music"
}
```

**Body Fields**

| Field  | Type   | Required | Description                                               |
| ------ | ------ | -------- | --------------------------------------------------------- |
| `path` | string | Yes      | Absolute path to the music library that should be scanned |

#### Response

**202 Accepted**

**Response Example**

```json
{
  "job_id": 128,
  "status": "PENDING"
}
```

**Response Fields**

| Field    | Type    | Required | Description                                                            |
| -------- | ------- | -------- | ---------------------------------------------------------------------- |
| `job_id` | integer | Yes      | ID of the background scan job                                          |
| `status` | string  | Yes      | Current job status. Newly created scan jobs have a status of `PENDING` |

---

### `GET /artists`

Returns a paginated list of artists in the music library.

#### Request

**Query Parameters**

| Parameter | Type    | Required | Default | Constraints | Description                |
| --------- | ------- | -------- | ------: | ----------- | -------------------------- |
| `page`    | integer | No       |     `1` | `>= 1`      | Page number                |
| `limit`   | integer | No       |    `20` | `1–100`     | Number of artists per page |

#### Example

```http
GET /api/library/artists?page=1&limit=20
```

#### Response

**200 OK**

**Response Example**

```json
{
  "artists": [
    {
      "id": "aeb43381-1e28-4943-9ae5-2151c5c6c398",
      "name": "Linkin Park",
      "imagePath": "/artists/linkin-park.jpg",
      "albumCount": 2,
      "trackCount": 25
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

**Response Fields**

| Field                   | Type          | Required | Description                                 |
| ----------------------- | ------------- | -------- | ------------------------------------------- |
| `artists`               | array         | Yes      | List of artists for the requested page      |
| `artists[].id`          | string (UUID) | Yes      | Unique artist ID                            |
| `artists[].name`        | string        | Yes      | Artist's name                               |
| `artists[].imagePath`   | string | null | Yes      | Path to the artist's image, if available    |
| `artists[].albumCount`  | integer       | Yes      | Number of albums associated with the artist |
| `artists[].trackCount`  | integer       | Yes      | Number of tracks associated with the artist |
| `pagination`            | object        | Yes      | Pagination metadata                         |
| `pagination.page`       | integer       | Yes      | Current page number                         |
| `pagination.limit`      | integer       | Yes      | Number of artists requested per page        |
| `pagination.total`      | integer       | Yes      | Total number of artists                     |
| `pagination.totalPages` | integer       | Yes      | Total number of available pages             |

---

### `GET /artists/:id`

Returns a single artist by ID.

#### Request

**Path Parameter**

| Parameter | Type          | Required | Description             |
| --------- | ------------- | -------- | ----------------------- |
| `id`      | string (UUID) | Yes      | Unique ID of the artist |

#### Example

```http
GET /api/library/artists/aeb43381-1e28-4943-9ae5-2151c5c6c398
```

#### Response

**200 OK**

**Response Example**

```json
{
  "data": {
    "id": "aeb43381-1e28-4943-9ae5-2151c5c6c398",
    "name": "Linkin Park",
    "imagePath": "/storage/artists/linkin-park.jpg"
  }
}
```

**Response Fields**

| Field            | Type          | Required | Description                              |
| ---------------- | ------------- | -------- | ---------------------------------------- |
| `data`           | object        | Yes      | Artist information                       |
| `data.id`        | string (UUID) | Yes      | Unique artist ID                         |
| `data.name`      | string        | Yes      | Artist's name                            |
| `data.imagePath` | string | null | Yes      | Path to the artist's image, if available |

**404 Not Found**

**Response Example**

```json
{
  "error": "Artist not found"
}
```

**Response Fields**

| Field   | Type   | Required | Description                                                       |
| ------- | ------ | -------- | ----------------------------------------------------------------- |
| `error` | string | Yes      | Error message indicating that the requested artist does not exist |

```