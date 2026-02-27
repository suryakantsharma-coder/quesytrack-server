# QusyTrack Backend API

Backend API server for QusyTrack application built with Node.js, Express.js, MongoDB, and JWT authentication.

## 🏗️ Architecture

This backend is designed to match the frontend's expected API response format:
```json
{
  "success": boolean,
  "message": "string",
  "data": { ... },
  "error": "string"
}
```

## 📁 Project Structure

```
server/
├── src/
│   ├── config/
│   │   ├── db.js              # MongoDB connection
│   │   └── jwt.js             # JWT config & helpers
│   ├── models/
│   │   └── user.model.js      # User MongoDB schema
│   ├── controllers/
│   │   └── auth.controller.js # Auth business logic
│   ├── routes/
│   │   └── auth.routes.js     # Auth route definitions
│   ├── middlewares/
│   │   ├── auth.middleware.js # JWT authentication
│   │   └── error.middleware.js # Error handling
│   ├── utils/
│   │   ├── apiResponse.js     # Standardized responses
│   │   └── asyncHandler.js   # Async error wrapper
│   ├── app.js                 # Express app setup
│   └── server.js              # Server entry point
├── .env.example               # Environment variables template
├── package.json
└── README.md
```

## 🚀 Setup & Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)

### Installation Steps

1. **Install dependencies**
   ```bash
   cd server
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set:
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: A secure random string (generate with: `openssl rand -base64 32`)
   - `PORT`: Server port (default: 4000)

3. **Start MongoDB** (if using local MongoDB)
   ```bash
   # macOS with Homebrew
   brew services start mongodb-community
   
   # Or run MongoDB manually
   mongod
   ```

4. **Run the server**
   ```bash
   # Development mode (with auto-reload)
   npm run dev
   
   # Production mode
   npm start
   ```

The server will start on `http://localhost:4000` (or your configured PORT).

## 📡 API Endpoints

### Base URL
```
http://localhost:4000/api
```

### Authentication Endpoints

#### 1. Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "designation": "Project Manager",  // Optional
  "role": "Admin"                     // Optional: "Admin" | "Viewer" | "Editor" (default: "Viewer")
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "designation": "Project Manager",
      "role": "Admin",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt_token_here"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "User with this email already exists"
}
```

#### 2. Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "designation": "Project Manager",
      "role": "Admin",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt_token_here"
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

#### 3. Get Current User (Protected)
```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "designation": "Project Manager",
      "role": "Admin",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": "No token provided, authorization denied"
}
```

## 🔐 Authentication Flow

### Frontend Integration

1. **Register/Login**: Frontend sends credentials to `/api/auth/register` or `/api/auth/login`
2. **Store Token**: Frontend receives JWT token and stores it (localStorage/cookies)
3. **Authenticated Requests**: Frontend includes token in `Authorization` header:
   ```javascript
   headers: {
     'Authorization': `Bearer ${token}`
   }
   ```
4. **Get Current User**: Frontend calls `/api/auth/me` with token to get user data

### Token Storage
The frontend should store the JWT token securely. Common approaches:
- `localStorage.setItem('token', token)` (for client-side storage)
- HTTP-only cookies (more secure, requires additional setup)

## 🗄️ Database Models

### User Model
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  designation: String (optional),
  role: String (enum: ['Admin', 'Viewer', 'Editor'], default: 'Viewer'),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Note**: Password is automatically hashed before saving and excluded from JSON responses.

## 🔒 Security Features

- ✅ Password hashing with bcrypt (salt rounds: 10)
- ✅ JWT token-based authentication
- ✅ Password never returned in API responses
- ✅ Input validation
- ✅ CORS enabled for frontend
- ✅ Centralized error handling
- ✅ Secure token expiration (configurable via .env)

## 🧪 Testing with cURL

### Register
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "Admin"
  }'
```

### Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Get Current User
```bash
curl -X GET http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongod` or check MongoDB Atlas connection string
- Verify `MONGODB_URI` in `.env` is correct
- Check MongoDB logs for connection errors

### JWT Token Issues
- Ensure `JWT_SECRET` is set in `.env`
- Token expires based on `JWT_EXPIRES_IN` (default: 7 days)
- Invalid/expired tokens return 401 Unauthorized

### Port Already in Use
- Change `PORT` in `.env` to a different port
- Or kill the process using the port: `lsof -ti:4000 | xargs kill`

## 📝 Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | 4000 | No |
| `NODE_ENV` | Environment (development/production) | development | No |
| `MONGODB_URI` | MongoDB connection string | - | Yes |
| `JWT_SECRET` | Secret key for JWT signing | - | Yes |
| `JWT_EXPIRES_IN` | Token expiration time | 7d | No |

## 🔗 Frontend-Backend Connection

This backend is designed to work seamlessly with the React frontend:

1. **Response Format**: All responses match the frontend's expected format from `gaugeService.ts`:
   ```typescript
   { success: boolean, data?: T, error?: string }
   ```

2. **User Model**: Matches the team member structure from Settings screen:
   - name, email, designation, role

3. **Token Storage**: Frontend should store JWT token and include it in `Authorization: Bearer <token>` header for protected routes

4. **CORS**: Backend has CORS enabled to accept requests from frontend (typically running on `http://localhost:5173` for Vite)

## 📚 Next Steps

- Add more user management endpoints (update profile, change password)
- Implement role-based access control (RBAC) for different routes
- Add request rate limiting
- Add API documentation with Swagger/OpenAPI
- Add unit and integration tests

## 📄 License

ISC
# quesytrack-server
