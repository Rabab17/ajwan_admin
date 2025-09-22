import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Save,
  X
} from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useTheme } from '../../contexts/ThemeContext'
import { getApiUrl } from '../../config/api'
import { PageLoader, InlineLoader, CardLoader, ButtonLoader } from '../ui/Loader';
import { SuccessAlert, ErrorAlert } from '../ui/Alert';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationContainer } from '../ui/NotificationContainer';
import Swal from 'sweetalert2'

const UsersManager = () => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const { notifications, showSuccess, showError, removeNotification } = useNotifications();

  const [users, setUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user'
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // دالة جلب المستخدمين من API
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token'); // الحصول على التوكن من Local Storage

      if (!token) {
        console.error("No authentication token found.");
        return;
      }

      const response = await fetch(getApiUrl("/users"), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // إرسال التوكن في الـ Authorization Header
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Users fetched successfully:", data);
      setUsers(data); // تحديث حالة المستخدمين بالبيانات المستلمة
    } catch (error) {
      console.error("Failed to fetch users:", error);
      showErrorAlert(t('fetch_users_error'));
    }
  };

  // استخدام useEffect لجلب المستخدمين عند تحميل المكون
  useEffect(() => {
    fetchUsers();
  }, []);

  // التحقق من صحة البريد الإلكتروني باستخدام regex
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // التحقق من صحة البيانات
  const validateForm = () => {
    const newErrors = {}

    // التحقق من اسم المستخدم
    if (!formData.username.trim()) {
      newErrors.username = t('username_required')
    }

    // التحقق من البريد الإلكتروني
    if (!formData.email.trim()) {
      newErrors.email = t('email_required')
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = t('invalid_email')
    }

    // التحقق من كلمة المرور (فقط عند إضافة مستخدم جديد)
    if (!editingUser && !formData.password.trim()) {
      newErrors.password = t('password_required')
    }

    // التحقق من الدور
    if (!formData.role) {
      newErrors.role = t('role_required')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // التحقق من تكرار البريد الإلكتروني
  const isEmailUnique = (email) => {
    // إذا كنا في وضع التعديل، نتأكد من أن البريد الإلكتروني مختلف عن البريد الأصلي للمستخدم
    if (editingUser && email === editingUser.email) {
      return true
    }
    
    // التحقق من عدم وجود البريد الإلكتروني في قاعدة البيانات
    return !users.some(user => user.email === email)
  }

  // دالة لعرض رسالة نجاح
  const showSuccessAlert = (message) => {
    Swal.fire({
      icon: 'success',
      title: message,
      timer: 2000,
      showConfirmButton: false,
      background: theme === 'dark' ? '#374151' : '#fff',
      color: theme === 'dark' ? '#fff' : '#000',
    });
  };

  // دالة لعرض رسالة خطأ
  const showErrorAlert = (message) => {
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: message,
      background: theme === 'dark' ? '#374151' : '#fff',
      color: theme === 'dark' ? '#fff' : '#000',
    });
  };

  // دالة لعرض رسالة تأكيد
  const showConfirmAlert = (message, confirmCallback) => {
    Swal.fire({
      title: t('are_you_sure'),
      text: message,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: t('yes'),
      cancelButtonText: t('cancel'),
      background: theme === 'dark' ? '#374151' : '#fff',
      color: theme === 'dark' ? '#fff' : '#000',
    }).then((result) => {
      if (result.isConfirmed) {
        confirmCallback();
      }
    });
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddUser = () => {
    setEditingUser(null)
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'user'
    })
    setErrors({})
    setShowForm(true)
  }

  const handleEditUser = (user) => {
    setEditingUser(user)
    setFormData({
      username: user.username,
      email: user.email || '',
      password: '',
      role: user.role || 'user'
    })
    setErrors({})
    setShowForm(true)
  }

  const handleSaveUser = async () => {
    setIsSubmitting(true)
    
    // التحقق من صحة البيانات
    if (!validateForm()) {
      setIsSubmitting(false)
      return
    }

    // التحقق من عدم تكرار البريد الإلكتروني
    if (!isEmailUnique(formData.email)) {
      setErrors({...errors, email: t('email_already_exists')})
      setIsSubmitting(false)
      return
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error("No authentication token found.");
        showErrorAlert(t('no_auth_token'));
        return;
      }

      // If we're editing a user
      if (editingUser) {
        const roleId = formData.role === 'admin' ? 1 : 2;
        const userData = {
          username: formData.username,
          email: formData.email,
          role: roleId,
        };

        // If a new password is provided, add it to the data
        if (formData.password) {
          userData.password = formData.password;
        }

        const response = await fetch(`${getApiUrl("/users")}/${editingUser.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(userData),
        });
        
        const result = await response.json();
        if (response.ok) {
          console.log("User updated:", result);
          setUsers(users.map(user =>
            user.id === editingUser.id ? { ...user, ...result } : user
          ));
          
          if (formData.password) {
            showSuccessAlert(t('user_updated_password_changed'));
          } else {
            showSuccessAlert(t('user_updated_successfully'));
          }
        } else {
          console.error("Failed to update user:", result);
          showErrorAlert(result.error?.message || t('update_user_failed'));
        }
      } 
      // Adding a new user
      else {
        const roleId = formData.role === 'admin' ? 1 : 2;
        const response = await fetch(getApiUrl("/users"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            username: formData.username,
            email: formData.email,
            password: formData.password,
            role: roleId,
          }),
        });

        const result = await response.json();
        if (response.ok) {
          console.log("User added successfully:", result);
          setUsers([...users, result]);
          showSuccessAlert(t('user_added_successfully'));
        } else {
          console.error("Failed to add user:", result);
          showErrorAlert(t('add_user_failed'));
        }
      }
    } catch (error) {
      console.error("API error:", error);
      showErrorAlert(t('general_error'));
    } finally {
      setIsSubmitting(false)
      setEditingUser(null);
      setFormData({
        username: '',
        email: '',
        password: '',
        role: 'user'
      });
      setErrors({})
      setShowForm(false);
      fetchUsers(); // Refresh the user list
    }
  };

  const handleDeleteUser = async (id) => {
    showConfirmAlert(t('delete_user_confirm'), async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error("No authentication token found.");
          showErrorAlert(t('no_auth_token'));
          return;
        }

        const response = await fetch(`${getApiUrl("/users")}/${id}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`
          },
        });

        if (response.ok) {
          console.log("User deleted successfully.");
          setUsers(users.filter(user => user.id !== id));
          showSuccessAlert(t('user_deleted_successfully'));
        } else {
          const result = await response.json();
          console.error("Failed to delete user:", result);
          showErrorAlert(t('delete_user_failed'));
        }
      } catch (error) {
        console.error("API error during deletion:", error);
        showErrorAlert(t('delete_user_error'));
      }
    });
  };

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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('manage_users')}</h1>
            <p className="text-gray-600 mt-1 dark:text-gray-400">{t('manage_users_desc')}</p>
          </div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleAddUser}
              className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('add_new_user')}
            </Button>
          </motion.div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="shadow-sm border-0 dark:bg-gray-800 dark:text-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="dark:text-white">{t('users_list')}</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t('search_users')}
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
                    <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t('username')}</th>
                    <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t('email')}</th>
                    <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t('role')}</th>
                    <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-center`}>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filteredUsers.map((user, index) => (
                      <motion.tr
                        key={user.id}
                        variants={tableRowVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        whileHover="hover"
                        transition={{ delay: index * 0.1 }}
                        className="border-b border-gray-100 dark:border-gray-700"
                      >
                        <td className="py-4 px-4">{user.username}</td>
                        <td className="py-4 px-4">{user.email}</td>
                        <td className="py-4 px-4">
                          <Badge variant="outline" className="bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                            {user.role?.name || "N/A"}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-center space-x-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleEditUser(user)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors dark:hover:bg-gray-700"
                            >
                              <Edit className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDeleteUser(user.id)}
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
                  {editingUser ? t('edit_user') : t('add_new_user')}
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
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <Label htmlFor="username" className="dark:text-gray-200">{t('username')}</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder={t('enter_username')}
                    className={`mt-1 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${errors.username ? 'border-red-500' : ''}`}
                  />
                  {errors.username && (
                    <p className="text-red-500 text-sm mt-1">{errors.username}</p>
                  )}
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                  <Label htmlFor="email" className="dark:text-gray-200">{t('email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder={t('enter_email')}
                    className={`mt-1 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${errors.email ? 'border-red-500' : ''}`}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                  <Label htmlFor="password" className="dark:text-gray-200">
                    {editingUser ? t('new_password') : t('password')}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingUser ? t('enter_new_password') : t('enter_password')}
                    className={`mt-1 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${errors.password ? 'border-red-500' : ''}`}
                  />
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                  )}
                  {editingUser && !errors.password && (
                    <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">
                      {t('leave_blank_to_keep_current')}
                    </p>
                  )}
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <Label htmlFor="role" className="dark:text-gray-200">{t('role')}</Label>
                  <select
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className={`mt-1 block w-full py-2 px-3 border rounded-md shadow-sm focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${errors.role ? 'border-red-500' : ''}`}
                  >
                    <option value="user">{t('user')}</option>
                    <option value="admin">{t('admin')}</option>
                  </select>
                  {errors.role && (
                    <p className="text-red-500 text-sm mt-1">{errors.role}</p>
                  )}
                </motion.div>
              </div>

              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
                <Button variant="outline" onClick={() => setShowForm(false)} className="mr-3 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">
                  {t('cancel')}
                </Button>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleSaveUser}
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSubmitting ? t('saving') : t('save_user')}
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Notification Container */}
      <NotificationContainer 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </motion.div>
  )
}

export default UsersManager