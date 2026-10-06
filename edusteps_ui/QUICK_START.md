# 🚀 Quick Start Guide

## Fix CORS Error

### Step 1: Create `.env` file
Create a file named `.env` in the `edusteps_ui/` directory with:
```
VITE_API_URL=http://localhost:3000/api
```

### Step 2: Restart Dev Server
```bash
# Stop current server (Ctrl+C)
cd edusteps_ui
npm run dev
```

### Step 3: Verify API URL
- Open browser console (F12)
- Check for: `API URL: http://localhost:8081/api`
- If you see `https://app.internsteps.com/api`, restart the server

## New Futuristic Design

### Features
✅ Dark theme with gradient backgrounds
✅ Glassmorphism effects
✅ Smooth animations
✅ Modern UI/UX
✅ Responsive design

### Updated Components
- Buttons with gradients and glow
- Inputs with glass effect
- Cards with glassmorphism
- InfoCards with hover animations
- All screens redesigned

## Running the Project

1. **Start API Server** (port 3000):
   ```bash
   cd edusteps_api
   npm run start:dev
   ```

2. **Start Web App** (port 5173/5174):
   ```bash
   cd edusteps_ui
   npm run dev
   npx vite --port 8081
   ```

3. **Access**: `http://localhost:5173` or `http://localhost:5174`

## Troubleshooting

### CORS Error Still Appearing?
1. Check `.env` file exists and has correct URL
2. Restart Vite dev server
3. Clear browser cache (Ctrl+Shift+R)
4. Check API server is running
5. Verify API CORS allows your origin

### API Not Connecting?
1. Verify API server is running: `http://localhost:3000/api`
2. Check console for API URL log
3. Test API directly: `curl http://localhost:3000/api/auth/me`
4. Check Network tab for request details

