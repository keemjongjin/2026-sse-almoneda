import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './contexts/AuthContext';
import Login from './components/Login';
import AuctionDashboard from './components/AuctionDashboard';

const PrivateRoute = ({ children }) => {
  const { token, loading } = useContext(AuthContext);
  if (loading) return <div style={{ color: 'white' }}>Loading...</div>;
  return token ? children : <Navigate to="/login" />;
};

const AppContent = () => {
  const { token, loading } = useContext(AuthContext);
  
  if (loading) return <div style={{ color: 'white' }}>Loading...</div>;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!token ? <Login /> : <Navigate to="/" />} />
        <Route path="/" element={
          <PrivateRoute>
            <AuctionDashboard />
          </PrivateRoute>
        } />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
