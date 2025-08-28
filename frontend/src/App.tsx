import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/auth/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { WorkOrdersPage } from './pages/WorkOrdersPage';
import { PieceMarksPage } from './pages/PieceMarksPage';
import { FieldDashboard } from './pages/FieldDashboard';
import { PieceMarkCardDemo } from './pages/PieceMarkCardDemo';
import { QualityControlDemo } from './pages/demo/QualityControlDemo';
import { ProductionWorkflowDemo } from './pages/demo/ProductionWorkflowDemo';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
          
          <Route path="/projects" element={
            <ProtectedRoute>
              <ProjectsPage />
            </ProtectedRoute>
          } />
          
          <Route path="/work-orders" element={
            <ProtectedRoute allowedRoles={['admin', 'project_manager', 'shop', 'field']}>
              <WorkOrdersPage />
            </ProtectedRoute>
          } />
          
          <Route path="/projects/:projectId/piece-marks" element={
            <ProtectedRoute>
              <PieceMarksPage />
            </ProtectedRoute>
          } />
          
          <Route path="/projects/:projectId/field" element={
            <ProtectedRoute allowedRoles={['admin', 'project_manager', 'field']}>
              <FieldDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/demo/piece-mark-card" element={
            <ProtectedRoute>
              <PieceMarkCardDemo />
            </ProtectedRoute>
          } />
          
          <Route path="/demo/quality-control" element={
            <ProtectedRoute allowedRoles={['admin', 'project_manager', 'shop']}>
              <QualityControlDemo />
            </ProtectedRoute>
          } />
          
          <Route path="/demo/production-workflow" element={
            <ProtectedRoute allowedRoles={['admin', 'project_manager', 'shop']}>
              <ProductionWorkflowDemo />
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;