# Project Guidance Platform

AI-Orchestrated Project Building Platform for Engineering Students

## 🚀 Features (Step 1 - Complete)

✅ **Dark-themed Login/Signup Page**
- Smooth animations and gradient effects
- Role selection (Team Leader / Member)
- Form validation
- JWT authentication
- Responsive design

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud)
- npm or yarn

## 🛠️ Setup Instructions

### 1. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file (already created, update values if needed):
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/project-guidance
JWT_SECRET=your_jwt_secret_key_change_this_in_production
NODE_ENV=development
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

### 3. Start MongoDB

Make sure MongoDB is running on your machine:
```bash
# Windows (if installed as service)
net start MongoDB

# Or start manually
mongod
```

### 4. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend will run on: `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```
Frontend will run on: `http://localhost:3000`

## 🎨 UI Features

- **Dark Theme**: Modern gradient-based dark theme
- **Smooth Animations**: Floating gradient orbs, slide-in/fade-in effects
- **Role Selection**: Interactive role cards for Team Leader and Member
- **Form Validation**: Real-time validation with error messages
- **Loading States**: Animated loader during API calls
- **Responsive**: Works on all screen sizes

## 📁 Project Structure

```
Project Guidance/
├── backend/
│   ├── models/
│   │   └── User.js
│   ├── routes/
│   │   └── auth.js
│   ├── .env
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx
│   │   │   └── AuthPage.css
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.css
│   └── package.json
└── README.md
```

## 🔐 API Endpoints

### Authentication

**POST** `/api/auth/signup`
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "leader" // or "member"
}
```

**POST** `/api/auth/login`
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

## 🎯 Next Steps

- Step 2: Team creation and invite system
- Step 3: Project title selection
- Step 4: Build mode selection
- Step 5: Auto roadmap generation
- And more...

## 🐛 Troubleshooting

**MongoDB Connection Error:**
- Ensure MongoDB is running
- Check connection string in `.env`

**Port Already in Use:**
- Change PORT in backend `.env`
- Or kill the process using the port

**CORS Error:**
- Backend already configured with CORS
- Check if both servers are running

## 📝 Notes

- JWT tokens expire in 7 days
- Passwords are hashed using bcrypt
- Role-based redirects after login (leaders → dashboard, members → join-team)

---

Built with ❤️ using MERN Stack
