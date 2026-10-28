import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { TabBar } from './components/TabBar';
import { ToastProvider } from './components/Toast';
import { DealsPage } from './pages/DealsPage';
import { ListPage } from './pages/ListPage';
import { MealEditPage } from './pages/MealEditPage';
import { MealsPage } from './pages/MealsPage';
import { MorePage } from './pages/MorePage';
import { PlanPage } from './pages/PlanPage';

export function App() {
  return (
    <HashRouter>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/lista" replace />} />
          <Route path="/plan" element={<PlanPage />} />
          <Route path="/lista" element={<ListPage />} />
          <Route path="/akcije" element={<DealsPage />} />
          <Route path="/jela" element={<MealsPage />} />
          <Route path="/jela/:id" element={<MealEditPage />} />
          <Route path="/vise" element={<MorePage />} />
          <Route path="*" element={<Navigate to="/lista" replace />} />
        </Routes>
        <TabBar />
      </ToastProvider>
    </HashRouter>
  );
}
