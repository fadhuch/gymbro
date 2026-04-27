# GymBro API Documentation

> **Maintenance rule:** This file must be updated whenever any API is created or modified.

## Base URL

- Local: `http://localhost:5000`
- API prefix: `/api`

## Health

### GET `/api/health`
Checks API status.

**Response (200)**
```json
{
  "success": true,
  "status": "ok",
  "timestamp": "2026-04-16T12:00:00.000Z"
}
```

## Authentication

### POST `/api/auth/register`
Creates a user and returns tokens.

**Request body**
```json
{
  "firstname": "Fahad",
  "lastname": "Khan",
  "email": "fahad@example.com",
  "number": "+923001234567",
  "password": "strongPassword123",
  "image": "https://example.com/avatar.jpg",
  "role": "user",
  "star": false,
  "priority": 0
}
```

**Required fields:** `firstname`, `lastname`, `email`, `number`, `password`

**Role options:** `super admin`, `user`, `trainer`

**Response (201)**
```json
{
  "success": true,
  "accessToken": "<jwt_access_token>",
  "refreshToken": "<jwt_refresh_token>",
  "role": "user",
  "firstname": "Fahad",
  "lastname": "Khan",
  "priority": 0
}
```

### POST `/api/auth/login`
Authenticates user with email and password.

**Request body**
```json
{
  "email": "fahad@example.com",
  "password": "strongPassword123"
}
```

**Response (200)**
```json
{
  "success": true,
  "accessToken": "<jwt_access_token>",
  "refreshToken": "<jwt_refresh_token>",
  "role": "user",
  "firstname": "Fahad",
  "lastname": "Khan",
  "priority": 0
}
```

### POST `/api/auth/refresh`
Generates new access and refresh tokens using refresh token.

**Request body**
```json
{
  "refreshToken": "<jwt_refresh_token>"
}
```

**Response (200)**
```json
{
  "success": true,
  "accessToken": "<new_jwt_access_token>",
  "refreshToken": "<new_jwt_refresh_token>",
  "role": "user",
  "firstname": "Fahad",
  "lastname": "Khan",
  "priority": 0
}
```

### GET `/api/auth/me`
Returns current user profile. Requires Bearer access token.

**Headers**
- `Authorization: Bearer <jwt_access_token>`

**Response (200)**
```json
{
  "success": true,
  "user": {
    "id": "<user_id>",
    "firstname": "Fahad",
    "lastname": "Khan",
    "email": "fahad@example.com",
    "number": "+923001234567",
    "image": "https://example.com/avatar.jpg",
    "star": false,
    "priority": 0,
    "role": "user"
  }
}
```

## Error format

```json
{
  "success": false,
  "message": "Error message"
}
```
