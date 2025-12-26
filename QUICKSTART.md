# Quick Start Guide

## 🚀 Run the Application

### Option 1: Manual (Recommended for Development)

**Terminal 1 - Backend Server:**
```powershell
cd "C:\Users\omraj\OneDrive\Desktop\Project Guidance\backend"
npm run dev
```

**Terminal 2 - Frontend Server:**
```powershell
cd "C:\Users\omraj\OneDrive\Desktop\Project Guidance\frontend"
npm start
```

### Option 2: Using start-backend.bat and start-frontend.bat

Double-click the batch files to start each server.

---

## ✅ Verify Setup

1. **Backend Health Check:**
   Open browser: `http://localhost:5000/health`
   Should see: `{"status":"ok","message":"Server is running"}`

2. **Frontend:**
   Open browser: `http://localhost:3000`
   Should see the login/signup page

---

## 🎯 Test the Login/Signup Flow

### Signup Flow:
1. Click "Sign Up" tab
2. Select role: Team Leader or Member
3. Fill in:
   - Full Name: Test User
   - Email: test@example.com
   - Password: test123
4. Click "Create Account"
5. On success, you'll be redirected based on role

### Login Flow:
1. Click "Login" tab
2. Enter:
   - Email: test@example.com
   - Password: test123
3. Click "Login"
4. On success, you'll be redirected

---

## 📌 Important Notes

- **MongoDB must be running** before starting the backend
- Backend runs on port **5000**
- Frontend runs on port **3000**
- Check console logs for errors
- JWT token is stored in localStorage

---

## 🐛 Common Issues

**Issue:** "Cannot connect to MongoDB"
**Solution:** Start MongoDB service or install MongoDB

**Issue:** "Port 5000 already in use"
**Solution:** Change PORT in backend/.env or kill the process

**Issue:** "Network Error" in frontend
**Solution:** Make sure backend is running on port 5000

---

## 📱 What You Should See

The login/signup page features:
- ✨ Animated gradient background with floating orbs
- 🎨 Dark theme with purple/blue gradient accents
- 👑 Role selection cards (Team Leader / Member)
- 🔄 Smooth transitions between login/signup
- ⚡ Real-time form validation
- 🎯 Loading states with spinner
- ✅ Success/error alerts

---

**Next:** Once this step works, we'll build Step 2: Team Creation & Invite System
