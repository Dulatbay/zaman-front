import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'
import MainPage from './pages/MainPage'
import ChatPage from './pages/ChatPage'
import VoiceChatPage from './pages/VoiceChatPage'

// Компонент для защищенных маршрутов
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />
}

// Компонент навигации
const Navigation = () => {
  const { userId, logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  return (
    <nav className="bg-white border-b border-light shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl sm:text-2xl font-bold text-primary">
              ZAMAN Finance
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className="text-dark hover:text-primary transition-colors duration-200 font-medium"
            >
              Dashboard
            </Link>
            <Link 
              to="/chat" 
              className="text-dark hover:text-primary transition-colors duration-200 font-medium"
            >
              AI Chat
            </Link>
            <Link 
              to="/voice-chat" 
              className="text-dark hover:text-primary transition-colors duration-200 font-medium"
            >
              Voice Chat
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray">User: {userId}</span>
              <button
                onClick={logout}
                className="text-gray hover:text-primary transition-colors duration-200 font-medium"
              >
                Выйти
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <span className="text-sm text-gray">User: {userId}</span>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray hover:text-primary hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-light">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link 
                to="/" 
                className="block px-3 py-2 text-dark hover:text-primary transition-colors duration-200 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link 
                to="/chat" 
                className="block px-3 py-2 text-dark hover:text-primary transition-colors duration-200 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                AI Chat
              </Link>
              <Link 
                to="/voice-chat" 
                className="block px-3 py-2 text-dark hover:text-primary transition-colors duration-200 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Voice Chat
              </Link>
              <button
                onClick={() => {
                  logout()
                  setIsMobileMenuOpen(false)
                }}
                className="block w-full text-left px-3 py-2 text-gray hover:text-primary transition-colors duration-200 font-medium"
              >
                Выйти
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <div className="min-h-screen bg-white">
                <Navigation />
                <Routes>
                  <Route path="/" element={<MainPage />} />
                  <Route path="/chat" element={<ChatPage />} />
                  <Route path="/voice-chat" element={<VoiceChatPage />} />
                </Routes>
              </div>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  ) 
}

export default App
