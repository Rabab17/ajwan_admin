import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Search, Star, User, Save, X, Quote } from 'lucide-react';

// المكون الرئيسي لإدارة التوصيات
const TestimonialsManager = () => {
  // تعريف حالة المكون
  const [testimonials, setTestimonials] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [formData, setFormData] = useState({
    nameUser: '',
    message: '',
    rating: 5,
    CompanyName: '',
  });

  // URL الـ API الخاص بـ Strapi
  const API_URL = 'http://localhost:1337/api/testimonial-ajwans';

  // دالة لجلب جميع التوصيات (GET)
  const fetchTestimonials = async () => {
    try {
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('فشل في جلب التوصيات.');
      }

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
        createdAt: item.attributes?.createdAt || item.createdAt,
        updatedAt: item.attributes?.updatedAt || item.updatedAt,
      }));

      setTestimonials(formattedTestimonials);
    } catch (error) {
      console.error('حدث خطأ أثناء جلب التوصيات:', error);
    }
  };

  // استخدام useEffect لجلب التوصيات عند تحميل المكون لأول مرة
  useEffect(() => {
    fetchTestimonials();
  }, []);

  // تصفية التوصيات بناءً على مصطلح البحث
  const filteredTestimonials = testimonials.filter(testimonial =>
    testimonial.nameUser.toLowerCase().includes(searchTerm.toLowerCase()) ||
    testimonial.CompanyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // دالة لإعداد النموذج لإضافة توصية جديدة
  const handleAddTestimonial = () => {
    setEditingTestimonial(null);
    setFormData({
      nameUser: '',
      message: '',
      rating: 5,
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
    setShowForm(true);
  };

  // دالة لحفظ التوصية (إضافة أو تحديث) (POST/PUT)
  const handleSaveTestimonial = async () => {
    // يجب أن يكون التوكن موجودًا لتنفيذ الإجراء
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Token not found. Cannot perform action.');
      return;
    }

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

    try {
      if (editingTestimonial) {
        // تحديث توصية موجودة باستخدام documentId
        const response = await fetch(`${API_URL}/${editingTestimonial.documentId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error('فشل في تحديث التوصية.');
        }
        console.log('Testimonial updated:', await response.json());
      } else {
        // إضافة توصية جديدة
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error('فشل في إضافة التوصية.');
        }
        console.log('Testimonial added:', await response.json());
      }

      fetchTestimonials(); // إعادة جلب التوصيات لتحديث الواجهة
      setShowForm(false);
      setEditingTestimonial(null);
    } catch (error) {
      console.error('حدث خطأ أثناء حفظ التوصية:', error);
    }
  };

  // دالة لحذف توصية (DELETE) باستخدام documentId
  const handleDeleteTestimonial = async (documentId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Token not found. Cannot perform action.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('فشل في حذف التوصية.');
      }

      // تحديث الحالة بحذف التوصية من القائمة
      setTestimonials(testimonials.filter(testimonial => testimonial.documentId !== documentId));
      console.log('Testimonial deleted successfully.');
    } catch (error) {
      console.error('حدث خطأ أثناء حذف التوصية:', error);
    }
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
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    hover: { backgroundColor: '#f9fafb', transition: { duration: 0.2 } },
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6" >
      {/* بقية الكود بدون تغيير */}
      <motion.div variants={itemVariants}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إدارة التوصيات</h1>
            <p className="text-gray-600 mt-1">إدارة آراء وتوصيات العملاء</p>
          </div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} >
            <Button onClick={handleAddTestimonial} className="bg-blue-600 hover:bg-blue-700 text-white" >
              <Plus className="w-4 h-4 mr-2" /> إضافة توصية جديدة
            </Button>
          </motion.div>
        </div>
      </motion.div>
      <motion.div variants={itemVariants}>
        <Card className="shadow-sm border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>قائمة التوصيات</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="البحث في التوصيات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-right py-3 px-4 font-medium text-gray-700">العميل</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">المحتوى</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">التقييم</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">الشركة</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700">الإجراءات</th>
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
                          className="border-b border-gray-100"
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                <User className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{testimonial.nameUser}</div>
                                <div className="text-sm text-gray-500">{testimonial.CompanyName}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="max-w-xs">
                              <div className="flex items-start">
                                <Quote className="w-4 h-4 text-gray-400 mr-2 mt-1 flex-shrink-0" />
                                <p className="text-sm text-gray-700 line-clamp-3">
                                  {testimonial.message}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center">
                              {renderStars(testimonial.rating)}
                              <span className="mr-2 text-sm text-gray-600"> ({testimonial.rating}/5) </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <Badge className="bg-gray-100 text-gray-800 border-0">{testimonial.CompanyName}</Badge>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-center space-x-2">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleEditTestimonial(testimonial)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleDeleteTestimonial(testimonial.documentId)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingTestimonial ? 'تعديل التوصية' : 'إضافة توصية جديدة'}
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowForm(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
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
                  <Label htmlFor="nameUser">اسم العميل</Label>
                  <Input
                    id="nameUser"
                    value={formData.nameUser}
                    onChange={(e) => setFormData({...formData, nameUser: e.target.value})}
                    placeholder="أدخل اسم العميل"
                    className="mt-1 transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Label htmlFor="CompanyName">اسم الشركة</Label>
                  <Input
                    id="CompanyName"
                    value={formData.CompanyName}
                    onChange={(e) => setFormData({...formData, CompanyName: e.target.value})}
                    placeholder="أدخل اسم الشركة"
                    className="mt-1 transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Label htmlFor="message">محتوى التوصية</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    placeholder="أدخل نص التوصية"
                    rows={4}
                    className="mt-1 transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Label htmlFor="rating">التقييم</Label>
                  <select
                    id="rating"
                    value={formData.rating}
                    onChange={(e) => setFormData({...formData, rating: parseInt(e.target.value)})}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value={5}>5 نجوم</option>
                    <option value={4}>4 نجوم</option>
                    <option value={3}>3 نجوم</option>
                    <option value={2}>2 نجوم</option>
                    <option value={1}>1 نجمة</option>
                  </select>
                </motion.div>
              </div>
              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
                <Button variant="outline" onClick={() => setShowForm(false)} className="mr-3" >
                  إلغاء
                </Button>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} >
                  <Button
                    onClick={handleSaveTestimonial}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingTestimonial ? 'تحديث' : 'حفظ'}
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