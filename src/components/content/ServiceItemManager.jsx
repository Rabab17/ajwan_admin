import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Upload,
  Save,
  X,
  ImageIcon,
  Check
} from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useTheme } from '../../contexts/ThemeContext'

const ServiceItemManager = () => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();

  const [serviceItems, setServiceItems] = useState([
    {
      id: 1,
      title: t('service_item_title_1'),
      description: t('service_item_description_1'),
      imgItems: null,
      service_ajwain: 'Service 1',
      createdAt: '2024-01-15'
    },
    {
      id: 2,
      title: t('service_item_title_2'),
      description: t('service_item_description_2'),
      imgItems: null,
      service_ajwain: 'Service 2',
      createdAt: '2024-01-10'
    }
  ])

  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingServiceItem, setEditingServiceItem] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imgItems: null,
    service_ajwain: ''
  })
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  const filteredServiceItems = serviceItems.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.service_ajwain.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddServiceItem = () => {
    setEditingServiceItem(null)
    setFormData({
      title: '',
      description: '',
      imgItems: null,
      service_ajwain: ''
    })
    setShowForm(true)
  }

  const handleEditServiceItem = (item) => {
    setEditingServiceItem(item)
    setFormData({
      title: item.title,
      description: item.description,
      imgItems: item.imgItems,
      service_ajwain: item.service_ajwain
    })
    setShowForm(true)
  }

  const handleSaveServiceItem = () => {
    if (editingServiceItem) {
      setServiceItems(serviceItems.map(item =>
        item.id === editingServiceItem.id
          ? { ...item, ...formData }
          : item
      ))
    } else {
      const newItem = {
        id: Date.now(),
        ...formData,
        createdAt: new Date().toISOString().split('T')[0]
      }
      setServiceItems([newItem, ...serviceItems])
    }
    setShowForm(false)
    setEditingServiceItem(null)
  }

  const handleDeleteServiceItem = (id) => {
    setServiceItems(serviceItems.filter(item => item.id !== id))
  }

  const handleImageUpload = () => {
    setIsUploading(true)
    setUploadProgress(0)
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsUploading(false)
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

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

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' }
    }
  }

  const tableRowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 }
    },
    hover: {
      backgroundColor: theme === 'dark' ? '#374151' : '#f9fafb',
      transition: { duration: 0.2 }
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('manage_service_items')}</h1>
            <p className="text-gray-600 mt-1 dark:text-gray-400">{t('manage_service_items_desc')}</p>
          </div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={handleAddServiceItem}
              className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('add_new_service_item')}
            </Button>
          </motion.div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="shadow-sm border-0 dark:bg-gray-800 dark:text-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="dark:text-white">{t('service_items_list')}</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t('search_service_items')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t('title')}</th>
                    <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t('service_ajwain')}</th>
                    <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t('created_at')}</th>
                    <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${language === 'ar' ? 'text-center' : 'text-center'}`}>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filteredServiceItems.map((item, index) => (
                      <motion.tr
                        key={item.id}
                        variants={tableRowVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        whileHover="hover"
                        transition={{ delay: index * 0.1 }}
                        className="border-b border-gray-100 dark:border-gray-700"
                      >
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{item.title}</div>
                            <div className="text-sm text-gray-500 mt-1 max-w-xs truncate dark:text-gray-400">
                              {item.description}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant="outline" className="bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                            {item.service_ajwain}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-gray-500 dark:text-gray-400">
                          {item.createdAt}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-center space-x-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleEditServiceItem(item)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors dark:hover:bg-gray-700"
                            >
                              <Edit className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDeleteServiceItem(item.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-gray-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:text-white"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {editingServiceItem ? t('edit_service_item') : t('add_new_service_item')}
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowForm(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors dark:hover:bg-gray-700"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              <div className="p-6 space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Label htmlFor="title" className="dark:text-gray-200">{t('title')}</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder={t('enter_service_item_title')}
                    className="mt-1 transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Label htmlFor="description" className="dark:text-gray-200">{t('description')}</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={t('enter_service_item_description')}
                    rows={4}
                    className="mt-1 transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Label htmlFor="imgItems" className="dark:text-gray-200">{t('image_items')}</Label>
                  <div className="mt-1 flex items-center space-x-2">
                    <Input
                      id="imgItems"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFormData({ ...formData, imgItems: e.target.files[0] })}
                      className="flex-grow transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                    {formData.imgItems && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">{formData.imgItems.name}</span>
                    )}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Label htmlFor="service_ajwain" className="dark:text-gray-200">{t('service_ajwain')}</Label>
                  <Input
                    id="service_ajwain"
                    value={formData.service_ajwain}
                    onChange={(e) => setFormData({ ...formData, service_ajwain: e.target.value })}
                    placeholder={t('enter_related_service')}
                    className="mt-1 transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                </motion.div>
              </div>

              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="mr-3 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  {t('cancel')}
                </Button>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={handleSaveServiceItem}
                    className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {t('save_service_item')}
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default ServiceItemManager


