import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Menu,
  X,
  Home,
  Users,
  ShoppingBag,
  FolderOpen,
  MessageSquare,
  Star,
  LogOut,
  Settings,
  Bell,
  Sun,
  Moon
} from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useTheme } from '../../contexts/ThemeContext'

const Layout = ({ children, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { t, toggleLanguage, language } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const menuItems = [
    // {
    //   name: t("dashboard"),
    //   path: '/dashboard',
    //   icon: Home,
    //   description: t("dashboard_overview")
    // },
    {
      name: t("services"),
      path: '/dashboard',
      icon: Users,
      description: t("manage_services")
    },
    {
      name: t("service_items"),
      path: '/dashboard/service-items',
      icon: FolderOpen,
      description: t("manage_service_items")
    },
    // {
    //   name: t("products"),
    //   path: '/dashboard/products',
    //   icon: ShoppingBag,
    //   description: t("manage_products")
    // },
    {
      name: t("users"),
      path: '/dashboard/users',
      icon: Users,
      description: t("manage_users")
    },
    {
      name: t("projects"),
      path: '/dashboard/projects',
      icon: FolderOpen,
      description: t("manage_projects")
    },
    {
      name: t("testimonials"),
      path: '/dashboard/testimonials',
      icon: Star,
      description: t("manage_testimonials")
    },
    {
      name: t("messages"),
      path: '/dashboard/messages',
      icon: MessageSquare,
      description: t("customer_messages")
    }
  ]

  const sidebarVariants = {
    open: {
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    closed: {
      x: language === 'ar' ? "100%" : "-100%",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  }

  const overlayVariants = {
    open: {
      opacity: 1,
      transition: { duration: 0.3 }
    },
    closed: {
      opacity: 0,
      transition: { duration: 0.3 }
    }
  }

  const menuItemVariants = {
    hover: {
      scale: 1.02,
      backgroundColor: theme === 'dark' ? "#374151" : "#f3f4f6",
      transition: { duration: 0.2 }
    },
    tap: {
      scale: 0.98
    }
  }

  const activeItemVariants = {
    active: {
      backgroundColor: theme === 'dark' ? "#1f2937" : "#dbeafe",
      borderRight: language === 'ar' ? "none" : "4px solid #3b82f6",
      borderLeft: language === 'ar' ? "4px solid #3b82f6" : "none",
      transition: { duration: 0.2 }
    }
  }

  const handleNavigation = (path) => {
    navigate(path)
    setSidebarOpen(false)
  }

  const isActivePath = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className={`flex h-screen ${theme === 'dark' ? 'dark' : ''}`}>
      {/* Desktop Sidebar */}
      <div className={`hidden lg:flex lg:flex-shrink-0 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
        <div className="flex flex-col w-72">
          <div className="flex flex-col flex-grow bg-white border-r border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700">
            {/* Logo */}
            <div className="flex items-center justify-center h-16 px-4 bg-blue-600">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="flex items-center"
              >
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mr-3">
                  <span className="text-blue-600 font-bold text-lg">A</span>
                </div>
                <span className="text-white text-xl font-bold">Ajwan Admin</span>
              </motion.div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2">
              {menuItems.map((item, index) => {
                const IconComponent = item.icon
                const isActive = isActivePath(item.path)
                
                return (
                  <motion.div
                    key={item.name}
                    variants={menuItemVariants}
                    whileHover="hover"
                    whileTap="tap"
                    // animate={isActive ? "active" : ""}
                    initial={{ opacity: 0, x: language === 'ar' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <button
                      onClick={() => handleNavigation(item.path)}
                      className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${language === 'ar' ? 'flex-row-reverse' : ''} ${
                        isActive 
                          ? `text-blue-700 bg-blue-50 ${language === 'ar' ? 'border-l-4 border-blue-600' : 'border-r-4 border-blue-600'} dark:bg-gray-700 dark:text-blue-300` 
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700'
                      }`}
                    >
                      <IconComponent className={`${language === 'ar' ? 'ml-3' : 'mr-3'} h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                      <div className={`${language === 'ar' ? 'text-left' : 'text-right'}`}>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5 dark:text-gray-400">{item.description}</div>
                      </div>
                    </button>
                  </motion.div>
                )
              })}
            </nav>

            {/* User Section */}
            <div className="flex-shrink-0 px-4 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-medium text-sm">A</span>
                  </div>
                  <div className={`${language === 'ar' ? 'ml-3' : 'mr-3'}`}>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{t("admin")}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">admin@ajwan.com</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onLogout}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-gray-700"
                >
                  <LogOut className="h-4 w-4" />
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              variants={overlayVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              variants={sidebarVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className={`fixed inset-y-0 ${language === 'ar' ? 'right-0' : 'left-0'} z-50 w-72 bg-white shadow-xl lg:hidden dark:bg-gray-800`}
            >
              <div className="flex flex-col h-full">
                {/* Mobile Header */}
                <div className="flex items-center justify-between h-16 px-4 bg-blue-600">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mr-3">
                      <span className="text-blue-600 font-bold text-lg">A</span>
                    </div>
                    <span className="text-white text-xl font-bold">Ajwan Admin</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 text-white hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </motion.button>
                </div>

                {/* Mobile Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-2">
                  {menuItems.map((item, index) => {
                    const IconComponent = item.icon
                    const isActive = isActivePath(item.path)
                    
                    return (
                      <motion.button
                        key={item.name}
                        onClick={() => handleNavigation(item.path)}
                        className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${language === 'ar' ? 'flex-row-reverse' : ''} ${
                          isActive 
                            ? `text-blue-700 bg-blue-50 ${language === 'ar' ? 'border-l-4 border-blue-600' : 'border-r-4 border-blue-600'} dark:bg-gray-700 dark:text-blue-300` 
                            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700'
                        }`}
                        variants={menuItemVariants}
                        whileHover="hover"
                        whileTap="tap"
                        initial={{ opacity: 0, x: language === 'ar' ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <IconComponent className={`${language === 'ar' ? 'ml-3' : 'mr-3'} h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                        <div className={`${language === 'ar' ? 'text-left' : 'text-right'}`}>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5 dark:text-gray-400">{item.description}</div>
                        </div>
                      </motion.button>
                    )
                  })}
                </nav>

                {/* Mobile User Section */}
                <div className="flex-shrink-0 px-4 py-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-sm">A</span>
                      </div>
                      <div className={`${language === 'ar' ? 'ml-3' : 'mr-3'}`}>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{t("admin")}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">admin@ajwan.com</p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={onLogout}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-gray-700"
                    >
                      <LogOut className="h-4 w-4" />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={`flex flex-col flex-1 overflow-hidden ${language === 'ar' ? 'text-right' : ''}`}>
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSidebarOpen(true)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 lg:hidden dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
              >
                <Menu className="h-5 w-5" />
              </motion.button>
              <h1 className={`${language === 'ar' ? 'ml-4' : 'mr-4'} text-xl font-semibold text-gray-900 lg:mr-0 dark:text-white`}>
                {menuItems.find(item => isActivePath(item.path))?.name || t("dashboard")}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleLanguage}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
              >
                {language === 'en' ? 'AR' : 'EN'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleTheme}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
              >
                {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 relative dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
              >
                <Settings className="h-5 w-5" />
              </motion.button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}

export default Layout


