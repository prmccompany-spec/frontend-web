# Complete Setup Guide

## Quick Start (5 minutes)

### Prerequisites Check
```bash
node --version    # v16+
npm --version     # v8+
flutter --version # v3+
mysql --version   # v5.7+
```

### Step 1: Frontend Setup
```bash
cd frontend-web
npm install
cp .env.example .env
# Default API URL is http://localhost:3000/api (no changes needed)
npm run dev
# Opens at http://localhost:5173
```

### Step 2: Backend Setup
```bash
cd ../backend
npm install
cp .env.example .env

# Edit .env and update:
# DB_PASSWORD=your_mysql_password
# JWT_SECRET=your_super_secret_key

npm run dev
# Runs at http://localhost:3000
```

### Step 3: Database Setup
```bash
mysql -u root -p < docs/database-init.sql
```

### Step 4: Mobile Setup
```bash
cd ../mobile-app
flutter pub get
cp .env.example .env
flutter run
```

## Detailed Setup

### Frontend Setup Details

**Requirements:**
- Node.js 16+
- npm or yarn

**Installation:**
```bash
cd frontend-web
npm install
```

**Configuration:**
```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_API_BASE_URL=http://localhost:3000/api
```

**Running:**
```bash
# Development
npm run dev

# Build for production
npm run build

# Build and preview production
npm run build && npm run preview
```

**File Structure:**
```
src/
├── main.jsx              # Entry point
├── App.jsx               # Root component
├── index.css             # Global styles
├── App.css               # App styles
├── components/           # Reusable components
├── pages/                # Page components
│   ├── auth/
│   │   └── LoginPage.jsx
│   ├── user/
│   │   └── Dashboard.jsx
│   └── admin/
│       └── AdminPanel.jsx
├── services/
│   ├── api.js            # Axios instance with interceptors
│   └── authService.js    # Authentication logic
├── context/
│   └── AuthContext.jsx   # Auth state management
├── routes/
│   └── AppRoutes.jsx     # Route definitions
└── assets/               # Images, fonts, etc.
```

**Key Features:**
- Vite hot module replacement
- Axios with JWT interceptor
- Protected routes with role-based access
- Context API for state management

---

### Backend Setup Details

**Requirements:**
- Node.js 16+
- npm
- MySQL 5.7+

**Installation:**
```bash
cd backend
npm install
```

**Configuration:**
```bash
cp .env.example .env
```

Edit `.env`:
```
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=prmcf_db
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
CORS_ORIGIN=http://localhost:5173
```

**Running:**
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

**File Structure:**
```
src/
├── server.js                    # Express app setup
├── config/
│   └── database.js             # MySQL connection pool
├── middleware/
│   ├── errorHandler.js         # Error handling
│   └── authMiddleware.js       # JWT verification
├── routes/
│   └── authRoutes.js           # Auth endpoints
├── controllers/
│   └── authController.js       # Request handlers
├── services/
│   └── authService.js          # Business logic
├── models/
│   └── userModel.js            # Database queries
└── utils/
    ├── tokenUtils.js           # JWT utilities
    └── passwordUtils.js        # Password hashing
```

**Database Setup:**
```bash
# Login to MySQL
mysql -u root -p

# Run these SQL commands
CREATE DATABASE prmcf_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE prmcf_db;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
);

# Add sample users
INSERT INTO users (name, email, password, role) VALUES (
  'Admin User',
  'admin@example.com',
  '$2a$10$dXJ3SW6G7P50eS3BQObSOOuO68ug5r5H8KnzzVgXXbVxzy1HTZoO',
  'admin'
);

INSERT INTO users (name, email, password, role) VALUES (
  'Test User',
  'user@example.com',
  '$2a$10$K7is/e.P0.Tl6Z0ZqH5H3e7V1EKXNfLvDuSQJlvQJnzKhZDUEbKLm',
  'user'
);
```

**API Endpoints:**
- `GET /api/health` - Health check
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (requires token)

---

### Mobile Setup Details

**Requirements:**
- Flutter 3+
- iOS 12+ or Android 21+

**Installation:**
```bash
cd mobile-app
flutter pub get
```

**Configuration:**
```bash
cp .env.example .env
```

Edit `.env`:
```
API_BASE_URL=http://localhost:3000/api
API_TIMEOUT=30
APP_NAME=PRMCF
```

**Note:** For Android emulator, use `10.0.2.2` instead of `localhost`:
```
API_BASE_URL=http://10.0.2.2:3000/api
```

**Running:**
```bash
# Run on connected device or emulator
flutter run

# Run on specific device
flutter run -d <device_id>

# Run with verbose output
flutter run -v

# Build APK for Android
flutter build apk

# Build iOS app
flutter build ios
```

**File Structure:**
```
lib/
├── main.dart          # Entry point
├── screens/
│   ├── login_screen.dart
│   └── home_screen.dart
├── services/
│   ├── api_service.dart
│   └── auth_service.dart
├── models/
│   └── user_model.dart
└── widgets/           # Custom widgets
```

**Key Features:**
- JWT token storage in shared_preferences
- HTTP error handling
- Login/logout functionality
- Material Design UI

---

## Environment Variables Summary

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:3000/api
```

### Backend (.env)
```
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=prmcf_db
JWT_SECRET=secret_key
CORS_ORIGIN=http://localhost:5173
```

### Mobile (.env)
```
API_BASE_URL=http://localhost:3000/api
API_TIMEOUT=30
```

---

## Running All Services

### Terminal 1 - Frontend
```bash
cd frontend-web
npm run dev
```

### Terminal 2 - Backend
```bash
cd backend
npm run dev
```

### Terminal 3 - Mobile
```bash
cd mobile-app
flutter run
```

---

## Testing Login Flow

**Test Credentials:**
```
Email: user@example.com
Password: User@123
```

**Flow:**
1. Frontend: Navigate to login page
2. Enter credentials
3. Frontend sends POST to `/api/auth/login`
4. Backend validates and returns JWT token
5. Frontend stores token in localStorage
6. Frontend redirects to dashboard
7. All subsequent requests include Bearer token

---

## Troubleshooting

### Frontend Issues
```bash
# Port 5173 in use
on Windows: netstat -ano | findstr :5173

# Node modules conflict
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
```

### Backend Issues
```bash
# Port 3000 in use
on Windows: netstat -ano | findstr :3000

# Database connection error
- Check MySQL is running
- Verify credentials in .env
- Check database exists

# JWT errors
- Verify JWT_SECRET is set
- Check token format in requests
```

### Mobile Issues
```bash
# Flutter cache issues
flutter clean
flutter pub get

# Android emulator not detected
flutter emulators
flutter emulators launch <emulator_id>

# iOS simulator issues
open -a Simulator
```

---

## Performance Tips

### Frontend
- Use React DevTools for debugging
- Monitor bundle size with `npm run build`
- Use Chrome DevTools Network tab

### Backend
- Monitor MySQL queries
- Use postman for API testing
- Check server logs for errors

### Mobile
- Use Flutter DevTools: `flutter pub global run devtools`
- Test on real device for performance
- Monitor memory with Android Studio Profiler

---

## Security Checklist

- [ ] Change all default passwords
- [ ] Update JWT_SECRET in production
- [ ] Use HTTPS in production
- [ ] Enable CORS only for trusted domains
- [ ] Keep dependencies updated
- [ ] Use environment variables for secrets
- [ ] Implement rate limiting
- [ ] Enable database backups
- [ ] Use HTTPS for API calls
- [ ] Implement password reset flow

---

## Next Steps

1. Review the API documentation in `/docs/API.md`
2. Check database schema in `/docs/DATABASE.md`
3. Implement additional features per requirements
4. Set up CI/CD pipeline
5. Configure production environment
6. Set up monitoring and logging
7. Implement backup strategy

---

## Support Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Express.js Guide](https://expressjs.com)
- [Flutter Dev](https://flutter.dev/docs)
- [MySQL Documentation](https://dev.mysql.com/doc)
- [JWT Introduction](https://jwt.io/introduction)
