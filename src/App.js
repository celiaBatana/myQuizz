import React from 'react';
import { GroupsList, GroupDetail } from './pages/Groups';
import Review from './pages/Review';
import Collection from './pages/Collection';
import Progress from './pages/Progress';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Calendar from './pages/Calendar';
import Themes from './pages/Themes';
import Quizzes from './pages/Quizzes';
import QuizPlay from './pages/QuizPlay';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Jouer from './pages/Jouer';
import Play from './pages/Play';
import Daily from './pages/Daily';
import Amis from './pages/Amis';
import Rush from './pages/Rush';
import Boutique from './pages/Boutique';
import Raid from './pages/Raid';
import BossHub, { BossFight } from './pages/Boss';
import BlindHub, { BlindPlay, BlindBoard } from './pages/BlindTest';
import Duel from './pages/Duel';
import Leaderboard from './pages/Leaderboard';
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
            <Route path="/jouer" element={<Jouer />} />
            <Route path="/play" element={<Play />} />
            <Route path="/daily" element={<Daily />} />
            <Route path="/blindtest" element={<BlindHub />} />
            <Route path="/blindtest/classement" element={<BlindBoard />} />
            <Route path="/blindtest/:cat" element={<BlindPlay />} />
            <Route path="/raid" element={<Raid />} />
            <Route path="/rush" element={<Rush />} />
            <Route path="/boutique" element={<Boutique />} />
            <Route path="/boss" element={<BossHub />} />
            <Route path="/boss/:id" element={<BossFight />} />
            <Route path="/amis" element={<Amis />} />
            <Route path="/duel/:id" element={<Duel />} />
            <Route path="/groupes" element={<GroupsList />} />
            <Route path="/groupes/:code" element={<GroupDetail />} />
            <Route path="/collection" element={<Collection />} />
            <Route path="/progression" element={<Progress />} />
            <Route path="/revision" element={<Review />} />
            <Route path="/classement" element={<Leaderboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
