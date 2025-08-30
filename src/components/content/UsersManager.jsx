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

const UsersManager = () => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();

  const [users, setUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    currentPassword: '',
    role: 'user'
  })

  // دالة جلب المستخدمين من API
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token'); // الحصول على التوكن من Local Storage

      if (!token) {
        console.error("No authentication token found.");
        return;
      }

      const response = await fetch("http://localhost:1337/api/users", {
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
    }
  };

  // استخدام useEffect لجلب المستخدمين عند تحميل المكون
  useEffect(() => {
    fetchUsers();
  }, []);

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
      currentPassword: '',
      role: 'user'
    })
    setShowForm(true)
  }

  const handleEditUser = (user) => {
    setEditingUser(user)
    setFormData({
      username: user.username,
      email: user.email || '',
      password: '',
      currentPassword: '',
      role: user.role || 'user'
    })
    setShowForm(true)
  }

  const handleSaveUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error("No authentication token found.");
        return;
      }

      // If we're editing a user and a new password is provided
      if (editingUser && formData.password) {
        // First, update the user's basic info (username, email, role)
        const roleId = formData.role === 'admin' ? 1 : 2;
        const userResponse = await fetch(`http://localhost:1337/api/users/${editingUser.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            username: formData.username,
            email: formData.email,
            role: roleId,
          }),
        });
        
        if (!userResponse.ok) {
          const result = await userResponse.json();
          console.error("Failed to update user:", result);
          alert("Failed to update user.");
          return;
        }
        
        // Then, change the password using the separate endpoint
        const passwordResponse = await fetch("http://localhost:1337/api/auth/change-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            currentPassword: formData.currentPassword,
            password: formData.password,
            passwordConfirmation: formData.password,
          }),
        });

        const passwordResult = await passwordResponse.json();
        if (passwordResponse.ok) {
          console.log("Password changed successfully:", passwordResult);
          alert("User updated and password changed successfully!");
        } else {
          console.error("Failed to change password:", passwordResult);
          alert(passwordResult.error?.message || "User info updated but failed to change password.");
        }
      } 
      // If we're editing a user but no new password is provided
      else if (editingUser) {
        const roleId = formData.role === 'admin' ? 1 : 2;
        const response = await fetch(`http://localhost:1337/api/users/${editingUser.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            username: formData.username,
            email: formData.email,
            role: roleId,
          }),
        });
        
        const result = await response.json();
        if (response.ok) {
          console.log("User updated:", result);
          setUsers(users.map(user =>
            user.id === editingUser.id ? { ...user, ...result } : user
          ));
          alert("User updated successfully!");
        } else {
          console.error("Failed to update user:", result);
          alert("Failed to update user.");
        }
      } 
      // Adding a new user
      else {
        const roleId = formData.role === 'admin' ? 1 : 2;
        const response = await fetch("http://localhost:1337/api/users", {
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
          alert("User added successfully!");
        } else {
          console.error("Failed to add user:", result);
          alert("Failed to add user. Please check the console for details.");
        }
      }
    } catch (error) {
      console.error("API error:", error);
      alert("An error occurred. Please try again later.");
    } finally {
      setEditingUser(null);
      setFormData({
        username: '',
        email: '',
        password: '',
        currentPassword: '',
        role: 'user'
      });
      setShowForm(false);
      fetchUsers(); // Refresh the user list
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error("No authentication token found.");
        return;
      }

      const response = await fetch(`http://localhost:1337/api/users/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        },
      });

      if (response.ok) {
        console.log("User deleted successfully.");
        setUsers(users.filter(user => user.id !== id));
        alert("User deleted successfully!");
      } else {
        const result = await response.json();
        console.error("Failed to delete user:", result);
        alert("Failed to delete user. Please check the console.");
      }
    } catch (error) {
      console.error("API error during deletion:", error);
      alert("An error occurred while deleting the user.");
    }
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
                    className="mt-1 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                  <Label htmlFor="email" className="dark:text-gray-200">{t('email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder={t('enter_email')}
                    className="mt-1 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                </motion.div>

                {editingUser && (
                  <>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                      <Label htmlFor="currentPassword" className="dark:text-gray-200">{t('current_password')}</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={formData.currentPassword}
                        onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                        placeholder={t('enter_current_password')}
                        className="mt-1 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      />
                      <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">
                        {t('current_password_required_for_changes')}
                      </p>
                    </motion.div>
                  </>
                )}

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
                    className="mt-1 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                  {editingUser && (
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
                    className="mt-1 block w-full py-2 px-3 border rounded-md shadow-sm focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  >
                    <option value="user">{t('user')}</option>
                    <option value="admin">{t('admin')}</option>
                  </select>
                </motion.div>
              </div>

              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
                <Button variant="outline" onClick={() => setShowForm(false)} className="mr-3 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">
                  {t('cancel')}
                </Button>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleSaveUser}
                    className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {t('save_user')}
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

export default UsersManager