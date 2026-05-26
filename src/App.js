import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Themes from './pages/Themes';
import Quizzes from './pages/Quizzes';
import QuizPlay from './pages/QuizPlay';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import './styles/globals.css';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/category/:catId" element={<Themes />} />
            <Route path="/category/:catId/theme/:themeId" element={<Quizzes />} />
            <Route path="/quiz/:catId/:themeId/:quizId" element={<QuizPlay />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
