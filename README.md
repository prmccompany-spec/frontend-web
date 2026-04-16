# PRMCF - Production Ready Monorepo

A complete, production-ready monorepo setup with React + Vite frontend, Node.js Express backend, and Flutter mobile application.

## Table of Contents

- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Applications](#running-the-applications)
- [API Documentation](#api-documentation)
- [Database Setup](#database-setup)
- [Authentication](#authentication)
- [Project Standards](#project-standards)

## Project Structure

```
prmcf/
├── frontend-web/          # React + Vite frontend
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   ├── pages/         # Page components
│   │   │   ├── auth/      # Authentication pages (Login)
│   │   │   ├── user/      # User pages (Dashboard)
│   │   │   └── admin/     # Admin pages (Admin Panel)
│   │   ├── services/      # API & external services
│   │   ├── context/       # React Context providers
│   │   ├── routes/        # Routing configuration
│   │   └── assets/        # Static assets
│   ├── vite.config.js
│   ├── package.json
│   └── .env.example
│
├── backend/               # Node.js Express API
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   ├── middleware/    # Express middleware
│   │   ├── models/        # Data models
│   │   ├── config/        # Configuration
│   │   ├── utils/         # Utility functions
│   │   └── server.js      # Entry point
│   ├── package.json
│   └── .env.example
│
├── mobile-app/            # Flutter mobile app
│   ├── lib/
│   │   ├── screens/       # App screens
│   │   ├── services/      # API & auth services
│   │   ├── models/        # Data models
│   │   └── main.dart      # Entry point
│   ├── pubspec.yaml
│   └── .env.example
│
├── docs/                  # Documentation
│   ├── API.md
│   ├── DATABASE.md
│   └── SETUP.md
│
├── README.md              # This file
├── .gitignore
└── .env.example
```

## Tech Stack

### Frontend
- **Framework**: React 18.2.0
- **Build Tool**: Vite 5.0.0
- **HTTP Client**: Axios
- **Routing**: React Router DOM v6
- **State Management**: React Context API

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **CORS**: Enabled
- **Env Management**: dotenv

### Mobile
- **Framework**: Flutter
- **Language**: Dart
- **HTTP Client**: http package
- **Storage**: shared_preferences
- **State Management**: Provider
- **Env Management**: flutter_dotenv

## Prerequisites

Before you begin, make sure you have installed:

1. **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
2. **Flutter SDK** (v3.0 or higher) - [Download](https://flutter.dev/docs/get-started/install)
3. **MySQL** (v5.7 or higher) - [Download](https://www.mysql.com/downloads/)
4. **Git** - [Download](https://git-scm.com/)

### Verify Installation
```bash
node --version       # v16.0.0 or higher
npm --version        # v8.0.0 or higher
flutter --version    # Flutter 3.0+ Channel stable
mysql --version      # mysql Ver 8.0+
```

## Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd prmcf
```

### 2. Setup Frontend
```bash
cd frontend-web

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Update .env with your API base URL if needed
# VITE_API_BASE_URL=http://localhost:3000/api
```

### 3. Setup Backend
```bash
cd ../backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Update .env with your database credentials and JWT secret
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=your_password
# DB_NAME=prmcf_db
# JWT_SECRET=your_super_secret_key
```

### 4. Setup Mobile
```bash
cd ../mobile-app

# Get Flutter packages
flutter pub get

# Create environment file
cp .env.example .env

# Update .env with your API base URL
# API_BASE_URL=http://localhost:3000/api
```

### 5. Database Setup
```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE prmcf_db;
USE prmcf_db;

# Create users table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

# Create sample admin user (password: admin123)
INSERT INTO users (name, email, password, role) 
VALUES ('Admin User', 'admin@example.com', '$2a$10$...', 'admin');
```

## Running the Applications

### Option 1: Run Each Service Separately

#### Frontend
```bash
cd frontend-web
npm run dev
# Runs on http://localhost:5173
```

#### Backend
```bash
cd backend
npm run dev
# Runs on http://localhost:3000
# Health check: http://localhost:3000/api/health
```

#### Mobile
```bash
cd mobile-app
flutter run
# Select your device/emulator
```

### Option 2: Production Build

#### Frontend Build
```bash
cd frontend-web
npm run build
npm run preview
```

#### Backend Production
```bash
cd backend
npm start
```

#### Mobile Build
```bash
cd mobile-app
# For Android
flutter build apk

# For iOS
flutter build ios
```

## API Documentation

### Authentication Endpoints

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "user@example.com",
    "role": "user"
  }
}
```

#### Register
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}

Response:
{
  "success": true,
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "user@example.com",
    "role": "user"
  }
}
```

#### Get Profile
```
GET /api/auth/profile
Authorization: Bearer <access_token>

Response:
{
  "success": true,
  "user": {
    "id": 1,
    "role": "user"
  }
}
```

### Health Check
```
GET /api/health

Response:
{
  "status": "UP",
  "message": "Server is running"
}
```

## Authentication

The application uses **JWT (JSON Web Tokens)** for authentication:

1. **Frontend**: Stores token in `localStorage`
2. **Mobile**: Stores token in `shared_preferences`
3. **Backend**: Validates token in `authMiddleware`
4. **Token Refresh**: Implement refresh token logic in production

### Token Format
```
Authorization: Bearer <jwt_token>
```

## Project Standards

### Code Organization
- Follow MVC pattern in backend
- Component-based architecture in frontend
- Service layer for API calls
- Context for state management

### Naming Conventions
- **Components**: PascalCase (e.g., `LoginForm.jsx`)
- **Functions**: camelCase (e.g., `handleLogin`)
- **Constants**: UPPER_CASE (e.g., `API_BASE_URL`)
- **Directories**: kebab-case (e.g., `auth-service`)

### Environment Variables
All sensitive data should be stored in `.env` files:
- Never commit `.env` files
- Use `.env.example` as template
- Update `.env` files before running

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/feature-name

# Commit changes
git commit -m "feat: describe what was added"

# Push and create pull request
git push origin feature/feature-name
```

## Troubleshooting

### Frontend Issues
- **Port 5173 already in use**: `lsof -ti:5173 | xargs kill -9`
- **Node modules issues**: Delete `node_modules` and `package-lock.json`, then `npm install`

### Backend Issues
- **Port 3000 already in use**: `lsof -ti:3000 | xargs kill -9`
- **Database connection failed**: Check MySQL is running and credentials in `.env`
- **JWT errors**: Verify `JWT_SECRET` is set and consistent

### Mobile Issues
- **Flutter version mismatch**: Run `flutter pub get` and `flutter packages upgrade`
- **Android emulator issues**: Use `emulator -list-avds` and `emulator -avd <name>`

## Performance Optimization

### Frontend
- Code splitting with React.lazy()
- Image optimization with WebP
- Caching strategies in service workers

### Backend
- Database connection pooling
- Request validation middleware
- Rate limiting for API endpoints

### Mobile
- Asset compression
- Lazy loading modules
- Build optimization flags

## Security Best Practices

1. **Keep dependencies updated**: `npm audit`, `flutter pub outdated`
2. **Use HTTPS in production**
3. **Implement rate limiting**
4. **Validate all user inputs**
5. **Use environment variables for secrets**
6. **Implement CORS properly**
7. **Add CSRF protection**

## Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Commit with clear messages
5. Push and create a pull request

## License

This project is licensed under the MIT License - see LICENSE file for details.

## Support

For issues or questions:
1. Check the `docs/` folder
2. Review existing issues
3. Create a detailed bug report with reproduction steps

---

**Last Updated**: March 2026
**Version**: 1.0.0
