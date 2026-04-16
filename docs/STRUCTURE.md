# PRMCF Project Structure

```
prmcf/
│
├── frontend-web/                  # React + Vite Frontend Application
│   ├── src/
│   │   ├── assets/               # Static assets (fonts, images)
│   │   ├── components/           # Reusable React components
│   │   ├── context/              # React Context API
│   │   │   └── AuthContext.jsx   # Authentication state
│   │   ├── pages/                # Page components
│   │   │   ├── auth/
│   │   │   │   └── LoginPage.jsx
│   │   │   ├── user/
│   │   │   │   └── Dashboard.jsx
│   │   │   └── admin/
│   │   │       └── AdminPanel.jsx
│   │   ├── routes/               # Routing configuration
│   │   │   └── AppRoutes.jsx
│   │   ├── services/             # API services
│   │   │   ├── api.js            # Axios instance with JWT interceptor
│   │   │   └── authService.js    # Authentication service
│   │   ├── App.css               # App styles
│   │   ├── App.jsx               # Root component
│   │   ├── index.css             # Global styles
│   │   └── main.jsx              # Entry point
│   ├── index.html                # HTML template
│   ├── .env.example              # Environment variables template
│   ├── .gitignore                # Git ignore rules
│   ├── vite.config.js            # Vite configuration
│   └── package.json              # Dependencies
│
├── backend/                       # Node.js Express API
│   ├── src/
│   │   ├── config/               # Configuration files
│   │   │   └── database.js       # MySQL connection pool
│   │   ├── controllers/          # Request handlers
│   │   │   └── authController.js
│   │   ├── middleware/           # Express middleware
│   │   │   ├── authMiddleware.js # JWT verification
│   │   │   └── errorHandler.js   # Error handling
│   │   ├── models/               # Data models & queries
│   │   │   └── userModel.js
│   │   ├── routes/               # API routes
│   │   │   └── authRoutes.js
│   │   ├── services/             # Business logic
│   │   │   └── authService.js
│   │   ├── utils/                # Utility functions
│   │   │   ├── tokenUtils.js     # JWT utilities
│   │   │   └── passwordUtils.js  # Password hashing
│   │   └── server.js             # Express app & entry point
│   ├── .env.example              # Environment variables template
│   ├── .gitignore                # Git ignore rules
│   └── package.json              # Dependencies
│
├── mobile-app/                    # Flutter Mobile Application
│   ├── lib/
│   │   ├── models/               # Data models
│   │   │   └── user_model.dart
│   │   ├── screens/              # App screens
│   │   │   ├── login_screen.dart
│   │   │   └── home_screen.dart
│   │   ├── services/             # API & auth services
│   │   │   ├── api_service.dart  # HTTP client
│   │   │   └── auth_service.dart # Authentication logic
│   │   ├── widgets/              # Custom Flutter widgets
│   │   └── main.dart             # Entry point
│   ├── .env.example              # Environment variables template
│   ├── .gitignore                # Git ignore rules
│   ├── pubspec.yaml              # Flutter dependencies
│   └── pubspec.lock              # Dependency lock file
│
├── docs/                         # Documentation
│   ├── API.md                   # API documentation
│   ├── DATABASE.md              # Database setup guide
│   └── SETUP.md                 # Detailed setup instructions
│
├── README.md                    # Project overview & quick start
├── .env.example                 # Root environment template
├── .gitignore                   # Root git ignore rules
├── setup.sh                     # Quick start script (Linux/Mac)
└── setup.bat                    # Quick start script (Windows)
```

## Key Technologies

- **Frontend**: React 18.2, Vite 5.0, React Router DOM v6, Axios
- **Backend**: Express.js, MySQL, JWT, bcryptjs
- **Mobile**: Flutter 3.0+, Dart
- **Ecosystem**: Node.js, npm, Git

## Quick Commands

### Frontend
```bash
cd frontend-web
npm install              # Install dependencies
npm run dev             # Start dev server on :5173
npm run build           # Build for production
npm run preview         # Preview production build
```

### Backend
```bash
cd backend
npm install              # Install dependencies
npm run dev             # Start with nodemon on :3000
npm start               # Start production server
```

### Mobile
```bash
cd mobile-app
flutter pub get         # Get dependencies
flutter run             # Run on connected device
flutter build apk       # Build Android APK
flutter build ios       # Build iOS app
```

## Environment Files

Each module has its own .env configuration:
- `frontend-web/.env` - Frontend API configuration
- `backend/.env` - Backend database & JWT secrets
- `mobile-app/.env` - Mobile app API configuration

## Database

MySQL database with users table for authentication:
- User management (CRUD operations)
- Role-based access (user, admin)
- Password hashing with bcryptjs
- JWT token generation for sessions

## Authentication Flow

1. User enters email & password on login page
2. Frontend sends credentials to `/api/auth/login`
3. Backend validates and returns JWT token
4. Frontend stores token in localStorage/SharedPreferences
5. Subsequent requests include token in Authorization header
6. Backend middleware validates token on protected routes

## File Naming Conventions

- **React Components**: PascalCase (e.g., `LoginPage.jsx`)
- **Functions**: camelCase (e.g., `handleLogin()`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)
- **CSS files**: kebab-case or match component
- **Flutter files**: snake_case (e.g., `login_screen.dart`)

## Port Configuration

- Frontend: `5173` (Vite dev server)
- Backend: `3000` (Express server)
- MySQL: `3306` (Default MySQL port)
- Mobile: Runs on connected device/emulator

## Security Features Implemented

✓ JWT-based authentication
✓ Password hashing with bcryptjs
✓ CORS configuration
✓ Protected API routes
✓ Role-based access control
✓ Environment variable secrets
✓ Error handling middleware

## Next Steps

1. Follow setup instructions in `docs/SETUP.md`
2. Configure environment variables in .env files
3. Initialize MySQL database (see `docs/DATABASE.md`)
4. Start all three services
5. Test login flow with provided credentials
6. Begin development on required features

---

For detailed setup instructions, see [docs/SETUP.md](docs/SETUP.md)
For API documentation, see [docs/API.md](docs/API.md)
For database setup, see [docs/DATABASE.md](docs/DATABASE.md)
