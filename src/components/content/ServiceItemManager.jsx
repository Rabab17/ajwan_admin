import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Swal from "sweetalert2";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Save,
  X,
  ImageIcon,
  CheckCircle,
  AlertCircle,
  Clock,
  Languages,
  Loader2,
  Video,
  Link
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { PageLoader, InlineLoader, CardLoader, ButtonLoader } from '../ui/Loader';
// import { SuccessAlert, ErrorAlert } from '../ui/Alert';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationContainer } from '../ui/NotificationContainer';

import { getApiUrl } from '../../config/api';

// Use API configuration for base URL

const ServiceItemManager = () => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const { notifications, showSuccess, showError, removeNotification } = useNotifications();

  const [serviceItems, setServiceItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingServiceItem, setEditingServiceItem] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [activeTab, setActiveTab] = useState('en');
  const [formData, setFormData] = useState({
    title_en: '',
    title_ar: '',
    description_en: '',
    description_ar: '',
    imgItems: [],
    service_ajwain: '',
    videoUrl: ''
  });
  const [existingMedia, setExistingMedia] = useState({
    imageIds: [],
    images: [],
    imagesToDelete: []
  });
  
  const [formLanguage, setFormLanguage] = useState(language);
  const [englishItemsForDropdown, setEnglishItemsForDropdown] = useState([]);
  const [selectedEnglishDocumentId, setSelectedEnglishDocumentId] = useState('');
  const [editingItemId, setEditingItemId] = useState(null);
  const [status, setStatus] = useState('published'); // حالة النشر: published أو draft

  // دالة لتنسيق التاريخ بشكل صديق للمستخدم
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return language === 'ar' ? 'اليوم' : 'Today';
    } else if (diffDays === 1) {
      return language === 'ar' ? 'أمس' : 'Yesterday';
    } else if (diffDays < 7) {
      return language === 'ar' 
        ? `منذ ${diffDays} أيام` 
        : `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  // دالة محسنة لجلب التوكن مع التحقق من الصلاحية
  const getValidToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error(language === 'ar' ? 'يجب تسجيل الدخول للمتابعة 🔐' : 'Please log in to continue 🔐');
      throw new Error('Authentication token missing');
    }
    return token;
  };

  // دالة محسنة للتحقق من الاستجابة
  const checkResponse = async (response) => {
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        toast.error(language === 'ar' ? 'انتهت جلستك، يرجى تسجيل الدخول مرة أخرى' : 'Session expired, please log in again');
        throw new Error('Authentication failed');
      }

      const errorText = await response.text();
      console.error(`Server error: ${response.status}`, errorText);
      throw new Error(language === 'ar' ? 'عذراً، حدث خطأ في الخادم' : 'Oops! Something went wrong on our end');
    }
    return response;
  };

  // دالة محسنة لجلب عناصر الخدمة
  const loadServiceItems = async () => {
    setIsLoading(true);
    let lang = language || 'en';

    if (lang === 'ar') {
      lang = 'ar-SA';
    }

    console.log("🌍 Current language:", lang);

    try {
      const response = await fetch(
        `${getApiUrl()}/service-items?populate=*&locale=${lang}`
      );
      console.log("response", response);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("📦 Fetched service items:", data);

      const formatted = data.data.map(item => {
        const attrs = item.attributes || item;
        return {
          id: item.id,
          documentId: attrs.documentId,
          title: attrs.title,
          description: attrs.description,
          locale: attrs.locale,
          imgItems: normalizeImages(attrs.imgItems),
          createdAt: attrs.createdAt,
          updatedAt: attrs.updatedAt,
          videoUrl: attrs.videoUrl || '',
          publishedAt: attrs.publishedAt,
          status: attrs.publishedAt ? 'published' : 'draft'
        };
      });

      setServiceItems(formatted);
    } catch (err) {
      console.error("Error loading service items:", err);
      toast.error(language === 'ar' ? 'عذراً، حدث خطأ أثناء تحميل البيانات' : 'Oops! We had trouble loading your items');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadServiceItems();
  }, [language]);

  const filteredServiceItems = serviceItems.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.service_ajwain && item.service_ajwain.attributes?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // New: start add flow with specific language
  const startAddServiceItem = async (lang) => {
    setEditingServiceItem(null);
    setFormLanguage(lang);
    
    setFormData({
      title_en: '',
      title_ar: '',
      description_en: '',
      description_ar: '',
      imgItems: [],
      service_ajwain: '',
      videoUrl: ''
    });
    setExistingMedia({ imageIds: [], images: [], imagesToDelete: [] });
    setSelectedEnglishDocumentId('');
    setStatus('published');

    if (lang === 'ar') {
      try {
        const response = await fetch(
          `${getApiUrl()}/service-items?locale=en&populate=imgItems`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );
        const data = await response.json();

        console.log("📌 English Items Response:", data);

        setEnglishItemsForDropdown(data.data || []);
      } catch (error) {
        console.error("Error loading English items:", error);
      }
    }

    setShowForm(true);
  };

  const handleEnglishItemSelect = (docId) => {
    setSelectedEnglishDocumentId(docId);

    const selectedItem = serviceItems.find(
      (item) => item.documentId === docId
    );

    if (selectedItem) {
      const images = normalizeImages(selectedItem.imgItems);
      setExistingMedia({
        imageIds: images.map((img) => img.id),
        images,
        imagesToDelete: [],
      });
      
      // تعبئة بيانات الفيديو إذا كانت موجودة
      setFormData(prev => ({
        ...prev,
        videoUrl: selectedItem.videoUrl || ''
      }));
    }
  };

  const handleEditServiceItem = (item) => {
    setEditingServiceItem(item);
    const imagesArray = Array.isArray(item.imgItems) ? item.imgItems : (item.imgItems?.data || []);
    const imageIds = imagesArray.map(i => i.id).filter(Boolean);

    setExistingMedia({
      imageIds,
      images: imagesArray,
      imagesToDelete: []
    });

    setFormData({
      title_en: item.title || '',
      title_ar: item.title || '',
      description_en: item.description || '',
      description_ar: item.description || '',
      imgItems: [],
      service_ajwain: item.service_ajwain?.id || '',
      videoUrl: item.videoUrl || ''
    });
    
    setStatus(item.status || 'published');
    setShowForm(true);
  };

  const handleFileChange = (e, fieldName) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      [fieldName]: fieldName === 'imgItems' ? [...prev[fieldName], ...files] : files[0]
    }));
  };

  const handleRemoveExistingImage = (imageId) => {
    setExistingMedia(prev => ({
      ...prev,
      images: prev.images.filter(img => img.id !== imageId),
      imagesToDelete: [...prev.imagesToDelete, imageId]
    }));
  };

  const handleRemoveNewImage = (index) => {
    setFormData(prev => ({
      ...prev,
      imgItems: prev.imgItems.filter((_, i) => i !== index)
    }));
  };

  const handleSaveServiceItem = async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      const TOKEN = getValidToken();
      if (!TOKEN) throw new Error(language === 'ar' ? "يجب تسجيل الدخول أولا" : "Please log in first");

      // ✅ تحقق من البيانات المطلوبة
      if (formLanguage === "en") {
        if (!formData.title_en?.trim() || !formData.description_en?.trim()) {
          toast.error(language === 'ar' ? "يرجى إضافة عنوان ووصف باللغة الإنجليزية 📝" : "Please add both a title and description in English 📝");
          setIsSaving(false);
          return;
        }
      } else if (formLanguage === "ar") {
        if (!formData.title_ar?.trim() || !formData.description_ar?.trim()) {
          toast.error(language === 'ar' ? "يرجى إضافة عنوان ووصف باللغة العربية 📝" : "Please add both a title and description in Arabic 📝");
          setIsSaving(false);
          return;
        }
        if (!editingServiceItem && !selectedEnglishDocumentId) {
          toast.error(language === 'ar' ? "يرجى اختيار العنصر الإنجليزي المرتبط بهذه الترجمة 🔗" : "Please select an English item to link to this Arabic version 🔗");
          setIsSaving(false);
          return;
        }
      }

      // ✅ رفع الصور الجديدة
      let uploadedFiles = [];
      if (formData.imgItems && formData.imgItems.length > 0) {
        const uploadFormData = new FormData();
        formData.imgItems.forEach((file) => {
          if (file instanceof File) {
            uploadFormData.append("files", file);
          }
        });

        if ([...uploadFormData].length > 0) {
          // إضافة timeout للرفع
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 ثانية للرفع
          
          try {
            const uploadResponse = await fetch(`${getApiUrl()}/upload`, {
              method: "POST",
              headers: { Authorization: `Bearer ${TOKEN}` },
              body: uploadFormData,
              signal: controller.signal,
            });
            clearTimeout(timeoutId);
            await checkResponse(uploadResponse);
            uploadedFiles = await uploadResponse.json();
          } catch (uploadError) {
            clearTimeout(timeoutId);
            if (uploadError.name === 'AbortError') {
              throw new Error('Upload timeout - please try again');
            }
            throw uploadError;
          }
        }
      }

      // ----------------- ✅ CREATE -----------------
      if (!editingServiceItem) {
        if (formLanguage === "en") {
          const finalDataEn = {
            data: {
              title: formData.title_en,
              description: formData.description_en,
              locale: "en",
              videoUrl: formData.videoUrl || undefined,
              publishedAt: status === 'published' ? new Date().toISOString() : null
            },
          };
          if (uploadedFiles.length > 0) {
            finalDataEn.data.imgItems = uploadedFiles.map((f) => f.id);
          }
          if (formData.service_ajwain) {
            const serviceId = parseInt(formData.service_ajwain);
            if (!isNaN(serviceId)) finalDataEn.data.service_ajwain = serviceId;
          }

          const enResp = await fetch(`${getApiUrl()}/service-items?locale=en`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${TOKEN}`,
            },
            body: JSON.stringify(finalDataEn),
          });
          await checkResponse(enResp);
        } else {
          const finalDataAr = {
            data: {
              title: formData.title_ar,
              description: formData.description_ar,
              videoUrl: formData.videoUrl || undefined,
              publishedAt: status === 'published' ? new Date().toISOString() : null
            },
          };
          if (uploadedFiles.length > 0) {
            finalDataAr.data.imgItems = uploadedFiles.map((f) => f.id);
          }
          if (formData.service_ajwain) {
            const serviceId = parseInt(formData.service_ajwain);
            if (!isNaN(serviceId)) finalDataAr.data.service_ajwain = serviceId;
          }

          const arResp = await fetch(
            `${getApiUrl()}/service-items/${selectedEnglishDocumentId}?locale=ar-SA`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${TOKEN}`,
              },
              body: JSON.stringify(finalDataAr),
            }
          );
          await checkResponse(arResp);
        }
      } else {
        // ----------------- ✅ UPDATE -----------------
        const updateServiceItem = async (documentId, locale, data) => {
          if (!documentId) throw new Error(language === 'ar' ? "معرف المستند مفقود" : "Document ID is missing");
          console.log("Updating documentId:", documentId, "with locale:", locale, "and data:", data);

          const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));

          const response = await fetch(
            `${getApiUrl()}/service-items/${documentId}?locale=${locale}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${TOKEN}`,
              },
              body: JSON.stringify({
                data: cleanData
              }),
            }
          );
          await checkResponse(response);
          return await response.json();
        };

        const getFinalImgItems = (existingImages) => {
          const keptImages = existingImages
            .filter(img => !existingMedia.imagesToDelete.includes(img.id))
            .map(img => img.id);
          const newImages = uploadedFiles.map(f => f.id);
          return [...keptImages, ...newImages];
        };

        const targetDocumentId = editingServiceItem.documentId;
        const targetLocale = editingServiceItem.locale;

        if (!targetDocumentId) {
          toast.error(language === 'ar' ? "معرف المستند مفقود. يرجى المحاولة مرة أخرى." : "Document ID is missing. Please try again.");
          setIsSaving(false);
          return;
        }

        const finalData = {
          title: formLanguage === "en" ? formData.title_en : formData.title_ar,
          description: formLanguage === "en" ? formData.description_en : formData.description_ar,
          imgItems: getFinalImgItems(editingServiceItem.imgItems || []),
          service_ajwain: formData.service_ajwain ? parseInt(formData.service_ajwain) : undefined,
          videoUrl: formData.videoUrl || undefined,
          publishedAt: status === 'published' ? new Date().toISOString() : null
        };

        await updateServiceItem(targetDocumentId, targetLocale, finalData);
      }

      // ✅ بعد الحفظ
      await loadServiceItems();
      setShowForm(false);
      setEditingServiceItem(null);
      setExistingMedia({ images: [], imagesToDelete: [] });
      toast.success(language === 'ar' ? "تم حفظ العنصر بنجاح! 🎉" : "Awesome! Your item has been saved successfully! 🎉");
    } catch (error) {
      console.error("Error saving service item:", error);
      
      // معالجة أفضل للأخطاء
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        toast.error(language === 'ar' 
          ? "🔌 مشكلة في الاتصال بالسيرفر. يرجى المحاولة مرة أخرى" 
          : "🔌 Connection issue. Please try again");
      } else if (error.message.includes('CORS') || error.message.includes('blocked by CORS policy')) {
        toast.error(language === 'ar' 
          ? "🚫 مشكلة في الصلاحيات. يرجى مراجعة إعدادات السيرفر" 
          : "🚫 CORS issue. Please check server settings");
      } else if (error.message.includes('Upload timeout')) {
        toast.error(language === 'ar' 
          ? "⏰ انتهت مهلة رفع الملفات. يرجى المحاولة مرة أخرى" 
          : "⏰ Upload timeout. Please try again");
      } else {
        toast.error(language === 'ar' 
          ? "❌ عذراً، حدث خطأ أثناء الحفظ. يرجى المحاولة مرة أخرى" 
          : "❌ Oops! Something went wrong while saving. Please try again");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteServiceItem = async (documentId) => {
    try {
      const result = await Swal.fire({
        title: language === 'ar' ? "هل أنت متأكد من هذا الإجراء؟" : "Are you sure about this?",
        text: language === 'ar' ? "لن تتمكن من التراجع عن هذا الحذف!" : "This action cannot be undone!",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: language === 'ar' ? "نعم، احذف!" : "Yes, delete it!",
        cancelButtonText: language === 'ar' ? "إلغاء" : "Cancel",
      });

      if (!result.isConfirmed) return;

      setDeletingId(documentId);
      const token = localStorage.getItem("token");
      if (!token) {
        Swal.fire(
          language === 'ar' ? "عذراً" : "Oops!",
          language === 'ar' ? "يجب تسجيل الدخول أولاً" : "Please log in first",
          "info"
        );
        return;
      }

      const response = await fetch(`${getApiUrl()}/service-items/${documentId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error(language === 'ar' ? "حدث خطأ أثناء حذف العنصر" : "Error deleting item");

      setServiceItems((prev) => prev.filter((item) => item.documentId !== documentId));

      Swal.fire(
        language === 'ar' ? "تم الحذف!" : "Success!",
        language === 'ar' ? "تم حذف العنصر بنجاح." : "The item has been successfully removed.",
        "success"
      );
    } catch (error) {
      console.error("Delete error:", error);
      Swal.fire(
        language === 'ar' ? "عذراً" : "Oops!",
        language === 'ar' ? "لم نتمكن من حذف هذا العنصر. يرجى المحاولة مرة أخرى." : "We couldn't delete this item. Please try again.",
        "error"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const getMediaUrl = (media) => {
    if (!media) return null;

    const url = media.attributes?.url || media.url;
    if (!url || typeof url !== "string") return null;

    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }

    return `${getApiUrl().replace('/api', '')}${url}`;
  };

  const ImageWithDelete = ({ image, onRemove, isExisting = false }) => {
    const [isHovered, setIsHovered] = useState(false);

    let imageSrc;
    if (isExisting) {
      imageSrc = getMediaUrl(image);
    } else if (image instanceof File) {
      imageSrc = URL.createObjectURL(image);
    } else if (typeof image === "string") {
      imageSrc = image;
    } else if (image?.url) {
      imageSrc = getMediaUrl(image);
    }

    return (
      <motion.div
        className="relative inline-block m-1"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.05 }}
      >
        <img
          src={imageSrc}
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

  const normalizeImages = (imgItems) => {
    if (!imgItems) return [];
    if (imgItems.data) {
      return imgItems.data.map((img) => {
        const rawUrl = img.attributes?.url;
        if (!rawUrl) return null;
        return {
          id: img.id,
          url: rawUrl.startsWith("http") ? rawUrl : `${getApiUrl().replace('/api', '')}${rawUrl}`,
          name: img.attributes?.name,
        };
      }).filter(Boolean);
    }
    return imgItems.map((img) => {
      if (!img.url) return null;
      return {
        id: img.id,
        url: img.url.startsWith("http") ? img.url : `${getApiUrl().replace('/api', '')}${img.url}`,
        name: img.name,
      };
    }).filter(Boolean);
  };

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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('manage_service_items')}</h1>
            <p className="text-gray-600 mt-1 dark:text-gray-400">{t('manage_service_items_desc')}</p>
          </div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex"
          >
            <Button
              onClick={() => startAddServiceItem('en')}
              className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'إضافة عنصر جديد (إنجليزي)' : 'Add New Item (EN)'}
            </Button>
            <Button
              onClick={() => startAddServiceItem('ar')}
              className="ml-2 bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-700 dark:hover:bg-emerald-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'إضافة عنصر جديد (عربي)' : 'Add New Item (AR)'}
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
                  placeholder={language === 'ar' ? 'ابحث في عناصر الخدمة... 🔍' : 'Search service items... 🔍'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <CardLoader message={language === 'ar' ? 'جاري التحميل...' : 'Loading your items...'} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t('image')}</th>
                      <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t('title')}</th>
                      <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t('Description')}</th>
                      <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${language === 'ar' ? 'text-right' : 'text-left'}`}>Video</th>
                      <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t('status')}</th>
                      <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t('created_at')}</th>
                      <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${language === 'ar' ? 'text-center' : 'text-center'}`}>{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {filteredServiceItems.length > 0 ? (
                        filteredServiceItems.map((item, index) => (
                          <motion.tr
                            key={item.id || index}
                            variants={tableRowVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            whileHover="hover"
                            transition={{ delay: index * 0.1 }}
                            className="border-b border-gray-100 dark:border-gray-700"
                          >
                            <td className="py-4 px-4">
                              {item.imgItems && item.imgItems.length > 0 ? (
                                <img
                                  src={getMediaUrl(item.imgItems[0])}
                                  alt="service item"
                                  className="inline-block w-12 h-12 object-cover rounded"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center dark:bg-gray-700">
                                  <ImageIcon className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                            </td>

                            <td className="py-4 px-4">
                              <div className="font-medium text-gray-900 dark:text-white">
                                {item.title || '-'}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">
                                {item.description || '-'}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              {item.videoUrl ? (
                                <a 
                                  href={item.videoUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:text-blue-700 flex items-center"
                                >
                                  <Video className="w-4 h-4 mr-1" />
                                  {language === 'ar' ? 'عرض الفيديو' : 'View Video'}
                                </a>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <Badge 
                                className={item.status === 'published' 
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" 
                                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                                }
                              >
                                {item.status === 'published' 
                                  ? (language === 'ar' ? 'منشور' : 'Published') 
                                  : (language === 'ar' ? 'مسودة' : 'Draft')
                                }
                              </Badge>
                            </td>
                            <td className="py-4 px-4 text-gray-500 dark:text-gray-400">
                              {formatDate(item.createdAt)}
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
                                  onClick={() => handleDeleteServiceItem(item.documentId)}
                                  disabled={deletingId === item.documentId}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-gray-700 disabled:opacity-50"
                                >
                                  {deletingId === item.documentId ? (
                                    <InlineLoader size="small" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </motion.button>
                              </div>
                            </td>
                          </motion.tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="py-8 text-center text-gray-500 dark:text-gray-400">
                            {searchTerm ? (
                              language === 'ar' ? 'لم نعثر على نتائج تطابق بحثك. حاول بكلمات أخرى! 🔍' : 'No matches found for your search. Try different keywords! 🔍'
                            ) : (
                              language === 'ar' ? 'لا توجد عناصر خدمة بعد. أضف أول عنصر لتبدأ! 🚀' : 'No service items yet. Add your first one to get started! 🚀'
                            )}
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}
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

              <div className="p-6 space-y-6">
                {/* Status Selector */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                >
                  <Label htmlFor="status" className="dark:text-gray-200">{t('status')}</Label>
                  <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="mt-1 w-full rounded border border-gray-300 p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  >
                    <option value="published">{language === 'ar' ? 'منشور' : 'Published'}</option>
                    <option value="draft">{language === 'ar' ? 'مسودة' : 'Draft'}</option>
                  </select>
                </motion.div>

                {formLanguage === 'en' && (
                  <div className="space-y-4 mt-2">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <Label htmlFor="title_en" className="dark:text-gray-200">{t('title')} (English)</Label>
                      <Input
                        id="title_en"
                        value={formData.title_en}
                        onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                        placeholder={language === 'ar' ? 'أدخل العنوان باللغة الإنجليزية' : 'Enter title in English'}
                        className="mt-1 transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Label htmlFor="description_en" className="dark:text-gray-200">{t('description')} (English)</Label>
                      <Textarea
                        id="description_en"
                        value={formData.description_en}
                        onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                        placeholder={language === 'ar' ? 'أدخل الوصف باللغة الإنجليزية' : 'Enter description in English'}
                        rows={4}
                        className="mt-1 transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      />
                    </motion.div>
                  </div>
                )}

                {formLanguage === 'ar' && (
                  <div className="space-y-4 mt-2">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 }}
                    >
                      <Label htmlFor="link_en" className="dark:text-gray-200">{t('link_to_english_item')}</Label>
                      <select
                        id="link_en"
                        className="mt-1 w-full rounded border border-gray-300 p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                        value={selectedEnglishDocumentId}
                        onChange={(e) => handleEnglishItemSelect(e.target.value)}
                      >
                        <option value="">{language === 'ar' ? 'اختر العنصر الإنجليزي المرتبط' : 'Select English item to link'}</option>
                        {englishItemsForDropdown.map((opt) => (
                          <option key={opt.documentId} value={opt.documentId}>
                            {opt.title || `#${opt.id}`}
                          </option>
                        ))}
                      </select>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <Label htmlFor="title_ar" className="dark:text-gray-200">{t('title')} (العربية)</Label>
                      <Input
                        id="title_ar"
                        value={formData.title_ar}
                        onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                        placeholder={language === 'ar' ? 'أدخل العنوان باللغة العربية' : 'Enter title in Arabic'}
                        className="mt-1 transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                        dir="rtl"
                      />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                    >
                      <Label htmlFor="description_ar" className="dark:text-gray-200">{t('description')} (العربية)</Label>
                      <Textarea
                        id="description_ar"
                        value={formData.description_ar}
                        onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                        placeholder={language === 'ar' ? 'أدخل الوصف باللغة العربية' : 'Enter description in Arabic'}
                        rows={4}
                        className="mt-1 transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                        dir="rtl"
                      />
                    </motion.div>
                  </div>
                )}

                {/* Video URL Field */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Label htmlFor="videoUrl" className="dark:text-gray-200 flex items-center">
                    <Video className="w-4 h-4 mr-2" />
                    {language === 'ar' ? 'رابط الفيديو' : 'Video URL'}
                  </Label>
                  <Input
                    id="videoUrl"
                    type="url"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    placeholder={language === 'ar' ? 'أدخل رابط الفيديو' : 'Enter video URL'}
                    className="mt-1 transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                  <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">
                    {language === 'ar' 
                      ? 'يمكنك إضافة رابط فيديو من YouTube أو أي منصة أخرى لجعل خدمتك أكثر جاذبية! 🎥' 
                      : 'Pro tip: Add a video URL from YouTube or other platforms to make your service more engaging! 🎥'
                    }
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Label htmlFor="imgItems" className="dark:text-gray-200">{t("images")}</Label>
                  <div className="mt-1 flex items-center space-x-2">
                    <Input
                      id="imgItems"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleFileChange(e, 'imgItems')}
                      className="flex-grow transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                    {Array.isArray(formData.imgItems) && formData.imgItems.length > 0 && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">{formData.imgItems.length} file(s) selected</span>
                    )}
                  </div>

                  {/* عرض الصور الجديدة المختارة */}
                  {formData.imgItems.length > 0 && (
                    <div className="mt-3 flex flex-wrap">
                      {formData.imgItems.map((file, index) => (
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
                  {editingServiceItem && existingMedia.images?.length > 0 && (
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
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <ButtonLoader className="mr-2" />
                        {language === 'ar' ? 'جاري الحفظ...' : 'Saving...'}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {editingServiceItem ? t('update') : t('save')}
                      </>
                    )}
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

export default ServiceItemManager;