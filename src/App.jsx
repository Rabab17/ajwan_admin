import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import LoginPage from './components/auth/LoginPage'
import Dashboard from './components/dashboard/Dashboard'
import Layout from './components/layout/Layout'
import ProductsManager from './components/content/ProductsManager'
import ServicesManager from './components/content/ServicesManager'
import UsersManager from './components/content/UsersManager'
import ServiceItemManager from './components/content/ServiceItemManager'
import MessagesManager from './components/content/MessagesManager'
import ProjectsManager from './components/content/ProjectsManager'
import TestimonialsManager from './components/content/TestimonialsManager'
import './App.css'
import { useLanguage } from './contexts/LanguageContext'
import { useTheme } from './contexts/ThemeContext'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true) // Add a loading state
  const { t } = useLanguage();
  const { theme } = useTheme();

  // Use useEffect to check for the token when the component mounts
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
    setLoading(false); // Set loading to false after the check is complete
  }, []); // The empty dependency array ensures this runs only once

  const handleLogin = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('token'); // Clear the token from localStorage
    setIsAuthenticated(false)
  }

  // Show a loading spinner while checking for the token
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <Router>
      <div className={`min-h-screen bg-gray-50 ${theme === 'dark' ? 'dark' : ''}`}>
        <Routes>
          <Route 
            path="/login" 
            element={
              !isAuthenticated ? (
                <LoginPage onLogin={handleLogin} />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            } 
          />
          <Route 
            path="/dashboard/*" 
            element={
              isAuthenticated ? (
                <Layout onLogout={handleLogout}>
                  {/* You can nest your dashboard routes here */}
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    {/* <Route path="products" element={<ProductsManager />} /> */}
                    <Route path="services" element={<ServicesManager />} />
                    <Route path="users" element={<UsersManager />} />
                    <Route path="service-items" element={<ServiceItemManager />} />
                    <Route path="messages" element={<MessagesManager />} />
                    <Route path="projects" element={<ProjectsManager />} />
                    <Route path="testimonials" element={<TestimonialsManager />} />
                  </Routes>
                </Layout>
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
          <Route 
            path="/" 
            element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} 
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App