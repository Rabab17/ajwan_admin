import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Routes, Route } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Users,
  ShoppingBag,
  FolderOpen,
  MessageSquare,
  TrendingUp,
  Calendar,
  DollarSign,
  Activity
} from 'lucide-react'
import ServicesManager from '../content/ServicesManager'
import ProductsManager from '../content/ProductsManager'
import ProjectsManager from '../content/ProjectsManager'
import TestimonialsManager from '../content/TestimonialsManager'
import MessagesManager from '../content/MessagesManager'
import UsersManager from '../content/UsersManager'
import ServiceItemManager from '../content/ServiceItemManager'
import { useLanguage } from '../../contexts/LanguageContext'
import { useTheme } from '../../contexts/ThemeContext'

const Dashboard = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();

  const [stats, setStats] = useState({
    totalServices: 12,
    totalProducts: 45,
    totalProjects: 23,
    totalMessages: 8,
    monthlyRevenue: 125000,
    activeUsers: 1250,
    completedProjects: 18,
    pendingTasks: 5
  })

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  }

  const statCards = [
    {
      title: t("total_services"),
      value: stats.totalServices,
      description: t("active_service"),
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      delay: 0
    },
    {
      title: t("products"),
      value: stats.totalProducts,
      description: t("available_product"),
      icon: ShoppingBag,
      color: "text-green-600",
      bgColor: "bg-green-50",
      delay: 0.1
    },
    {
      title: t("projects"),
      value: stats.totalProjects,
      description: t("completed_project"),
      icon: FolderOpen,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      delay: 0.2
    },
    {
      title: t("messages"),
      value: stats.totalMessages,
      description: t("new_message"),
      icon: MessageSquare,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      delay: 0.3
    },
    {
      title: t("monthly_revenue"),
      value: `${stats.monthlyRevenue.toLocaleString()} ${t("currency")}`,
      description: t("this_month"),
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      delay: 0.4
    },
    {
      title: t("active_users"),
      value: stats.activeUsers,
      description: t("active_user"),
      icon: Activity,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      delay: 0.5
    }
  ]

  return (
    <div className="p-6">
      <Routes>
        <Route path="/" element={<DashboardHome statCards={statCards} containerVariants={containerVariants} cardVariants={cardVariants} t={t} theme={theme} />} />
        <Route path="/services" element={<ServicesManager />} />
        <Route path="/products" element={<ProductsManager />} />
        <Route path="/projects" element={<ProjectsManager />} />
        <Route path="/testimonials" element={<TestimonialsManager />} />
        <Route path="/messages" element={<MessagesManager />} />
        <Route path="/users" element={<UsersManager />} />
        <Route path="/service-items" element={<ServiceItemManager />} />
      </Routes>
    </div>
  )
}

const DashboardHome = ({ statCards, containerVariants, cardVariants, t, theme }) => {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={cardVariants}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t("welcome_dashboard")}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t("ajwan_overview")}</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => {
          const IconComponent = card.icon
          return (
            <motion.div
              key={card.title}
              variants={cardVariants}
              custom={index}
              whileHover={{
                scale: 1.02,
                transition: { duration: 0.2 }
              }}
              className="cursor-pointer"
            >
              <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md dark:bg-gray-700 dark:text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    {card.title}
                  </CardTitle>
                  <div className={`p-2 rounded-full ${card.bgColor}`}>
                    <IconComponent className={`h-4 w-4 ${card.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {card.value}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      <motion.div variants={cardVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <Card className="shadow-md border-0 dark:bg-gray-700 dark:text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              {t("recent_activities")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: t("new_service_added"), time: t("five_minutes_ago"), type: "success" },
                { action: t("product_updated"), time: t("fifteen_minutes_ago"), type: "info" },
                { action: t("new_message_from_client"), time: t("thirty_minutes_ago"), type: "warning" },
                { action: t("project_completed"), time: t("one_hour_ago"), type: "success" }
              ].map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors dark:bg-gray-800 dark:hover:bg-gray-600"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.action}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'success' ? 'bg-green-500' :
                    activity.type === 'info' ? 'bg-blue-500' : 'bg-yellow-500'
                  }`} />
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-0 dark:bg-gray-700 dark:text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <Calendar className="h-5 w-5 text-purple-600" />
              {t("upcoming_tasks")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { task: t("review_new_project"), date: t("today"), priority: "high" },
                { task: t("update_website_content"), date: t("tomorrow"), priority: "medium" },
                { task: t("team_meeting"), date: t("wednesday"), priority: "high" },
                { task: t("prepare_monthly_report"), date: t("friday"), priority: "low" }
              ].map((task, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors dark:bg-gray-800 dark:hover:bg-gray-600"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{task.task}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{task.date}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    task.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100' :
                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' : 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                  }`}>
                    {t(task.priority)}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

export default Dashboard


