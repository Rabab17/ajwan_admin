
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
  Languages
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

// Prefer configured backend URL; fallback to localhost for dev
const API_BASE = 'http://localhost:1337';
console.log("API_BASE:", API_BASE);


const ServiceItemManager = () => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();

  const [serviceItems, setServiceItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingServiceItem, setEditingServiceItem] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [activeTab, setActiveTab] = useState('en');
  const [formData, setFormData] = useState({
    title_en: '',
    title_ar: '',
    description_en: '',
    description_ar: '',
    imgItems: [],
    service_ajwain: ''
  });
  const [existingMedia, setExistingMedia] = useState({ 
    imageIds: [], 
    images: [], 
    imagesToDelete: []
  });
  // New: manage separate forms and Arabic linking to English via documentId
  const [formLanguage, setFormLanguage] = useState('en'); // 'en' | 'ar'
  const [englishItemsForDropdown, setEnglishItemsForDropdown] = useState([]); // {documentId, id, title}
  const [selectedEnglishDocumentId, setSelectedEnglishDocumentId] = useState('');

  // دالة محسنة لجلب التوكن مع التحقق من الصلاحية
  const getValidToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error(t('auth_error') || 'Authentication token missing');
      throw new Error('Authentication token missing');
    }
    return token;
  };

  // دالة محسنة للتحقق من الاستجابة
  const checkResponse = async (response) => {
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        toast.error(t('auth_error') || 'Authentication failed. Please login again.');
        throw new Error('Authentication failed');
      }
      
      const errorText = await response.text();
      console.error(`Server error: ${response.status}`, errorText);
      throw new Error(`Server error: ${response.status}`);
    }
    return response;
  };

  // دالة محسنة لجلب عناصر الخدمة
const loadServiceItems = async () => {
  // استخدم لغة افتراضية لو اللغة مش معرفة
  let lang = language || 'en';
  
  // لو اللغة عربية استخدم SA-ar
  if (lang === 'ar') {
    lang = 'SA-ar';
  }

  console.log("🌍 Current language:", lang);

  try {
    // استخدم URL كامل وصحيح
    const response = await fetch(
      `http://localhost:1337/api/service-items?populate=*&locale=${lang}`
    );
    console.log("response", response);

    // تحقق من استجابة السيرفر
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
        title: attrs.title, // سيكون حسب locale الحالي
        description: attrs.description,
        locale: attrs.locale,
        imgItems: normalizeImages(attrs.imgItems)
      };
    });

    setServiceItems(formatted);
  } catch (err) {
    console.error("Error loading service items:", err);
    toast.error("Error loading items");
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
    service_ajwain: ''
  });
  setExistingMedia({ imageIds: [], images: [], imagesToDelete: [] });
  setSelectedEnglishDocumentId('');

  if (lang === 'ar') {
  try {
    const response = await fetch(
      `${API_BASE}/api/service-items?locale=en&populate=imgItems`,
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
  }
};



  console.log();
  

  // New: load English items for Arabic linking
  const loadEnglishItemsForDropdown = async () => {
    try {
      const TOKEN = getValidToken();
      const res = await fetch(`${API_BASE}/api/service-items?populate=*&locale=en`, {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      await checkResponse(res);
      const json = await res.json();
      const options = (json.data || []).map((item) => {
        const attrs = item.attributes || {};
        return { documentId: attrs.documentId, id: item.id, title: attrs.title || '' };
      });
      setEnglishItemsForDropdown(options);
    } catch (e) {
      console.error('Failed to load English items for dropdown', e);
      toast.error(t('load_error') || 'Failed to load English items');
      setEnglishItemsForDropdown([]);
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
      service_ajwain: item.service_ajwain?.id || ''
    });
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

    // ✅ تحقق من العنوان
    if (formLanguage === 'en') {
      if (!formData.title_en.trim()) {
        toast.error(t('title_required') || 'Title is required');
        setIsSaving(false);
        return;
      }
    } else {
      if (!formData.title_ar.trim()) {
        toast.error(t('title_required') || 'Title is required');
        setIsSaving(false);
        return;
      }
      if (!selectedEnglishDocumentId) {
        toast.error(t('select_english_item') || 'Please select an English item to link');
        setIsSaving(false);
        return;
      }
    }

    // ✅ رفع الصور الجديدة فقط
    let uploadedFiles = [];
    if (formData.imgItems && formData.imgItems.length > 0) {
      try {
        const uploadFormData = new FormData();

        formData.imgItems.forEach(file => {
  if (file instanceof File) {
    uploadFormData.append('files', file);
  }
        });

        if ([...uploadFormData].length > 0) {
          const uploadResponse = await fetch(`${API_BASE}/api/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${TOKEN}`
            },
            body: uploadFormData,
          });

          await checkResponse(uploadResponse);
          uploadedFiles = await uploadResponse.json();
        }
      } catch (uploadError) {
        console.error('Error uploading files:', uploadError);
        toast.error(t('upload_error') || 'Error uploading images');
        setIsSaving(false);
        return;
      }
    }

    let itemId = editingServiceItem?.documentId || editingServiceItem?.id || null;

    if (formLanguage === 'en') {
      // ✅ حفظ الإنجليزية
      const finalDataEn = {
        data: {
          title: formData.title_en,
          description: formData.description_en
        }
      };

      if (uploadedFiles.length > 0) {
        finalDataEn.data.imgItems = uploadedFiles.map(f => f.id);
      }

      if (formData.service_ajwain) {
        const serviceId = parseInt(formData.service_ajwain);
        if (!isNaN(serviceId)) finalDataEn.data.service_ajwain = serviceId;
      }

      if (editingServiceItem) {
        const remainingImages = existingMedia.images
          .filter(img => !existingMedia.imagesToDelete.includes(img.id))
          .map(img => img.id);

        if (remainingImages.length > 0) {
          finalDataEn.data.imgItems = [...(finalDataEn.data.imgItems || []), ...remainingImages];
        }
      }

      let apiEndpoint = `${API_BASE}/api/service-items`;
      let method = 'POST';
      if (editingServiceItem) {
        apiEndpoint = `${API_BASE}/api/service-items/${itemId}`;
        method = 'PUT';
      }

      const enResp = await fetch(apiEndpoint, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
        body: JSON.stringify(finalDataEn)
      });
      await checkResponse(enResp);

    } else {
      // ✅ حفظ العربية (update على الوثيقة الإنجليزية)
    
const finalDataAr = {
  data: {
    title: formData.title_ar,
    description: formData.description_ar
  }
};

// ✅ لو فيه صور جديدة مرفوعة
if (uploadedFiles.length > 0) {
  finalDataAr.data.imgItems = uploadedFiles.map(f => f.id);
}

// ✅ fallback: لو مفيش صور جديدة، ابعتي الصور الموجودة من النسخة الإنجليزي
if ((!finalDataAr.data.imgItems || finalDataAr.data.imgItems.length === 0)) {
  const englishImages = editingServiceItem?.imgItems || []; // الصور الموجودة بالانجليزي
  if (englishImages.length > 0) {
    finalDataAr.data.imgItems = englishImages.map(img => img.id);
  }
}

// ✅ الخدمة
if (formData.service_ajwain) {
  const serviceId = parseInt(formData.service_ajwain);
  if (!isNaN(serviceId)) finalDataAr.data.service_ajwain = serviceId;
}

const targetDocId = selectedEnglishDocumentId || itemId
     const arResp = await fetch(`${API_BASE}/api/service-items/${targetDocId}?locale=ar-SA`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
  body: JSON.stringify(finalDataAr)
});

      await checkResponse(arResp);
    }

    // ✅ حذف الصور المحددة
    if (existingMedia.imagesToDelete.length > 0) {
      try {
        await Promise.all(
          existingMedia.imagesToDelete.map(async (imageId) => {
            try {
              const deleteResponse = await fetch(`${API_BASE}/api/upload/files/${imageId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${TOKEN}`
                }
              });
              if (!deleteResponse.ok) {
                console.warn(`Failed to delete image ${imageId}, it might be in use elsewhere`);
              }
            } catch (deleteError) {
              console.warn(`Error deleting image ${imageId}:`, deleteError);
            }
          })
        );
      } catch (error) {
        console.warn('Error deleting images, they might be in use:', error);
      }
    }

    await loadServiceItems();

    setShowForm(false);
    setEditingServiceItem(null);
    setExistingMedia({ imageIds: [], images: [], imagesToDelete: [] });
    toast.success(t('success') || 'Saved successfully');

  } catch (error) {
    console.error('Error saving service item:', error);
    toast.error(error.message || t('error') || 'Error while saving');
  } finally {
    setIsSaving(false);
  }
};
console.log("Image Items:", formData.imgItems);

const handleDeleteServiceItem = async (documentId) => {
  console.log("documentId",documentId);
  
  try {
    const result = await Swal.fire({
      title: "هل أنت متأكد؟",
      text: "لن تستطيع التراجع عن هذا الحذف!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "نعم، احذف!",
      cancelButtonText: "إلغاء",
    });

    if (!result.isConfirmed) return;

    const token = localStorage.getItem("token");
    if (!token) {
      Swal.fire("خطأ", "Token غير موجود، يرجى تسجيل الدخول", "error");
      return;
    }

    const deleteUrl = `${API_BASE}/api/service-items/${documentId}`;
    console.log("deleteUrl",deleteUrl);
    

    const response = await fetch(deleteUrl, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("حدث خطأ أثناء حذف العنصر");
    }

  setServiceItems((prev) =>
  prev.filter((item) => item.id != documentId)
);

    Swal.fire("تم!", "تم حذف العنصر بنجاح.", "success");
  } catch (error) {
    console.error("Delete error:", error);
    Swal.fire("خطأ", "فشل الحذف، حاول مرة أخرى", "error");
  }
};



 const getMediaUrl = (media) => {
  if (!media) return null;

  const url = media.attributes?.url || media.url;
  if (!url || typeof url !== "string") return null;

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return `${API_BASE}${url}`;
};


 const ImageWithDelete = ({ image, onRemove, isExisting = false }) => {
  const [isHovered, setIsHovered] = useState(false);

  // تحديد الـ src
  let imageSrc;
  if (isExisting) {
    imageSrc = getMediaUrl(image); // صورة من الـ API
  } else if (image instanceof File) {
    imageSrc = URL.createObjectURL(image); // صورة جديدة من input
  } else if (typeof image === "string") {
    imageSrc = image; // string URL مباشر
  } else if (image?.url) {
    imageSrc = getMediaUrl(image); // object جاي من Strapi { url: "..." }
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
        url: rawUrl.startsWith("http") ? rawUrl : `${API_BASE}${rawUrl}`,
        name: img.attributes?.name,
      };
    }).filter(Boolean); // احذف null
  }
  return imgItems.map((img) => {
    if (!img.url) return null;
    return {
      id: img.id,
      url: img.url.startsWith("http") ? img.url : `${API_BASE}${img.url}`,
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
          >
            <Button
              onClick={() => startAddServiceItem('en')}
              className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('add_new_service_item')} (EN)
            </Button>
            <Button
              onClick={() => startAddServiceItem('ar')}
              className="ml-2 bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-700 dark:hover:bg-emerald-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('add_new_service_item')} (AR)
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
                    <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t('image')}</th>
                    <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t('title')}</th>
                    <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t('Description')}</th>
                    <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t('created_at')}</th>
                    <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${language === 'ar' ? 'text-center' : 'text-center'}`}>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filteredServiceItems.map((item, index) => (
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
                           
  { item.title || '-'}
</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">
                            {item.description || '-'}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-500 dark:text-gray-400">
                          {item.createdAt || '-'}
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
                        placeholder={t('enter_title_en')}
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
                        placeholder={t('enter_description_en')}
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
                      {/* <select
                        id="link_en"
                        className="mt-1 w-full rounded border border-gray-300 p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                        value={selectedEnglishDocumentId}
                        onChange={(e) => setSelectedEnglishDocumentId(e.target.value)}
                      >
                        <option value="">{t('select_english_item')}</option>
                        {englishItemsForDropdown.map((opt) => (
                          <option key={opt.documentId || opt.id} value={opt.documentId || ''}>
                            {opt.title || `#${opt.id}`}
                          </option>
                        ))}
                      </select> */}
                      <select
  id="link_en"
  className="mt-1 w-full rounded border border-gray-300 p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
  value={selectedEnglishDocumentId}
  onChange={(e) => handleEnglishItemSelect(e.target.value)}
>
  <option value="">{t('select_english_item')}</option>
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
                        placeholder={t('enter_title_ar')}
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
                        placeholder={t('enter_description_ar')}
                        rows={4}
                        className="mt-1 transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                        dir="rtl"
                      />
                    </motion.div>
                  </div>
                )}

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
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? t('loading') || 'Loading...' : (editingServiceItem ? t('update') : t('save'))}
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

export default ServiceItemManager;