import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Search, Star, User, Save, X, Quote } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import Swal from 'sweetalert2';

// المكون الرئيسي لإدارة التوصيات
const TestimonialsManager = () => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();

  // تعريف حالة المكون
  const [testimonials, setTestimonials] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [formData, setFormData] = useState({
    nameUser: '',
    message: '',
    rating: 5,
    CompanyName: '',
  });
  const [formErrors, setFormErrors] = useState({
    nameUser: '',
    message: '',
    CompanyName: '',
  });

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
      title: t('are_you_sure') || 'هل أنت متأكد؟',
      text: message,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: t('yes') || 'نعم',
      cancelButtonText: t('cancel') || 'إلغاء',
      background: theme === 'dark' ? '#374151' : '#fff',
      color: theme === 'dark' ? '#fff' : '#000',
      reverseButtons: language === 'ar'
    }).then((result) => {
      if (result.isConfirmed) {
        confirmCallback();
      }
    });
  };

  // دالة محسنة لجلب التوكن مع التحقق من الصلاحية
  const getValidToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      showErrorAlert(t('auth_error') || 'Authentication token missing');
      throw new Error('Authentication token missing');
    }
    return token;
  };

  // دالة محسنة للتحقق من الاستجابة
  const checkResponse = async (response) => {
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        showErrorAlert(t('auth_error') || 'Authentication failed. Please login again.');
        throw new Error('Authentication failed');
      }
      
      const errorText = await response.text();
      console.error(`Server error: ${response.status}`, errorText);
      throw new Error(`Server error: ${response.status}`);
    }
    return response;
  };

  // URL الـ API الخاص بـ Strapi
  const API_URL = 'http://localhost:1337/api/testimonial-ajwans';

  // دالة لجلب جميع التوصيات (GET)
  const fetchTestimonials = async () => {
    try {
      const TOKEN = getValidToken();
      
      const url = language === 'ar' 
        ? `${API_URL}?populate=*&locale=ar-SA`
        : `${API_URL}?populate=*`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TOKEN}`
        },
      });

      await checkResponse(response);

      const data = await response.json();
      console.log("Data from API:", data);

      // ✅ هنا بنبني الـ object مباشرة من الـ response مع تضمين documentId
      const formattedTestimonials = data.data.map(item => ({
        id: item.id,
        documentId: item.documentId || item.id, // استخدام documentId إذا كان موجوداً، وإلا استخدام id
        nameUser: item.attributes?.nameUser || item.nameUser,
        message: item.attributes?.message || item.message,
        rating: item.attributes?.Rating || item.Rating || item.rating,
        CompanyName: item.attributes?.CompanyName || item.CompanyName,
        createdAt: ((item.attributes?.createdAt || item.createdAt) || '').slice(0, 10),
        updatedAt: ((item.attributes?.updatedAt || item.updatedAt) || '').slice(0, 10)
      }));

      setTestimonials(formattedTestimonials);
    } catch (error) {
      console.error('حدث خطأ أثناء جلب التوصيات:', error);
      if (error.message === 'Authentication failed') {
        window.location.href = '/login';
      } else {
        showErrorAlert(t('load_error') || 'Failed to load testimonials');
      }
      setTestimonials([]);
    }
  };

  // استخدام useEffect لجلب التوصيات عند تحميل المكون لأول مرة
  useEffect(() => {
    fetchTestimonials();
  }, [language]);

  // تصفية التوصيات بناءً على مصطلح البحث
  const filteredTestimonials = testimonials.filter(testimonial =>
    testimonial.nameUser.toLowerCase().includes(searchTerm.toLowerCase()) ||
    testimonial.CompanyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // التحقق من صحة النموذج
  const validateForm = () => {
    const errors = {
      nameUser: '',
      message: '',
      CompanyName: '',
    };
    let isValid = true;

    if (!formData.nameUser.trim()) {
      errors.nameUser = t('name_required') || 'اسم العميل مطلوب';
      isValid = false;
    }

    if (!formData.message.trim()) {
      errors.message = t('message_required') || 'محتوى التوصية مطلوب';
      isValid = false;
    }

    if (!formData.CompanyName.trim()) {
      errors.CompanyName = t('company_required') || 'اسم الشركة مطلوب';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  // دالة لإعداد النموذج لإضافة توصية جديدة
  const handleAddTestimonial = () => {
    setEditingTestimonial(null);
    setFormData({
      nameUser: '',
      message: '',
      rating: 5,
      CompanyName: '',
    });
    setFormErrors({
      nameUser: '',
      message: '',
      CompanyName: '',
    });
    setShowForm(true);
  };

  // دالة لإعداد النموذج لتعديل توصية موجودة
  const handleEditTestimonial = (testimonial) => {
    setEditingTestimonial(testimonial);
    setFormData({
      nameUser: testimonial.nameUser,
      message: testimonial.message,
      rating: testimonial.rating,
      CompanyName: testimonial.CompanyName,
    });
    setFormErrors({
      nameUser: '',
      message: '',
      CompanyName: '',
    });
    setShowForm(true);
  };

  // دالة لحفظ التوصية (إضافة أو تحديث) (POST/PUT)
  const handleSaveTestimonial = async () => {
    if (isSaving) return;
    
    if (!validateForm()) {
      return;
    }
    
    setIsSaving(true);
    
    try {
      const TOKEN = getValidToken();

      // هنا يتم بناء جسم الطلب (body)
      // لاحظ: يجب أن تكون البيانات مغلفة داخل مفتاح 'data' لتتوافق مع Strapi v4
      const requestBody = {
        data: {
          nameUser: formData.nameUser,
          message: formData.message,
          Rating: formData.rating,
          CompanyName: formData.CompanyName,
        },
      };

      let apiEndpoint = API_URL;
      let method = 'POST';
      
      if (editingTestimonial) {
        if (editingTestimonial.documentId) {
          apiEndpoint = `${API_URL}/${editingTestimonial.documentId}`;
          method = 'PUT';
        } else {
          apiEndpoint = `${API_URL}/${editingTestimonial.id}`;
          method = 'PUT';
        }
      }

      const response = await fetch(apiEndpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TOKEN}`,
        },
        body: JSON.stringify(requestBody),
      });

      await checkResponse(response);
      const result = await response.json();
      
      await fetchTestimonials(); // إعادة جلب التوصيات لتحديث الواجهة
      
      setShowForm(false);
      setEditingTestimonial(null);
      showSuccessAlert(editingTestimonial ? 
        (t('update') + ' ' + t('success')) : 
        (t('save') + ' ' + t('success')));

    } catch (error) {
      console.error('حدث خطأ أثناء حفظ التوصية:', error);
      showErrorAlert(t('error') || 'Error while saving');
    } finally {
      setIsSaving(false);
    }
  };

  // دالة لحذف توصية باستخدام SweetAlert
  const handleDeleteTestimonial = async (testimonial) => {
    showConfirmAlert(
      t('delete_testimonial_confirm') || 'هل أنت متأكد من رغبتك في حذف هذه التوصية؟',
      async () => {
        try {
          const TOKEN = getValidToken();
          setDeletingId(testimonial.id || testimonial.documentId);
          
          const id = testimonial.documentId || testimonial.id;
          const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${TOKEN}`,
            },
          });

          await checkResponse(response);

          // تحديث الحالة بحذف التوصية من القائمة
          setTestimonials(testimonials.filter(t => 
            (t.documentId !== testimonial.documentId && t.id !== testimonial.id) ||
            (t.documentId === undefined && t.id === undefined)
          ));
          
          showSuccessAlert(t('testimonial_deleted') || 'تم حذف التوصية بنجاح');
        } catch (error) {
          console.error('حدث خطأ أثناء حذف التوصية:', error);
          showErrorAlert(t('delete_failed') || 'فشل في حذف التوصية');
        } finally {
          setDeletingId(null);
        }
      }
    );
  };

  // دالة لعرض النجوم حسب التقييم
  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  // متغيرات الرسوم المتحركة
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

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
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6" >
      <Toaster />
      <motion.div variants={itemVariants}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('manage_testimonials') || 'إدارة التوصيات'}</h1>
            <p className="text-gray-600 mt-1 dark:text-gray-400">{t('manage_testimonials_desc') || 'إدارة آراء وتوصيات العملاء'}</p>
          </div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} >
            <Button onClick={handleAddTestimonial} className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800" >
              <Plus className="w-4 h-4 mr-2" /> {t('add_new_testimonial') || 'إضافة توصية جديدة'}
            </Button>
          </motion.div>
        </div>
      </motion.div>
      <motion.div variants={itemVariants}>
        <Card className="shadow-sm border-0 dark:bg-gray-800 dark:text-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="dark:text-white">{t('testimonials_list') || 'قائمة التوصيات'}</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t('search_testimonials') || 'البحث في التوصيات...'}
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
                    <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t('customer') || 'العميل'}</th>
                    <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t('content') || 'المحتوى'}</th>
                    <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t('rating') || 'التقييم'}</th>
                    <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t('company') || 'الشركة'}</th>
                    <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${language === 'ar' ? 'text-center' : 'text-center'}`}>{t('actions') || 'الإجراءات'}</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filteredTestimonials.map((testimonial, index) => {
                      return (
                        <motion.tr
                          key={testimonial.id}
                          variants={tableRowVariants}
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                          whileHover="hover"
                          transition={{ delay: index * 0.1 }}
                          className="border-b border-gray-100 dark:border-gray-700"
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3 dark:bg-blue-900">
                                <User className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">{testimonial.nameUser}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">{testimonial.CompanyName}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="max-w-xs">
                              <div className="flex items-start">
                                <Quote className="w-4 h-4 text-gray-400 mr-2 mt-1 flex-shrink-0 dark:text-gray-500" />
                                <p className="text-sm text-gray-700 line-clamp-3 dark:text-gray-300">
                                  {testimonial.message}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center">
                              {renderStars(testimonial.rating)}
                              <span className="mr-2 text-sm text-gray-600 dark:text-gray-400"> ({testimonial.rating}/5) </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <Badge className="bg-gray-100 text-gray-800 border-0 dark:bg-gray-700 dark:text-gray-200">{testimonial.CompanyName}</Badge>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-center space-x-2">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleEditTestimonial(testimonial)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors dark:hover:bg-gray-700"
                              >
                                <Edit className="w-4 h-4" />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleDeleteTestimonial(testimonial)}
                                disabled={deletingId === (testimonial.id || testimonial.documentId)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-gray-700 disabled:opacity-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
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
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:text-white"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {editingTestimonial ? (t('edit_testimonial') || 'تعديل التوصية') : (t('add_new_testimonial') || 'إضافة توصية جديدة')}
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
              <div className="p-6 space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Label htmlFor="nameUser" className="dark:text-gray-200">{t('customer_name') || 'اسم العميل'} *</Label>
                  <Input
                    id="nameUser"
                    value={formData.nameUser}
                    onChange={(e) => setFormData({...formData, nameUser: e.target.value})}
                    placeholder={t('enter_customer_name') || 'أدخل اسم العميل'}
                    className="mt-1 transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    required
                  />
                  {formErrors.nameUser && <p className="text-red-500 text-sm mt-1">{formErrors.nameUser}</p>}
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Label htmlFor="CompanyName" className="dark:text-gray-200">{t('company_name') || 'اسم الشركة'} *</Label>
                  <Input
                    id="CompanyName"
                    value={formData.CompanyName}
                    onChange={(e) => setFormData({...formData, CompanyName: e.target.value})}
                    placeholder={t('enter_company_name') || 'أدخل اسم الشركة'}
                    className="mt-1 transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    required
                  />
                  {formErrors.CompanyName && <p className="text-red-500 text-sm mt-1">{formErrors.CompanyName}</p>}
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Label htmlFor="message" className="dark:text-gray-200">{t('testimonial_content') || 'محتوى التوصية'} *</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    placeholder={t('enter_testimonial_content') || 'أدخل نص التوصية'}
                    rows={4}
                    className="mt-1 transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    required
                  />
                  {formErrors.message && <p className="text-red-500 text-sm mt-1">{formErrors.message}</p>}
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Label htmlFor="rating" className="dark:text-gray-200">{t('rating') || 'التقييم'}</Label>
                  <select
                    id="rating"
                    value={formData.rating}
                    onChange={(e) => setFormData({...formData, rating: parseInt(e.target.value)})}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  >
                    <option value={5}>5 {t('stars') || 'نجوم'}</option>
                    <option value={4}>4 {t('stars') || 'نجوم'}</option>
                    <option value={3}>3 {t('stars') || 'نجوم'}</option>
                    <option value={2}>2 {t('stars') || 'نجوم'}</option>
                    <option value={1}>1 {t('star') || 'نجمة'}</option>
                  </select>
                </motion.div>
              </div>
              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
                <Button 
                  variant="outline" 
                  onClick={() => setShowForm(false)} 
                  className="mr-3 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  {t('cancel') || 'إلغاء'}
                </Button>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} >
                  <Button
                    onClick={handleSaveTestimonial}
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? (t('loading') || 'جاري الحفظ...') : (editingTestimonial ? (t('update') || 'تحديث') : (t('save') || 'حفظ'))}
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TestimonialsManager;