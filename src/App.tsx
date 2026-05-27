import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { useQuestions } from './hooks/useQuestions';
import { BrowsePage } from './pages/BrowsePage';
import { DashboardPage } from './pages/DashboardPage';
import { ExamPage } from './pages/ExamPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { PracticePage } from './pages/PracticePage';
import { SettingsPage } from './pages/SettingsPage';
import { StatsPage } from './pages/StatsPage';
import { WrongBookPage } from './pages/WrongBookPage';

export default function App() {
  const questionState = useQuestions();
  const basename = import.meta.env.BASE_URL === '/' ? undefined : import.meta.env.BASE_URL.replace(/\/$/, '');

  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route element={<AppLayout questionState={questionState} />}>
          <Route index element={<DashboardPage />} />
          <Route path="browse" element={<BrowsePage />} />
          <Route path="practice" element={<PracticePage />} />
          <Route path="wrong" element={<WrongBookPage />} />
          <Route path="favorites" element={<FavoritesPage />} />
          <Route path="exam" element={<ExamPage />} />
          <Route path="stats" element={<StatsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
