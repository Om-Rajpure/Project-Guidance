# 🔧 Troubleshooting Guide

## Common Issues and Solutions

### 1. MongoDB Connection Error

**Error:**
```
❌ MongoDB connection error: MongoServerError: connect ECONNREFUSED
```

**Solutions:**

**A. MongoDB Not Running**
```bash
# Windows - Start MongoDB service
net start MongoDB

# Or check if MongoDB is installed
mongod --version
```

**B. Wrong Connection String**
- Check `backend/.env` file
- Default: `mongodb://localhost:27017/project-guidance`
- If using MongoDB Atlas, use your cloud connection string

**C. MongoDB Not Installed**
- Download from: https://www.mongodb.com/try/download/community
- Or use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas

---

### 2. Port Already in Use

**Error (Backend):**
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Error (Frontend):**
```
Something is already running on port 3000
```

**Solutions:**

**A. Change Port (Backend)**
Edit `backend/.env`:
```
PORT=5001
```

**B. Change Port (Frontend)**
When prompted, choose "Y" to run on a different port, or:
Edit `frontend/package.json`:
```json
"scripts": {
  "start": "PORT=3001 react-scripts start"
}
```

**C. Kill Existing Process**

Windows PowerShell:
```powershell
# Find process on port 5000
netstat -ano | findstr :5000

# Kill process (replace PID)
taskkill /PID <PID> /F
```

---

### 3. Module Not Found Errors

**Error:**
```
Error: Cannot find module 'express'
Error: Cannot find module 'axios'
```

**Solutions:**

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

**Specific Package:**
```bash
npm install express mongoose bcryptjs jsonwebtoken
```

---

### 4. CORS Error

**Error:**
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Solutions:**

**A. Backend Not Running**
- Make sure backend server is running on port 5000
- Check terminal for "🚀 Server running on port 5000"

**B. Wrong API URL**
Check `frontend/src/pages/AuthPage.jsx`:
```javascript
const response = await axios.post('http://localhost:5000/api/auth/signup', payload);
```

**C. CORS Not Configured**
Check `backend/server.js` has:
```javascript
const cors = require('cors');
app.use(cors());
```

---

### 5. JWT Secret Error

**Error:**
```
Error: secretOrPrivateKey must have a value
```

**Solution:**
Edit `backend/.env`:
```
JWT_SECRET=your_secret_key_here_change_this
```

---

### 6. Blank Page / White Screen

**Possible Causes:**

**A. JavaScript Error**
- Open browser DevTools (F12)
- Check Console tab for errors
- Fix the error shown

**B. Build Issue**
```bash
cd frontend
rm -rf node_modules
npm install
npm start
```

**C. Port Issue**
- Check if frontend is running on correct port (3000)
- Visit: http://localhost:3000

---

### 7. Styling Not Applied

**Solutions:**

**A. CSS Not Imported**
Check `frontend/src/pages/AuthPage.jsx`:
```javascript
import './AuthPage.css';
```

**B. Cache Issue**
- Hard refresh: Ctrl + Shift + R (Windows)
- Or clear browser cache

**C. Path Issue**
Make sure CSS file exists at:
`frontend/src/pages/AuthPage.css`

---

### 8. Form Not Submitting

**Possible Issues:**

**A. Network Error**
- Check if backend is running
- Open DevTools → Network tab
- Look for failed requests (red)

**B. Validation Error**
- Check browser console
- Server may be returning validation errors
- Fill all required fields

**C. JavaScript Error**
- Open console (F12)
- Look for red error messages

---

### 9. Authentication Not Working

**Issue:** User created but can't login

**Solutions:**

**A. Wrong Credentials**
- Check email spelling
- Check password (case-sensitive)

**B. Database Issue**
```bash
# Connect to MongoDB
mongo

# Check users
use project-guidance
db.users.find()
```

**C. Token Issue**
- Clear localStorage in browser DevTools
- Application → Local Storage → Clear

---

### 10. Environment Variables Not Loading

**Error:**
```
undefined is not valid as a JWT secret
```

**Solutions:**

**A. .env File Missing**
Create `backend/.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/project-guidance
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

**B. dotenv Not Loaded**
Check `backend/server.js`:
```javascript
const dotenv = require('dotenv');
dotenv.config();
```

**C. Restart Server**
- Stop backend (Ctrl + C)
- Restart: `npm run dev`

---

### 11. Slow Performance

**Solutions:**

**A. Development Mode**
- React dev mode is slower
- For production: `npm run build`

**B. Too Many Console Logs**
- Remove unnecessary console.log statements

**C. Animation Heavy**
- Reduce animation complexity if needed
- Lower animation duration

---

### 12. Password Hashing Error

**Error:**
```
Error: Illegal arguments: undefined, string
```

**Solution:**
Make sure password is provided:
```javascript
if (!password) {
  return res.status(400).json({ message: 'Password is required' });
}
```

---

### 13. Nodemon Not Working

**Error:**
```
'nodemon' is not recognized as an internal or external command
```

**Solutions:**

**A. Install Nodemon**
```bash
cd backend
npm install --save-dev nodemon
```

**B. Use Node Instead**
```bash
node server.js
```

**C. Global Install**
```bash
npm install -g nodemon
```

---

### 14. React Router Issues

**Error:**
```
Cannot GET /dashboard
```

**Solution:**
- These routes don't exist yet (Step 2)
- Comment out redirect for now:
```javascript
// window.location.href = '/dashboard';
console.log('Login successful');
```

---

### 15. Network Request Failed

**Solutions:**

**A. Firewall Blocking**
- Check Windows Firewall
- Allow Node.js through firewall

**B. Antivirus Blocking**
- Temporarily disable antivirus
- Add exception for localhost

**C. Wrong URL**
- Check API endpoint matches backend
- Default: `http://localhost:5000`

---

## Debugging Tips

### Backend Debugging
```javascript
// Add console logs
console.log('Request body:', req.body);
console.log('User found:', user);
console.log('Token generated:', token);
```

### Frontend Debugging
```javascript
// Add console logs
console.log('Form data:', formData);
console.log('API response:', response.data);
console.log('Error:', error.response?.data);
```

### Check Logs
- **Backend:** Check terminal running backend
- **Frontend:** Check browser DevTools console
- **Network:** DevTools → Network tab

---

## Still Having Issues?

### Checklist
- [ ] MongoDB is running
- [ ] Backend server is running (port 5000)
- [ ] Frontend server is running (port 3000)
- [ ] All dependencies installed (npm install)
- [ ] .env file configured correctly
- [ ] No firewall blocking
- [ ] Browser console shows no errors
- [ ] Network tab shows successful requests

### Reset Everything
```bash
# Backend
cd backend
rm -rf node_modules
npm install

# Frontend
cd frontend
rm -rf node_modules
npm install

# Restart MongoDB
net start MongoDB

# Start servers
# Terminal 1: cd backend && npm run dev
# Terminal 2: cd frontend && npm start
```

---

## Getting Help

If you're still stuck:
1. Check the error message carefully
2. Search the error on Google/StackOverflow
3. Check MongoDB and Express documentation
4. Verify all file paths are correct
5. Make sure you're in the right directory

---

**Remember:** Most issues are due to:
- Services not running (MongoDB, backend, frontend)
- Missing dependencies (npm install)
- Wrong environment variables
- Port conflicts
