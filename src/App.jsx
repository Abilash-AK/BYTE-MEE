import { Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Workspace from './pages/Workspace';
import Pods from './pages/Pods';
import Profile from './pages/Profile';
import Register from './pages/Register';
import { useAuth } from './context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/auth" replace />;
};

function App() {
  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/register" element={<Register />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/workspace" element={<PrivateRoute><Workspace /></PrivateRoute>} />
        <Route path="/pods" element={<PrivateRoute><Pods /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
      </Routes>
    </div>
  );
}

export default App;
