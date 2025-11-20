# Collaborative AI Text Editor

A real-time collaborative text editor featuring AI-powered writing assistance, live user presence, and secure authentication. Built with the MERN stack (MongoDB, Express, React, Node.js) and Socket.io.

## 🚀 Features

- **Real-time Collaboration**: Multiple users can edit the same document simultaneously with live updates.
- **Live Cursors & Presence**: See who is online and where they are editing in the document.
- **AI Writing Assistant**: Integrated with Google Gemini AI for:
  - Grammar & Spelling checks
  - Text Autocomplete
  - Content Review & Suggestions
  - Summarization
- **Rich Text Editing**: Full-featured text editor using Quill.js.
- **User Authentication**: Secure Sign Up and Login using JWT (JSON Web Tokens).
- **Document Management**: Create, save, and manage multiple documents.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Socket.io Client, React Quill, TailwindCSS (implied/likely)
- **Backend**: Node.js, Express, Socket.io, Mongoose
- **Database**: MongoDB
- **AI**: Google Generative AI (Gemini)
- **Authentication**: BCrypt, JWT

## ⚙️ Setup Instructions

### Prerequisites
- Node.js (v14+ recommended)
- MongoDB (Local or Atlas URI)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd texteditor
```

### 2. Backend Setup
Navigate to the backend directory and install dependencies:
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory with the following variables:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/texteditor  # Or your MongoDB Atlas URI
JWT_SECRET=your_super_secret_key_here
GEMINI_API_KEY=your_google_gemini_api_key
```

Start the backend server:
```bash
npm run dev
```
The server will start on `http://localhost:5000`.

### 3. Frontend Setup
Open a new terminal, navigate to the frontend directory, and install dependencies:
```bash
cd frontend
npm install
```

Start the development server:
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

## 🔑 Demo Credentials

For quick testing, you can use the following dummy account:

- **Email**: `maity@gmail.com`
- **Password**: `maity`

## 📝 Usage

1.  **Register/Login**: Use the demo credentials or create a new account.
2.  **Create Document**: Click on "New Document" to start.
3.  **Collaborate**: Share the document ID or URL with another user (or open in an incognito window) to see real-time updates.
4.  **Use AI**: Highlight text or use the AI toolbar options to generate content, fix grammar, or summarize text.
