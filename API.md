# API Documentation

Base URL: `http://localhost:8080/api/v1`

## Authentication

This API uses JWT (JSON Web Tokens) for authentication. After logging in, you'll receive an access token and a refresh token.

- **Access Token**: Short-lived (15 minutes), used for API requests
- **Refresh Token**: Long-lived (7 days), used to get new access tokens

### Using the Access Token

Include the access token in the `Authorization` header for all protected endpoints:

```
Authorization: Bearer <access_token>
```

### Token Refresh Flow

1. Store both tokens securely (e.g., httpOnly cookies or secure storage)
2. When access token expires (401 response), call `/auth/refresh` with the refresh token
3. Replace both tokens with the new ones returned
4. Retry the failed request

---

## Endpoints

### Authentication

#### Register

Create a new user account.

```
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "minimum8chars"
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "created_at": "2025-01-15T10:30:00Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "550e8400-e29b-41d4-a716-446655440000",
  "expires_in": 900
}
```

**Errors:**
- `400` - Invalid email format or password less than 8 characters
- `409` - Email already registered

---

#### Login

Authenticate and receive tokens.

```
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "created_at": "2025-01-15T10:30:00Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "550e8400-e29b-41d4-a716-446655440000",
  "expires_in": 900
}
```

**Errors:**
- `400` - Missing email or password
- `401` - Invalid email or password

---

#### Refresh Tokens

Exchange a refresh token for new access and refresh tokens.

```
POST /auth/refresh
```

**Request Body:**
```json
{
  "refresh_token": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "created_at": "2025-01-15T10:30:00Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "660e8400-e29b-41d4-a716-446655440001",
  "expires_in": 900
}
```

> **Note:** The refresh token is rotated on each use. Always store the new refresh token.

**Errors:**
- `400` - Missing refresh token
- `401` - Invalid or expired refresh token

---

#### Logout

Invalidate the current refresh token.

```
POST /auth/logout
```

**Request Body (optional):**
```json
{
  "refresh_token": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

---

#### Logout from All Devices

Invalidate all refresh tokens for the current user. **Requires authentication.**

```
POST /auth/logout-all
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "message": "Logged out from all devices successfully"
}
```

---

#### Get Current User

Get the authenticated user's profile. **Requires authentication.**

```
GET /auth/me
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "created_at": "2025-01-15T10:30:00Z"
}
```

---

#### Change Password

Update the current user's password. **Requires authentication.**

```
PUT /auth/password
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "current_password": "oldpassword",
  "new_password": "newpassword123"
}
```

**Response (200 OK):**
```json
{
  "message": "Password updated successfully. Please login again."
}
```

> **Note:** This invalidates all refresh tokens, forcing re-login on all devices.

**Errors:**
- `400` - New password less than 8 characters
- `401` - Current password is incorrect

---

### Notes

All note endpoints require authentication.

#### Get All Notes

```
GET /notes
```

**Response (200 OK):**
```json
{
  "notes": [
    {
      "id": 1,
      "note": "My first note",
      "folder_id": null,
      "created_at": "2025-01-15T10:30:00Z"
    },
    {
      "id": 2,
      "note": "Note in a folder",
      "folder_id": 1,
      "created_at": "2025-01-15T11:00:00Z"
    }
  ]
}
```

---

#### Create Note

```
POST /notes
```

**Request Body:**
```json
{
  "note": "This is my note content",
  "folder_id": 1
}
```

> `folder_id` is optional. Omit it to create a note at the root level.

**Response (201 Created):**
```json
{
  "message": "Note created successfully",
  "note": {
    "id": 3,
    "note": "This is my note content",
    "folder_id": 1,
    "created_at": "2025-01-15T12:00:00Z"
  }
}
```

**Errors:**
- `400` - Missing note content or folder not found

---

### Folders

All folder endpoints require authentication.

#### Get All Folders (Flat)

```
GET /folders
```

**Response (200 OK):**
```json
{
  "folders": [
    {
      "id": 1,
      "name": "Work",
      "parent_id": null,
      "created_at": "2025-01-15T10:00:00Z"
    },
    {
      "id": 2,
      "name": "Projects",
      "parent_id": 1,
      "created_at": "2025-01-15T10:05:00Z"
    }
  ]
}
```

---

#### Get Folder Tree

Get all folders, notes, and files in a hierarchical tree structure.

```
GET /folders/tree
```

**Response (200 OK):**
```json
{
  "folders": [
    {
      "id": 1,
      "name": "Work",
      "parent_id": null,
      "created_at": "2025-01-15T10:00:00Z",
      "folders": [
        {
          "id": 2,
          "name": "Projects",
          "parent_id": 1,
          "created_at": "2025-01-15T10:05:00Z",
          "folders": [],
          "notes": [],
          "files": []
        }
      ],
      "notes": [
        {
          "id": 1,
          "note": "Work notes",
          "folder_id": 1,
          "created_at": "2025-01-15T10:30:00Z"
        }
      ],
      "files": []
    }
  ],
  "notes": [
    {
      "id": 2,
      "note": "Root level note",
      "folder_id": null,
      "created_at": "2025-01-15T11:00:00Z"
    }
  ],
  "files": []
}
```

---

#### Get Single Folder

Get a folder with its immediate contents (subfolders, notes, files).

```
GET /folders/:id
```

**Response (200 OK):**
```json
{
  "folder": {
    "id": 1,
    "name": "Work",
    "parent_id": null,
    "created_at": "2025-01-15T10:00:00Z",
    "folders": [...],
    "notes": [...],
    "files": [...]
  }
}
```

**Errors:**
- `400` - Invalid folder ID
- `404` - Folder not found

---

#### Create Folder

```
POST /folders
```

**Request Body:**
```json
{
  "name": "New Folder",
  "parent_id": 1
}
```

> `parent_id` is optional. Omit it to create a root-level folder.

**Response (201 Created):**
```json
{
  "message": "Folder created successfully",
  "folder": {
    "id": 3,
    "name": "New Folder",
    "parent_id": 1,
    "created_at": "2025-01-15T12:00:00Z"
  }
}
```

**Errors:**
- `400` - Missing name or parent folder not found

---

#### Delete Folder

Deletes a folder and all its contents (subfolders, notes, files).

```
DELETE /folders/:id
```

**Response (200 OK):**
```json
{
  "message": "Folder deleted successfully"
}
```

**Errors:**
- `400` - Invalid folder ID
- `404` - Folder not found

---

### Files

All file endpoints require authentication.

#### Get All Files

```
GET /files
```

**Response (200 OK):**
```json
{
  "files": [
    {
      "id": 1,
      "name": "document.pdf",
      "size": 102400,
      "mime_type": "application/pdf",
      "folder_id": 1,
      "created_at": "2025-01-15T10:30:00Z"
    }
  ]
}
```

---

#### Upload File

```
POST /files
```

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `file` (required): The file to upload
- `folder_id` (optional): Folder ID to place the file in

**Example (JavaScript):**
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('folder_id', '1'); // optional

const response = await fetch('/api/v1/files', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  },
  body: formData
});
```

**Response (201 Created):**
```json
{
  "message": "File uploaded successfully",
  "file": {
    "id": 2,
    "name": "photo.jpg",
    "size": 204800,
    "mime_type": "image/jpeg",
    "folder_id": 1,
    "created_at": "2025-01-15T12:00:00Z"
  }
}
```

**Errors:**
- `400` - No file provided, file too large (>1GB), or folder not found

---

#### Download File

```
GET /files/:id
```

**Response:** Binary file data with appropriate `Content-Type` and `Content-Disposition` headers.

**Example (JavaScript):**
```javascript
const response = await fetch(`/api/v1/files/${fileId}`, {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
const blob = await response.blob();
const url = URL.createObjectURL(blob);
```

**Errors:**
- `400` - Invalid file ID
- `404` - File not found

---

#### Delete File

```
DELETE /files/:id
```

**Response (200 OK):**
```json
{
  "message": "File deleted successfully"
}
```

**Errors:**
- `400` - Invalid file ID
- `404` - File not found

---

## Error Handling

All errors follow this format:

```json
{
  "error": "Error message here"
}
```

### Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing or invalid token |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 500 | Internal Server Error |

### Handling 401 Errors

When you receive a 401 error:

1. Check if you have a refresh token stored
2. If yes, call `POST /auth/refresh` to get new tokens
3. If refresh succeeds, retry the original request
4. If refresh fails (401), redirect user to login

---

## Example: React Auth Hook

```javascript
// useAuth.js
import { useState, useCallback } from 'react';

const API_URL = 'http://localhost:8080/api/v1';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken'));

  const login = useCallback(async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error);
    }

    const data = await res.json();
    setUser(data.user);
    setAccessToken(data.access_token);
    setRefreshToken(data.refresh_token);
    localStorage.setItem('accessToken', data.access_token);
    localStorage.setItem('refreshToken', data.refresh_token);

    return data;
  }, []);

  const logout = useCallback(async () => {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    });

    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }, [refreshToken]);

  const authFetch = useCallback(async (url, options = {}) => {
    const res = await fetch(`${API_URL}${url}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (res.status === 401 && refreshToken) {
      // Try to refresh
      const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken })
      });

      if (refreshRes.ok) {
        const data = await refreshRes.json();
        setAccessToken(data.access_token);
        setRefreshToken(data.refresh_token);
        localStorage.setItem('accessToken', data.access_token);
        localStorage.setItem('refreshToken', data.refresh_token);

        // Retry original request
        return fetch(`${API_URL}${url}`, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${data.access_token}`
          }
        });
      } else {
        // Refresh failed, logout
        await logout();
        throw new Error('Session expired');
      }
    }

    return res;
  }, [accessToken, refreshToken, logout]);

  return { user, login, logout, authFetch, isAuthenticated: !!accessToken };
}
```

---

## CORS

The API allows requests from any origin with the following headers:
- `Content-Type`
- `Authorization`
- `Accept`

Supported methods: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`
