# Production Deployment Guide

## Environment Configuration

The frontend now supports environment-based configuration for seamless development and production deployment.

### Environment Files

- `.env` - Development environment (local development)
- `.env.production` - Production environment (deployed app)

### Environment Variables

| Variable | Development | Production | Description |
|----------|-------------|------------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:5000/api` | `https://linkcab-fj1k.onrender.com/api` | Backend API endpoint |
| `VITE_SOCKET_URL` | `http://localhost:5000` | `https://linkcab-fj1k.onrender.com` | WebSocket connection URL |
| `VITE_APP_NAME` | `LinkCab` | `LinkCab` | Application name |
| `VITE_APP_VERSION` | `1.0.0` | `1.0.0` | Application version |

### Development Commands

```bash
# Start development server (uses .env)
npm run dev

# Build for production (uses .env.production)
npm run build

# Preview production build
npm run preview
```

### Production Deployment

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Deploy the `dist` folder** to your hosting service (Vercel, Netlify, etc.)

3. **Environment Variables** are automatically set based on:
   - Development: Uses `.env` file
   - Production: Uses `.env.production` file

### Architecture Changes

- ✅ **Centralized Configuration**: All environment variables managed in `src/config/env.js`
- ✅ **No Hardcoded URLs**: All API calls use environment variables
- ✅ **Modular Services**: API and Socket services use centralized config
- ✅ **Build Optimization**: Optimized chunk splitting for production
- ✅ **Scalable Structure**: Easy to add new environment variables

### API Usage

All API calls now use the centralized configuration:

```javascript
import { config } from '../config/env.js';

// For API calls
const apiUrl = config.apiBaseUrl;

// For WebSocket connections
const socketUrl = config.socketUrl;

// For image URLs (base URL without /api)
const baseUrl = config.getBaseUrl();
```

### Backend URL

**Production Backend**: https://linkcab-fj1k.onrender.com

The frontend automatically connects to the correct backend based on the environment.

### Testing

To test the environment configuration:

```javascript
import testEnvironmentConfig from './utils/env-test.js';

// Run in browser console
testEnvironmentConfig();
```

This will display the current environment settings and verify correct configuration.
