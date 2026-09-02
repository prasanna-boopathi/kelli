import { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ChatPage from './pages/ChatPage';
import Profile from './pages/Profile';
import Appointments from './pages/Appointments';
import './App.css';

function MainApp() {
  const { isAuthenticated, loading } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' | 'signup'
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'chat' | 'appointments' | 'profile'
  const [chatInitialPrompt, setChatInitialPrompt] = useState('');

  const handleStartChatWithPrompt = (prompt) => {
    setChatInitialPrompt(prompt);
    setActiveTab('chat');
  };

  // If not authenticated, render Login or Signup
  if (!loading && !isAuthenticated) {
    if (authView === 'signup') {
      return <Signup onSwitchToLogin={() => setAuthView('login')} />;
    }
    return <Login onSwitchToSignup={() => setAuthView('signup')} />;
  }

  return (
    <ProtectedRoute>
      <div className="kelli-app-shell">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <div className="kelli-app-body">
          {activeTab === 'dashboard' && (
            <Dashboard 
              onNavigate={setActiveTab} 
              onStartChatWithPrompt={handleStartChatWithPrompt} 
            />
          )}

          {activeTab === 'chat' && (
            <ChatPage 
              initialPrompt={chatInitialPrompt}
              onClearInitialPrompt={() => setChatInitialPrompt('')}
            />
          )}

          {activeTab === 'appointments' && (
            <Appointments 
              onNavigate={setActiveTab}
              onStartChatWithPrompt={handleStartChatWithPrompt}
            />
          )}

          {activeTab === 'profile' && (
            <Profile />
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
