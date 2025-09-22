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
  Video,
  Link
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { PageLoader, InlineLoader, CardLoader, ButtonLoader } from '../ui/Loader';
import { SuccessAlert, ErrorAlert } from '../ui/Alert';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationContainer } from '../ui/NotificationContainer';

import { getApiUrl } from '../../config/api';

// Use environment variable for API base URL
const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:1337';
console.log("API_BASE:", API_BASE);

const ProjectsManager = () => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const { notifications, showSuccess, showError, removeNotification } = useNotifications();

  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [activeTab, setActiveTab] = useState('en');
  const [formData, setFormData] = useState({
    productName_en: '',
    productName_ar: '',
    productDescription_en: '',
    productDescription_ar: '',
    Availability: true,
    productImages: [],
    videoUrl: '',
    service_ajwains: ''
  });
  const [existingMedia, setExistingMedia] = useState({
    imageIds: [],
    images: [],
    imagesToDelete: []
  });

  // New: manage separate forms and Arabic linking to English via documentId
  const [formLanguage, setFormLanguage] = useState(language); // 'en' | 'ar'
  const [englishProjectsForDropdown, setEnglishProjectsForDropdown] = useState([]); // {documentId, id, productName}
  const [selectedEnglishDocumentId, setSelectedEnglishDocumentId] = useState('');
  const [editingProjectId, setEditingProjectId] = useState(null);

  // Enhanced token retrieval with user-friendly error messages
  const getValidToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Oops! It looks like you\'re not signed in 🔐 Please log in to continue');
      throw new Error('Authentication token missing');
    }
    return token;
  };

  // Enhanced response checking with friendly error messages
  const checkResponse = async (response) => {
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        toast.error('Your session has expired 🕐 Please sign in again to continue working on your projects');
        throw new Error('Authentication failed');
      }

      const errorText = await response.text();
      console.error(`Server error: ${response.status}`, errorText);
      toast.error('Something went wrong on our end 😔 Please try again in a moment');
      throw new Error(`Server error: ${response.status}`);
    }
    return response;
  };

  // Enhanced project loading with friendly error messages
  const loadProjects = async () => {
    let lang = language || 'en';

    if (lang === 'ar') {
      lang = 'ar-SA';
    }

    console.log("🌍 Current language:", lang);

    try {
      const response = await fetch(
        `${API_BASE}/api/product-ajwans?populate=*&locale=${lang}`
      );
      console.log("response", response);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("📦 Fetched projects:", data);

      const formatted = data.data.map(item => {
        const attrs = item.attributes || item;
        return {
          id: item.id,
          documentId: attrs.documentId,
          productName: attrs.productName,
          productDescription: attrs.productDescription,
          Availability: attrs.Availability !== undefined ? attrs.Availability : true,
          locale: attrs.locale,
          productImages: normalizeImages(attrs.productImages),
          videoUrl: attrs.videoUrl || '',
          service_ajwains: attrs.service_ajwains?.data || attrs.service_ajwains || [],
          createdAt: ((attrs.createdAt || item.createdAt) || '').slice(0, 10),
          updatedAt: ((attrs.updatedAt || item.updatedAt) || '').slice(0, 10)
        };
      });

      setProjects(formatted);
    } catch (err) {
      console.error("Error loading projects:", err);
      toast.error("We're having trouble loading your projects right now 📂 Please refresh the page or try again later");
    }
  };

  useEffect(() => {
    loadProjects();
  }, [language]);

  const filteredProjects = projects.filter(project =>
    project.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.productDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (project.service_ajwains && project.service_ajwains.some(s => 
      s.attributes?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    ))
  );

  // New: start add flow with specific language
  const startAddProject = async (lang) => {
    setEditingProject(null);
    setFormLanguage(lang);
    console.log("setFormLanguage", setFormLanguage(lang));
    
    setFormData({
      productName_en: '',
      productName_ar: '',
      productDescription_en: '',
      productDescription_ar: '',
      Availability: true,
      productImages: [],
      videoUrl: '',
      service_ajwains: ''
    });
    setExistingMedia({ 
      imageIds: [], 
      images: [], 
      imagesToDelete: []
    });
    setSelectedEnglishDocumentId('');

    if (lang === 'ar') {
      try {
        const response = await fetch(
          `${API_BASE}/api/product-ajwans?locale=en&populate=productImages`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );
        const data = await response.json();

        console.log("📌 English Projects Response:", data);

        setEnglishProjectsForDropdown(data.data || []);
      } catch (error) {
        console.error("Error loading English projects:", error);
        toast.error("We couldn't load the English projects for linking 🔗 Please try again");
      }
    }

    setShowForm(true);
  };

  const handleEnglishProjectSelect = (docId) => {
    setSelectedEnglishDocumentId(docId);

    const selectedProject = projects.find(
      (project) => project.documentId === docId
    );

    if (selectedProject) {
      const images = normalizeImages(selectedProject.productImages);
      setExistingMedia({
        imageIds: images.map((img) => img.id),
        images,
        imagesToDelete: [],
      });
      
      setFormData(prev => ({
        ...prev,
        videoUrl: selectedProject.videoUrl || ''
      }));
    }
  };

  // New: load English projects for Arabic linking
  const loadEnglishProjectsForDropdown = async () => {
    try {
      const TOKEN = getValidToken();
      const res = await fetch(`${API_BASE}/api/product-ajwans?populate=*&locale=en`, {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      await checkResponse(res);
      const json = await res.json();
      const options = (json.data || []).map((item) => {
        const attrs = item.attributes || {};
        return { 
          documentId: attrs.documentId, 
          id: item.id, 
          productName: attrs.productName || '' 
        };
      });
      setEnglishProjectsForDropdown(options);
    } catch (e) {
      console.error('Failed to load English projects for dropdown', e);
      toast.error('We had trouble loading the English projects 📝 Please refresh and try again');
      setEnglishProjectsForDropdown([]);
    }
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    const imagesArray = Array.isArray(project.productImages) ? project.productImages : (project.productImages?.data || []);
    const imageIds = imagesArray.map(i => i.id).filter(Boolean);

    setExistingMedia({
      imageIds,
      images: imagesArray,
      imagesToDelete: []
    });

    setFormData({
      productName_en: project.productName || '',
      productName_ar: project.productName || '',
      productDescription_en: project.productDescription || '',
      productDescription_ar: project.productDescription || '',
      Availability: project.Availability !== undefined ? project.Availability : true,
      productImages: [],
      videoUrl: project.videoUrl || '',
      service_ajwains: (project.service_ajwains || []).map(s => s.id).join(',')
    });
    setShowForm(true);
  };

  const handleFileChange = (e, fieldName) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      [fieldName]: fieldName === 'productImages' ? [...prev[fieldName], ...files] : files[0]
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
      productImages: prev.productImages.filter((_, i) => i !== index)
    }));
  };

  const handleSaveProject = async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      const TOKEN = getValidToken();
      if (!TOKEN) throw new Error("Authentication token missing");

      // Enhanced validation with friendly messages
      if (formLanguage === "en") {
        if (!formData.productName_en?.trim()) {
          toast.error("Please give your project a name before continuing 🏷️");
          setIsSaving(false);
          return;
        }
        if (!formData.productDescription_en?.trim()) {
          toast.error("Don't forget to add a description! It helps others understand your project 📝");
          setIsSaving(false);
          return;
        }
      } else if (formLanguage === "ar") {
        if (!formData.productName_ar?.trim()) {
          toast.error("يرجى إدخال اسم للمشروع قبل المتابعة 🏷️");
          setIsSaving(false);
          return;
        }
        if (!formData.productDescription_ar?.trim()) {
          toast.error("لا تنسَ إضافة وصف للمشروع! يساعد الآخرين على فهم مشروعك 📝");
          setIsSaving(false);
          return;
        }
        if (!editingProject && !selectedEnglishDocumentId) {
          toast.error("يرجى اختيار المشروع الإنجليزي المرتبط بهذه الترجمة 🔗");
          setIsSaving(false);
          return;
        }
      }

      // Delete marked images with user feedback
      if (existingMedia.imagesToDelete.length > 0) {
        try {
          await Promise.all(
            existingMedia.imagesToDelete.map(async (imageId) => {
              const deleteResponse = await fetch(`${API_BASE}/api/upload/files/${imageId}`, {
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
          toast.error("We had trouble removing some of the old images, but your project will still be saved 📸");
        }
      }

      // Upload new files
      let uploadedFiles = [];
      const filesToUpload = [];
      
      if (formData.productImages && formData.productImages.length > 0) {
        for (const file of formData.productImages) filesToUpload.push({ fieldName: 'productImages', file });
      }

      if (filesToUpload.length > 0) {
        const uploadFormData = new FormData();
        filesToUpload.forEach(item => {
          uploadFormData.append('files', item.file);
        });

        try {
          const uploadResponse = await fetch(`${API_BASE}/api/upload`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${TOKEN}` },
            body: uploadFormData,
          });
          await checkResponse(uploadResponse);
          uploadedFiles = await uploadResponse.json();
        } catch (error) {
          toast.error("We couldn't upload your images right now 📸 Please try again or save without images for now");
          setIsSaving(false);
          return;
        }
      }

      // CREATE
      if (!editingProject) {
        if (formLanguage === "en") {
          const finalDataEn = {
            data: {
              productName: formData.productName_en,
              productDescription: formData.productDescription_en,
              Availability: formData.Availability,
              videoUrl: formData.videoUrl || undefined,
              locale: "en",
            },
          };
          
          if (uploadedFiles.length > 0) {
            const imagesIds = [];
            const originalImageNames = Array.isArray(formData.productImages) ? formData.productImages.map(f => f.name) : [];
            
            for (const f of uploadedFiles) {
              if (originalImageNames.includes(f.name)) {
                imagesIds.push(f.id);
              }
            }
            
            if (imagesIds.length > 0) {
              finalDataEn.data.productImages = imagesIds;
            }
          }
          
          if (formData.service_ajwains) {
            const serviceIds = formData.service_ajwains.toString()
              .split(',')
              .map(s => s.trim())
              .filter(s => s !== '')
              .map(s => parseInt(s))
              .filter(n => !isNaN(n));
            
            if (serviceIds.length > 0) {
              finalDataEn.data.service_ajwains = serviceIds;
            }
          }

          const enResp = await fetch(`${API_BASE}/api/product-ajwans?locale=en`, {
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
              productName: formData.productName_ar,
              productDescription: formData.productDescription_ar,
              Availability: formData.Availability,
              videoUrl: formData.videoUrl || undefined,
            },
          };
          
          if (uploadedFiles.length > 0) {
            const imagesIds = [];
            const originalImageNames = Array.isArray(formData.productImages) ? formData.productImages.map(f => f.name) : [];
            
            for (const f of uploadedFiles) {
              if (originalImageNames.includes(f.name)) {
                imagesIds.push(f.id);
              }
            }
            
            if (imagesIds.length > 0) {
              finalDataAr.data.productImages = imagesIds;
            }
          }
          
          if (formData.service_ajwains) {
            const serviceIds = formData.service_ajwains.toString()
              .split(',')
              .map(s => s.trim())
              .filter(s => s !== '')
              .map(s => parseInt(s))
              .filter(n => !isNaN(n));
            
            if (serviceIds.length > 0) {
              finalDataAr.data.service_ajwains = serviceIds;
            }
          }

          const arResp = await fetch(
            `${API_BASE}/api/product-ajwans/${selectedEnglishDocumentId}?locale=ar-SA`,
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
      }
      // UPDATE
      else {
        const updateProject = async (documentId, locale, data) => {
          if (!documentId) throw new Error("Document ID missing");
          console.log("Updating documentId:", documentId, "with locale:", locale, "and data:", data);

          const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));

          const response = await fetch(
            `${API_BASE}/api/product-ajwans/${documentId}?locale=${locale}`, {
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

        const getFinalProductImages = (existingImages) => {
          const keptImages = existingImages
            .filter(img => !existingMedia.imagesToDelete.includes(img.id))
            .map(img => img.id);
          const newImages = uploadedFiles
            .filter(f => formData.productImages.some(img => img.name === f.name))
            .map(f => f.id);
          return [...keptImages, ...newImages];
        };

        const targetDocumentId = editingProject.documentId;
        const targetLocale = editingProject.locale;

        if (!targetDocumentId) {
          toast.error("Hmm, something went wrong with the project ID 🤔 Please try refreshing and editing again");
          setIsSaving(false);
          return;
        }

        const finalData = {
          productName: formLanguage === "en" ? formData.productName_en : formData.productName_ar,
          productDescription: formLanguage === "en" ? formData.productDescription_en : formData.productDescription_ar,
          Availability: formData.Availability,
          videoUrl: formData.videoUrl || undefined,
          productImages: getFinalProductImages(editingProject.productImages || []),
          service_ajwains: formData.service_ajwains ? 
            formData.service_ajwains.toString()
              .split(',')
              .map(s => s.trim())
              .filter(s => s !== '')
              .map(s => parseInt(s))
              .filter(n => !isNaN(n)) : undefined
        };

        await updateProject(targetDocumentId, targetLocale, finalData);
      }

      // Success actions
      await loadProjects();
      setShowForm(false);
      setEditingProject(null);
      setExistingMedia({ 
        imageIds: [], 
        images: [], 
        imagesToDelete: []
      });
      
      if (editingProject) {
        toast.success("Perfect! Your project has been updated successfully 🎉");
      } else {
        toast.success("Great! Your new project has been created and saved 🎉");
      }
    } catch (error) {
      console.error("Error saving project:", error);
      if (error.message.includes('Authentication')) {
        toast.error("Your session expired 🔐 Please log in again to save your project");
      } else {
        toast.error("We couldn't save your project right now 😔 Please check your connection and try again");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProject = async (documentId) => {
    try {
      const result = await Swal.fire({
        title: "Are you sure about this?",
        text: "This will permanently delete your project and you won't be able to get it back! 💔",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, delete it",
        cancelButtonText: "Keep it safe",
        background: theme === 'dark' ? '#374151' : '#ffffff',
        color: theme === 'dark' ? '#f3f4f6' : '#1f2937',
      });

      if (!result.isConfirmed) return;

      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("You need to be logged in to delete projects 🔐 Please sign in and try again");
        return;
      }

      const response = await fetch(`${API_BASE}/api/product-ajwans/${documentId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to delete project");

      // Update UI after deletion
      setProjects((prev) => prev.filter((project) => project.documentId !== documentId));

      toast.success("All done! Your project has been deleted 🗑️");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("We couldn't delete your project right now 😔 Please try again in a moment");
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

  const normalizeImages = (productImages) => {
    if (!productImages) return [];
    if (productImages.data) {
      return productImages.data.map((img) => {
        const rawUrl = img.attributes?.url;
        if (!rawUrl) return null;
        return {
          id: img.id,
          url: rawUrl.startsWith("http") ? rawUrl : `${API_BASE}${rawUrl}`,
          name: img.attributes?.name,
        };
      }).filter(Boolean);
    }
    return productImages.map((img) => {
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('manage_projects')}</h1>
            <p className="text-gray-600 mt-1 dark:text-gray-400">{t('manage_projects_desc')}</p>
          </div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={() => startAddProject('en')}
              className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('add_new_project')} (EN)
            </Button>
            <Button
              onClick={() => startAddProject('ar')}
              className="ml-2 bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-700 dark:hover:bg-emerald-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('add_new_project')} (AR)
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
                    <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t('image')}</th>
                    <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t('project_name')}</th>
                    <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t('description')}</th>
                    <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t('availability')}</th>
                    <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-center`}>
                      {t('video')}
                    </th>
                    <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t('created_at')}</th>
                    <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${language === 'ar' ? 'text-center' : 'text-center'}`}>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filteredProjects.map((project, index) => (
                      <motion.tr
                        key={project.id || index}
                        variants={tableRowVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        whileHover="hover"
                        transition={{ delay: index * 0.1 }}
                        className="border-b border-gray-100 dark:border-gray-700"
                      >
                        <td className="py-4 px-4">
                          {project.productImages && project.productImages.length > 0 ? (
                            <img
                              src={getMediaUrl(project.productImages[0])}
                              alt="project"
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
                            {project.productName || '-'}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">
                            {project.productDescription || '-'}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge className={`${project.Availability ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'} border-0`}>
                            {project.Availability ? t('available') : t('unavailable')}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-center">
                          {project.videoUrl ? (
                            <a 
                              href={project.videoUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:text-blue-700 flex items-center justify-center"
                            >
                              <Video className="w-4 h-4 mr-1" />
                              {t('view_video')}
                            </a>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-gray-500 dark:text-gray-400">
                          {project.createdAt || '-'}
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
                              onClick={() => handleDeleteProject(project.documentId)}
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
                {formLanguage === 'en' && (
                  <div className="space-y-4 mt-2">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <Label htmlFor="productName_en" className="dark:text-gray-200">{t('project_name')} (English)</Label>
                      <Input
                        id="productName_en"
                        value={formData.productName_en}
                        onChange={(e) => setFormData({ ...formData, productName_en: e.target.value })}
                        placeholder="What would you like to call your project?"
                        className="mt-1 transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Label htmlFor="productDescription_en" className="dark:text-gray-200">{t('project_description')} (English)</Label>
                      <Textarea
                        id="productDescription_en"
                        value={formData.productDescription_en}
                        onChange={(e) => setFormData({ ...formData, productDescription_en: e.target.value })}
                        placeholder="Tell us about your project! What makes it special?"
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
                      <Label htmlFor="link_en" className="dark:text-gray-200">{t('link_to_english_project')}</Label>
                      <select
                        id="link_en"
                        className="mt-1 w-full rounded border border-gray-300 p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                        value={selectedEnglishDocumentId}
                        onChange={(e) => handleEnglishProjectSelect(e.target.value)}
                      >
                        <option value="">Which English project should this be linked to?</option>
                        {englishProjectsForDropdown.map((opt) => (
                          <option key={opt.documentId} value={opt.documentId}>
                            {opt.productName || `#${opt.id}`}
                          </option>
                        ))}
                      </select>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <Label htmlFor="productName_ar" className="dark:text-gray-200">{t('project_name')} (العربية)</Label>
                      <Input
                        id="productName_ar"
                        value={formData.productName_ar}
                        onChange={(e) => setFormData({ ...formData, productName_ar: e.target.value })}
                        placeholder="ما اسم مشروعك؟"
                        className="mt-1 transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                        dir="rtl"
                      />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                    >
                      <Label htmlFor="productDescription_ar" className="dark:text-gray-200">{t('project_description')} (العربية)</Label>
                      <Textarea
                        id="productDescription_ar"
                        value={formData.productDescription_ar}
                        onChange={(e) => setFormData({ ...formData, productDescription_ar: e.target.value })}
                        placeholder="أخبرنا عن مشروعك! ما الذي يجعله مميزاً؟"
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
                  transition={{ delay: 0.3 }}
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

                {/* Video URL Field */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Label htmlFor="videoUrl" className="dark:text-gray-200 flex items-center">
                    <Video className="w-4 h-4 mr-2" />
                    {t('video_url')}
                  </Label>
                  <Input
                    id="videoUrl"
                    type="url"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    placeholder="Got a video? Paste the link here! (YouTube, Vimeo, etc.)"
                    className="mt-1 transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                  <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">
                    You can add a video URL from YouTube, Vimeo, or any other platform 🎬
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Label htmlFor="productImages" className="dark:text-gray-200">{t("project_images")}</Label>
                  <div className="mt-1 flex items-center space-x-2">
                    <Input
                      id="productImages"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleFileChange(e, 'productImages')}
                      className="flex-grow transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                    {Array.isArray(formData.productImages) && formData.productImages.length > 0 && (
                      <span className="text-sm text-green-600 dark:text-green-400">📸 {formData.productImages.length} image(s) ready to upload!</span>
                    )}
                  </div>

                  {/* Show new selected images */}
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

                  {/* Show existing images with delete option */}
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

                {/* <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Label htmlFor="service_ajwains" className="dark:text-gray-200">{t("related_services")}</Label>
                  <Input
                    id="service_ajwains"
                    value={formData.service_ajwains}
                    onChange={(e) => setFormData({ ...formData, service_ajwains: e.target.value })}
                    placeholder="Enter service IDs separated by commas (e.g., 1, 2, 3)"
                    className="mt-1 transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                </motion.div> */}
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
                    {isSaving ? 'Saving your project... ⏳' : (editingProject ? 'Save Changes ✨' : 'Create Project 🚀')}
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

export default ProjectsManager;