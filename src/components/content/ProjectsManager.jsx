import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Calendar,
  User,
  Save,
  X,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

const ProjectsManager = () => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();

  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [formData, setFormData] = useState({
    productName: '',
    productDescription: '',
    Availability: true,
    productImages: [],
    productVideo: null,
    service_ajwains: ''
  });
  const [existingMedia, setExistingMedia] = useState({ 
    imageIds: [], 
    videoId: null, 
    images: [], 
    video: null,
    imagesToDelete: []
  });

  // Load projects from Strapi
  const loadProjects = async () => {
    const TOKEN = localStorage.getItem('token');
    try {
      const url = language === 'ar' 
        ? 'http://localhost:1337/api/product-ajwans?populate=*&locale=ar-SA'
        : 'http://localhost:1337/api/product-ajwans?populate=*';
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${TOKEN}` }
      });
      
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Failed to fetch projects: ${res.status} ${err}`);
      }
      
      const json = await res.json();
      const mapped = (json.data || []).map(item => {
        const attrs = item.attributes || item || {};
        return {
          id: item.id,
          documentId: attrs.documentId || item.documentId,
          productName: attrs.productName || item.productName || '',
          productDescription: attrs.productDescription || item.productDescription || '',
          Availability: attrs.Availability !== undefined ? attrs.Availability : true,
          productImages: attrs.productImages?.data || item.productImages || [],
          productVideo: attrs.productVideo?.data || item.productVideo || null,
          service_ajwains: attrs.service_ajwains?.data || item.service_ajwains || [],
          createdAt: ((attrs.createdAt || item.createdAt) || '').slice(0, 10),
          updatedAt: ((attrs.updatedAt || item.updatedAt) || '').slice(0, 10)
        };
      });
      
      setProjects(mapped);
    } catch (e) {
      console.error('loadProjects error', e);
      setProjects([]);
    }
  };

  useEffect(() => { 
    loadProjects(); 
  }, [language]);

  const filteredProjects = projects.filter(project =>
    project.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.productDescription.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddProject = () => {
    setEditingProject(null);
    setFormData({
      productName: '',
      productDescription: '',
      Availability: true,
      productImages: [],
      productVideo: null,
      service_ajwains: ''
    });
    setExistingMedia({ 
      imageIds: [], 
      videoId: null, 
      images: [], 
      video: null,
      imagesToDelete: []
    });
    setShowForm(true);
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    const imagesArray = Array.isArray(project.productImages) ? project.productImages : (project.productImages?.data || []);
    const videoArray = Array.isArray(project.productVideo) ? project.productVideo : (project.productVideo?.data || []);
    const imageIds = imagesArray.map(i => i.id).filter(Boolean);
    const videoId = videoArray[0]?.id || null;
    
    setExistingMedia({ 
      imageIds, 
      videoId, 
      images: imagesArray, 
      video: videoArray[0] || null,
      imagesToDelete: []
    });
    
    setFormData({
      productName: project.productName || '',
      productDescription: project.productDescription || '',
      Availability: project.Availability !== undefined ? project.Availability : true,
      productImages: [],
      productVideo: null,
      service_ajwains: (project.service_ajwains || []).map(s => s.id).join(',')
    });
    setShowForm(true);
  };

  // دالة جديدة: حذف صورة موجودة
  const handleRemoveExistingImage = (imageId) => {
    setExistingMedia(prev => ({
      ...prev,
      images: prev.images.filter(img => img.id !== imageId),
      imagesToDelete: [...prev.imagesToDelete, imageId]
    }));
  };

  // دالة جديدة: حذف صورة جديدة تم اختيارها
  const handleRemoveNewImage = (index) => {
    setFormData(prev => ({
      ...prev,
      productImages: prev.productImages.filter((_, i) => i !== index)
    }));
  };

  const handleSaveProject = async () => {
    if (isSaving) return;
    setIsSaving(true);
    const TOKEN = localStorage.getItem('token');

    // التحقق من البيانات المطلوبة
    if (!formData.productName.trim()) {
      toast.error(t('project_name_required') || 'Project name is required');
      setIsSaving(false);
      return;
    }

    // حذف الصور المحددة للحذف أولاً
    if (existingMedia.imagesToDelete.length > 0) {
      try {
        await Promise.all(
          existingMedia.imagesToDelete.map(async (imageId) => {
            const deleteResponse = await fetch(`http://localhost:1337/api/upload/files/${imageId}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${TOKEN}`
              }
            });
            if (!deleteResponse.ok) {
              console.error(`Failed to delete image ${imageId}`);
            }
          })
        );
      } catch (error) {
        console.error('Error deleting images:', error);
      }
    }

    const filesToUpload = [];
    if (formData.productImages && formData.productImages.length > 0) {
      for (const file of formData.productImages) filesToUpload.push({ fieldName: 'productImages', file });
    }
    if (formData.productVideo) {
      filesToUpload.push({ fieldName: 'productVideo', file: formData.productVideo });
    }
    
    let uploadedFiles = [];
    if (filesToUpload.length > 0) {
      const uploadFormData = new FormData();
      filesToUpload.forEach(item => {
        uploadFormData.append('files', item.file);
      });

      try {
        const uploadResponse = await fetch('http://localhost:1337/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${TOKEN}`
          },
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error('Upload failed:', uploadResponse.status, errorText);
          throw new Error('File upload failed');
        }

        uploadedFiles = await uploadResponse.json();

      } catch (error) {
        console.error('Error uploading files:', error);
        toast.error(t('upload_error') || 'Error uploading files');
        setIsSaving(false);
        return;
      }
    }
    
    // إعداد البيانات النهائية بشكل صحيح
    const finalData = { 
      productName: formData.productName, 
      productDescription: formData.productDescription,
      Availability: formData.Availability,
      // سنتعامل مع الصور والفيديو بشكل منفصل
    };
    
    // معالجة الملفات المرفوعة
    if (uploadedFiles.length > 0) {
      const imagesIds = [];
      const originalImageNames = Array.isArray(formData.productImages) ? formData.productImages.map(f => f.name) : [];
      const videoName = formData.productVideo?.name;
      
      for (const f of uploadedFiles) {
        if (videoName && f.name === videoName) {
          finalData.productVideo = f.id;
        } else if (originalImageNames.includes(f.name)) {
          imagesIds.push(f.id);
        }
      }
      
      // إضافة الصور الجديدة إلى البيانات النهائية
      if (imagesIds.length > 0) {
        finalData.productImages = imagesIds;
      }
    }
    
    // معالجة العلاقات - التأكد من أنها مصفوفات من الأرقام
    if (formData.service_ajwains) {
      const serviceIds = formData.service_ajwains.toString()
        .split(',')
        .map(s => s.trim())
        .filter(s => s !== '')
        .map(s => parseInt(s))
        .filter(n => !isNaN(n));
      
      if (serviceIds.length > 0) {
        finalData.service_ajwains = serviceIds;
      }
    }

    // الحفاظ على الوسائط الموجودة عند التحديث إذا لم يتم استبدالها أو حذفها
    if (editingProject) {
      if (!formData.productVideo && existingMedia.videoId && !finalData.productVideo) {
        finalData.productVideo = existingMedia.videoId;
      }
      
      // إضافة الصور القديمة المتبقية (غير المحذوفة)
      const remainingImages = existingMedia.images
        .filter(img => !existingMedia.imagesToDelete.includes(img.id))
        .map(img => img.id);
        
      if (remainingImages.length > 0) {
        finalData.productImages = finalData.productImages 
          ? [...finalData.productImages, ...remainingImages] 
          : remainingImages;
      }
    }
    
    // التأكد من أن productImages و productVideo موجودين حتى لو كانوا فارغين
    if (!finalData.productImages) finalData.productImages = [];
    if (!finalData.productVideo) finalData.productVideo = null;
    
    const payload = { data: finalData };
    
    // تسجيل البيانات المرسلة للتdebug
    console.log('Payload being sent:', payload);
    
    try {
      // تحديد endpoint و method المناسبين
      let apiEndpoint = 'http://localhost:1337/api/product-ajwans';
      let method = 'POST';
      
      if (editingProject) {
        if (editingProject.documentId) {
          apiEndpoint = `http://localhost:1337/api/product-ajwans/${editingProject.documentId}`;
          method = 'PUT';
        } else {
          apiEndpoint = `http://localhost:1337/api/product-ajwans/${editingProject.id}`;
          method = 'PUT';
        }
      }

      const projectResponse = await fetch(apiEndpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TOKEN}`
        },
        body: JSON.stringify(payload),
      });

      if (!projectResponse.ok) {
        const errorData = await projectResponse.json();
        console.error('Failed to save project data:', errorData);
        
        // عرض رسالة الخطأ للمستخدم
        const errorMessage = errorData.error?.message || 'Failed to save project data';
        toast.error(errorMessage);
        
        throw new Error('Failed to save project data');
      }

      const result = await projectResponse.json();
      console.log('Save successful:', result);
      
      // إعادة تحميل القائمة بعد الحفظ
      try { 
        await loadProjects(); 
      } catch (e) { 
        console.error('reload after save failed', e); 
      }
      
      setShowForm(false);
      setEditingProject(null);
      setExistingMedia({ imageIds: [], videoId: null, images: [], video: null, imagesToDelete: [] });
      toast.success(editingProject ? t('update') + ' ' + t('success') : t('save') + ' ' + t('success'));

    } catch (error) {
      console.error('Error saving project:', error);
      toast.error(t('error') || 'Error while saving');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProject = async (project) => {
    const TOKEN = localStorage.getItem('token');
    try {
      setDeletingId(project.id || project.documentId);
      const del = await fetch(`http://localhost:1337/api/product-ajwans/${project.documentId || project.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${TOKEN}` }
      });
      if (!del.ok) throw new Error('delete failed');
      setProjects(projects.filter(p => p.documentId !== project.documentId && p.id !== project.id));
      toast.success(t('deleted') || 'Deleted');
    } catch (e) {
      console.error(e);
      toast.error(t('error') || 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': { label: t('pending'), color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100', icon: Clock },
      'in-progress': { label: t('in_progress'), color: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100', icon: AlertCircle },
      'completed': { label: t('completed'), color: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100', icon: CheckCircle }
    }
    return statusConfig[status] || statusConfig['pending']
  }

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      'low': { label: t('low'), color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' },
      'medium': { label: t('medium'), color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' },
      'high': { label: t('high'), color: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100' }
    }
    return priorityConfig[priority] || priorityConfig['medium']
  }

  const getMediaUrl = (media) => {
    if (!media) return null;
    if (Array.isArray(media)) return getMediaUrl(media[0]);
    const url = media.attributes?.url || media.url;
    if (typeof url !== 'string') return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `http://localhost:1337${url}`;
  };

  // مكون جديد لعرض الصور مع زر الحذف
  const ImageWithDelete = ({ image, onRemove, isExisting = false }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    return (
      <motion.div 
        className="relative inline-block m-1"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.05 }}
      >
        <img 
          src={isExisting ? getMediaUrl(image) : URL.createObjectURL(image)} 
          alt="preview" 
          className="w-16 h-16 object-cover rounded border"
        />
        <AnimatePresence>
          {isHovered && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md"
              onClick={() => onRemove(isExisting ? image.id : image)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-3 h-3" />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    );
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
      transition: { duration: 0.5, ease: "easeOut" }
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
      <Toaster />
      <motion.div variants={itemVariants}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('manage_projects')}</h1>
            <p className="text-gray-600 mt-1 dark:text-gray-400">{t('manage_projects_desc')}</p>
          </div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={handleAddProject}
              className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-808"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('add_new_project')}
            </Button>
          </motion.div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="shadow-sm border-0 dark:bg-gray-800 dark:text-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="dark:text-white">{t('projects_list')}</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t('search_projects')}
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
                    <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t('project_name')}</th>
                    <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t('description')}</th>
                    <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-center`}>{t('images')}</th>
                    <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t('availability')}</th>
                    <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t('created_at')}</th>
                    <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${language === 'ar' ? 'text-center' : 'text-center'}`}>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filteredProjects.map((project, index) => (
                      <motion.tr
                        key={project.id}
                        variants={tableRowVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        whileHover="hover"
                        transition={{ delay: index * 0.1 }}
                        className="border-b border-gray-100 dark:border-gray-700"
                      >
                        <td className="py-4 px-4">
                          <div className="font-medium text-gray-900 dark:text-white">{project.productName || '-'}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">
                            {project.productDescription || '-'}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          {getMediaUrl(project.productImages) ? (
                            <img src={getMediaUrl(project.productImages)} alt="project" className="inline-block w-12 h-12 object-cover rounded" />
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <Badge className={`${project.Availability ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'} border-0`}>
                            {project.Availability ? t('available') : t('unavailable')}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-gray-500 dark:text-gray-400">
                          {project.createdAt}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-center space-x-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleEditProject(project)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors dark:hover:bg-gray-700"
                            >
                              <Edit className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDeleteProject(project)}
                              disabled={deletingId === (project.id || project.documentId)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-gray-700 disabled:opacity-50"
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
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:text-white"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {editingProject ? t('edit_project') : t('add_new_project')}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Label htmlFor="productName" className="dark:text-gray-200">{t('project_name')}</Label>
                    <Input
                      id="productName"
                      value={formData.productName}
                      onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                      placeholder={t('enter_project_name')}
                      className="mt-1 transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Label htmlFor="Availability" className="dark:text-gray-200">{t('availability')}</Label>
                    <select
                      id="Availability"
                      value={formData.Availability}
                      onChange={(e) => setFormData({ ...formData, Availability: e.target.value === 'true' })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    >
                      <option value={true}>{t('available')}</option>
                      <option value={false}>{t('unavailable')}</option>
                    </select>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Label htmlFor="productDescription" className="dark:text-gray-200">{t('project_description')}</Label>
                  <Textarea
                    id="productDescription"
                    value={formData.productDescription}
                    onChange={(e) => setFormData({ ...formData, productDescription: e.target.value })}
                    placeholder={t('enter_project_description')}
                    rows={4}
                    className="mt-1 transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Label htmlFor="productImages" className="dark:text-gray-200">{t("project_images")}</Label>
                  <div className="mt-1 flex items-center space-x-2">
                    <Input
                      id="productImages"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        productImages: [...formData.productImages, ...Array.from(e.target.files || [])] 
                      })}
                      className="flex-grow transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                    {Array.isArray(formData.productImages) && formData.productImages.length > 0 && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">{formData.productImages.length} file(s) selected</span>
                    )}
                  </div>
                  
                  {/* عرض الصور الجديدة المختارة */}
                  {formData.productImages.length > 0 && (
                    <div className="mt-3 flex flex-wrap">
                      {formData.productImages.map((file, index) => (
                        <ImageWithDelete 
                          key={index} 
                          image={file} 
                          onRemove={() => handleRemoveNewImage(index)}
                          isExisting={false}
                        />
                      ))}
                    </div>
                  )}
                  
                  {/* عرض الصور القديمة مع إمكانية الحذف */}
                  {editingProject && existingMedia.images?.length > 0 && (
                    <div className="mt-3 flex flex-wrap">
                      {existingMedia.images.map((img) => (
                        <ImageWithDelete 
                          key={img.id} 
                          image={img} 
                          onRemove={handleRemoveExistingImage}
                          isExisting={true}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Label htmlFor="productVideo" className="dark:text-gray-200">{t("project_video")}</Label>
                  <div className="mt-1 flex items-center space-x-2">
                    <Input
                      id="productVideo"
                      type="file"
                      accept="video/*"
                      onChange={(e) => setFormData({ ...formData, productVideo: e.target.files?.[0] || null })}
                      className="flex-grow transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                    {formData.productVideo && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">{formData.productVideo.name}</span>
                    )}
                  </div>
                  {editingProject && existingMedia.video && (
                    <div className="mt-3">
                      <video src={getMediaUrl(existingMedia.video)} controls className="w-full max-w-xs h-auto" />
                    </div>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Label htmlFor="service_ajwains" className="dark:text-gray-200">{t("related_services")}</Label>
                  <Input
                    id="service_ajwains"
                    value={formData.service_ajwains}
                    onChange={(e) => setFormData({ ...formData, service_ajwains: e.target.value })}
                    placeholder={t("enter_related_services_comma_separated")}
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
                    onClick={handleSaveProject}
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? t('loading') || 'Loading...' : (editingProject ? t('update') : t('save'))}
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

export default ProjectsManager;