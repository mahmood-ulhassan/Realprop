# Troubleshooting Guide

## "Page Can't Load" Error

### Step 1: Check if Backend is Running

1. Open a terminal in the `Backend` folder
2. Run: `npm run dev`
3. You should see:
   ```
   ✅ MongoDB connected
   ✅ Server running: http://localhost:5000
   ```

### Step 2: Check if Frontend is Running

1. Open a NEW terminal in the `Frontend` folder
2. Run: `npm run dev`
3. You should see:
   ```
   VITE v7.x.x  ready in xxx ms
   ➜  Local:   http://localhost:5173/
   ```

### Step 3: Create .env File

Create a file named `.env` in the `Frontend` folder with:
```
VITE_API_URL=http://localhost:5000
```

**Important:** After creating .env, restart the frontend dev server!

### Step 4: Check Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for any red error messages
4. Share the error if you see one

### Step 5: Check Network Tab

1. In DevTools, go to Network tab
2. Try to login
3. Check if requests to `http://localhost:5000` are failing

### Common Issues:

**Issue 1: Port 5000 already in use**
- Solution: Change PORT in Backend/.env or kill the process using port 5000

**Issue 2: CORS error**
- Solution: Backend already has CORS enabled, but check if backend is running

**Issue 3: MongoDB connection error**
- Solution: Check Backend/.env has correct MONGO_URI

**Issue 4: Frontend can't connect to backend**
- Solution: Make sure both servers are running and .env file exists

### Quick Test:

1. Open browser and go to: `http://localhost:5000/health`
   - Should return: `{"ok":true,"service":"realprop-backend"}`
   
2. If that works, backend is fine. Then check frontend at: `http://localhost:5173`

### Still Having Issues?

Share:
1. What error message you see (exact text)
2. Browser console errors (F12 → Console)
3. Whether backend shows "✅ Server running"
4. Whether frontend shows "Local: http://localhost:5173"

