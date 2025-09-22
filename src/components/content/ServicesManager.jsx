import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, X, Loader2, Video, Link } from "lucide-react";
import Swal from "sweetalert2";
import {
    Plus,
    Edit,
    Trash2,
    Search,
    Save,
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
import { cn } from "@/lib/utils";
import { PageLoader, InlineLoader, CardLoader, ButtonLoader } from '../ui/Loader';
import { SuccessAlert, ErrorAlert } from '../ui/Alert';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationContainer } from '../ui/NotificationContainer';

import { getApiUrl } from '../../config/api';

// Use environment variable for API base URL
const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:1337';
console.log("API_BASE:", API_BASE);

const ServicesManager = () => {
    const { t, language } = useLanguage();
    const { theme } = useTheme();
    const { notifications, showSuccess, showError, removeNotification } = useNotifications();

    const [services, setServices] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [activeTab, setActiveTab] = useState('en');
    const [formData, setFormData] = useState({
        ServiceTitle_en: '',
        ServiceTitle_ar: '',
        serviceDescription_en: '',
        serviceDescription_ar: '',
        ServiceImages: [],
        ServiceIcon: null,
        product_ajwans: '',
        service_items: '',
        videoUrl: ''
    });
    const [existingMedia, setExistingMedia] = useState({
        imageIds: [],
        iconId: null,
        images: [],
        icon: null,
        imagesToDelete: []
    });

    const [formLanguage, setFormLanguage] = useState(language); // 'en' | 'ar'
    const [englishServicesForDropdown, setEnglishServicesForDropdown] = useState([]);
    const [selectedEnglishDocumentId, setSelectedEnglishDocumentId] = useState('');
    const [editingServiceId, setEditingServiceId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [formErrors, setFormErrors] = useState({}); // حالة جديدة لأخطاء النموذج
    const [status, setStatus] = useState('published'); // حالة النشر: published أو draft

    // States جديدة للـ Dropdowns
    const [serviceItems, setServiceItems] = useState([]);
    const [projects, setProjects] = useState([]);
    const [selectedServiceItems, setSelectedServiceItems] = useState([]);
    const [selectedProjects, setSelectedProjects] = useState([]);
    const [openServiceItems, setOpenServiceItems] = useState(false);
    const [openProjects, setOpenProjects] = useState(false);

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

    // دالة لجلب Service Items
    const fetchServiceItems = async () => {
        try {
            const lang = language === 'ar' ? 'ar-SA' : 'en';
            const response = await fetch(
                `${API_BASE}/api/service-items?populate=*&locale=${lang}`
            );
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            const formattedItems = data.data.map(item => ({
                id: item.id,
                name: item.attributes?.name || item.name || `Service Item #${item.id}`,
                documentId: item.attributes?.documentId || item.documentId
            }));
            
            setServiceItems(formattedItems);
        } catch (error) {
            console.error("Error fetching service items:", error);
            toast.error("Error loading service items");
        }
    };

    // دالة لجلب Projects
    const fetchProjects = async () => {
        try {
            const lang = language === 'ar' ? 'ar-SA' : 'en';
            const response = await fetch(
                `${API_BASE}/api/product-ajwans?populate=*&locale=${lang}`
            );
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log("📦 Fetched projects:", data);
            const formattedProjects = data.data.map(project => ({
                id: project.id,
                name: project.attributes?.productName || project.productName || `Project #${project.id}`,
                documentId: project.attributes?.documentId || project.documentId
            }));
            
            setProjects(formattedProjects);
        } catch (error) {
            console.error("Error fetching projects:", error);
            toast.error("Error loading projects");
        }
    };

    // دالة محسنة لجلب الخدمات
    const loadServices = async () => {
        setIsLoading(true);
        let lang = language || 'en';

        if (lang === 'ar') {
            lang = 'ar-SA';
        }

        console.log("🌍 Current language:", lang);

        try {
            const response = await fetch(
                `${API_BASE}/api/service-ajwains?populate=*&locale=${lang}`
            );
            console.log("response", response);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log("📦 Fetched services:", data);

            const formatted = data.data.map(item => {
                const attrs = item.attributes || item;
                return {
                    id: item.id,
                    documentId: attrs.documentId,
                    ServiceTitle: attrs.ServiceTitle,
                    serviceDescription: attrs.serviceDescription,
                    locale: attrs.locale,
                    ServiceImages: normalizeImages(attrs.ServiceImages),
                    ServiceIcon: normalizeImage(attrs.ServiceIcon),
                    product_ajwans: attrs.product_ajwans?.data || attrs.product_ajwans || [],
                    service_items: attrs.service_items?.data || attrs.service_items || [],
                    createdAt: attrs.createdAt || item.createdAt,
                    videoUrl: attrs.videoUrl || '',
                    publishedAt: attrs.publishedAt,
                    status: attrs.publishedAt ? 'published' : 'draft'
                };
            });

            setServices(formatted);
        } catch (err) {
            console.error("Error loading services:", err);
            toast.error("Error loading services");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadServices();
        fetchServiceItems();
        fetchProjects();
    }, [language]);

    const filteredServices = services.filter(service =>
        service.ServiceTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.serviceDescription.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // New: start add flow with specific language
    const startAddService = async (lang) => {
        setEditingService(null);
        setFormLanguage(lang);
        setFormErrors({}); // مسح الأخطاء عند البدء
        
        setFormData({
            ServiceTitle_en: '',
            ServiceTitle_ar: '',
            serviceDescription_en: '',
            serviceDescription_ar: '',
            ServiceImages: [],
            ServiceIcon: null,
            product_ajwans: '',
            service_items: '',
            videoUrl: ''
        });
        setExistingMedia({ 
            imageIds: [], 
            iconId: null, 
            images: [], 
            icon: null, 
            imagesToDelete: [] 
        });
        setSelectedEnglishDocumentId('');
        setSelectedServiceItems([]);
        setSelectedProjects([]);
        setStatus('published');

        if (lang === 'ar') {
            try {
                const response = await fetch(
                    `${API_BASE}/api/service-ajwains?locale=en&populate=*`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`,
                        },
                    }
                );
                const data = await response.json();

                console.log("📌 English Services Response:", data);

                setEnglishServicesForDropdown(data.data || []);
            } catch (error) {
                console.error("Error loading English services:", error);
            }
        }

        setShowForm(true);
    };

    const handleEnglishServiceSelect = (docId) => {
        setSelectedEnglishDocumentId(docId);

        const selectedService = services.find(
            (service) => service.documentId === docId
        );

        if (selectedService) {
            const images = normalizeImages(selectedService.ServiceImages);
            const icon = normalizeImage(selectedService.ServiceIcon);
            setExistingMedia({
                imageIds: images.map((img) => img.id),
                iconId: icon?.id || null,
                images,
                icon,
                imagesToDelete: [],
            });
            
            // تعبئة بيانات الفيديو إذا كانت موجودة
            setFormData(prev => ({
                ...prev,
                videoUrl: selectedService.videoUrl || ''
            }));
            
            setStatus(selectedService.status || 'published');
        }
    };

    const handleEditService = (service) => {
        setEditingService(service);
        setFormErrors({}); // مسح الأخطاء عند التعديل
        
        const imagesArray = normalizeImages(service.ServiceImages);
        const iconObj = normalizeImage(service.ServiceIcon);
        const imageIds = imagesArray.map(i => i.id).filter(Boolean);
        const iconId = iconObj?.id || null;

        setExistingMedia({
            imageIds,
            iconId,
            images: imagesArray,
            icon: iconObj,
            imagesToDelete: []
        });

        setFormData({
            ServiceTitle_en: service.ServiceTitle || '',
            ServiceTitle_ar: service.ServiceTitle || '',
            serviceDescription_en: service.serviceDescription || '',
            serviceDescription_ar: service.serviceDescription || '',
            ServiceImages: [],
            ServiceIcon: null,
            product_ajwans: '',
            service_items: '',
            videoUrl: service.videoUrl || ''
        });
        
        // تهيئة القيم المختارة في dropdowns
        setSelectedProjects(service.product_ajwans.map(p => ({ 
            id: p.id, 
            name: p.attributes?.productName || p.productName || `Project #${p.id}` 
        })) || []);
        
        setSelectedServiceItems(service.service_items.map(i => ({ 
            id: i.id, 
            name: i.attributes?.name || i.name || `Service Item #${i.id}` 
        })) || []);
        
        setStatus(service.status || 'published');
        setShowForm(true);
    };

    const handleFileChange = (e, fieldName) => {
        const files = Array.from(e.target.files);
        setFormData(prev => ({
            ...prev,
            [fieldName]: fieldName === 'ServiceImages' ? [...prev[fieldName], ...files] : files[0]
        }));
        
        // مسح خطأ الحقل عند اختيار ملف
        if (formErrors[fieldName]) {
            setFormErrors(prev => ({ ...prev, [fieldName]: '' }));
        }
    };

    const handleRemoveExistingImage = (imageId) => {
        setExistingMedia(prev => ({
            ...prev,
            images: prev.images.filter(img => img.id !== imageId),
            imagesToDelete: [...prev.imagesToDelete, imageId]
        }));
    };

    const handleRemoveExistingIcon = () => {
        setExistingMedia(prev => ({
            ...prev,
            icon: null,
            iconId: null
        }));
    };

    const handleRemoveNewImage = (index) => {
        setFormData(prev => ({
            ...prev,
            ServiceImages: prev.ServiceImages.filter((_, i) => i !== index)
        }));
    };

    const handleRemoveNewIcon = () => {
        setFormData(prev => ({
            ...prev,
            ServiceIcon: null
        }));
    };

    // دالة للتحقق من صحة النموذج
    const validateForm = () => {
        const errors = {};
        
        if (formLanguage === "en") {
            if (!formData.ServiceTitle_en?.trim()) {
                errors.ServiceTitle_en = language === 'ar' ? "يرجى إدخال عنوان الخدمة بالإنجليزية" : "Please enter service title in English";
            } else if (formData.ServiceTitle_en.trim().length < 3) {
                errors.ServiceTitle_en = language === 'ar' ? "العنوان يجب أن يكون على الأقل 3 أحرف" : "Title must be at least 3 characters";
            }
            
            if (!formData.serviceDescription_en?.trim()) {
                errors.serviceDescription_en = language === 'ar' ? "يرجى إدخال وصف الخدمة بالإنجليزية" : "Please enter service description in English";
            }
        } else if (formLanguage === "ar") {
            if (!formData.ServiceTitle_ar?.trim()) {
                errors.ServiceTitle_ar = language === 'ar' ? "يرجى إدخال عنوان الخدمة بالعربية" : "Please enter service title in Arabic";
            } else if (formData.ServiceTitle_ar.trim().length < 3) {
                errors.ServiceTitle_ar = language === 'ar' ? "العنوان يجب أن يكون على الأقل 3 أحرف" : "Title must be at least 3 characters";
            }
            
            if (!formData.serviceDescription_ar?.trim()) {
                errors.serviceDescription_ar = language === 'ar' ? "يرجى إدخال وصف الخدمة بالعربية" : "Please enter service description in Arabic";
            }
            
            if (!editingService && !selectedEnglishDocumentId) {
                errors.englishService = language === 'ar' ? "يرجى اختيار الخدمة الإنجليزية المرتبطة" : "Please select the related English service";
            }
        }
        
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSaveService = async () => {
        if (isSaving) return;
        
        // التحقق من صحة النموذج أولاً
        if (!validateForm()) {
            toast.error(language === 'ar' ? "يرجى تصحيح الأخطاء في النموذج" : "Please correct the errors in the form");
            return;
        }
        
        setIsSaving(true);

        try {
            const TOKEN = getValidToken();
            if (!TOKEN) throw new Error("❌ Authentication token missing");

            // تحويل البيانات المختارة إلى تنسيق API
            const productAjwansIds = selectedProjects.map(project => project.id || project);
            const serviceItemsIds = selectedServiceItems.map(item => item.id || item);
            

            // ✅ رفع الصور الجديدة
            let uploadedFiles = [];
            const filesToUpload = [];
            
            if (formData.ServiceImages && formData.ServiceImages.length > 0) {
                formData.ServiceImages.forEach((file) => {
                    if (file instanceof File) {
                        filesToUpload.push(file);
                    }
                });
            }
            if (formData.ServiceIcon && formData.ServiceIcon instanceof File) {
                filesToUpload.push(formData.ServiceIcon);
            }

            if (filesToUpload.length > 0) {
                const uploadFormData = new FormData();
                filesToUpload.forEach((file) => {
                    uploadFormData.append("files", file);
                });

                const uploadResponse = await fetch(`${API_BASE}/api/upload`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${TOKEN}` },
                    body: uploadFormData,
                });
                await checkResponse(uploadResponse);
                uploadedFiles = await uploadResponse.json();
            }

            // ----------------- ✅ CREATE -----------------
            if (!editingService) {
                if (formLanguage === "en") {
                    const finalDataEn = {
                        data: {
                            ServiceTitle: formData.ServiceTitle_en,
                            serviceDescription: formData.serviceDescription_en,
                            locale: "en",
                            product_ajwans: productAjwansIds,
                            service_items: serviceItemsIds,
                            videoUrl: formData.videoUrl || undefined,
                            publishedAt: status === 'published' ? new Date().toISOString() : null
                        },
                    };

                    // Handle images
                    if (uploadedFiles.length > 0) {
                        const imageFiles = uploadedFiles.filter(f => 
                            formData.ServiceImages.some(img => img.name === f.name)
                        );
                        const iconFile = uploadedFiles.find(f => 
                            formData.ServiceIcon && formData.ServiceIcon.name === f.name
                        );
                        
                        if (imageFiles.length > 0) {
                            finalDataEn.data.ServiceImages = imageFiles.map(f => f.id);
                        }
                        if (iconFile) {
                            finalDataEn.data.ServiceIcon = iconFile.id;
                        }
                    }

                    const enResp = await fetch(`${API_BASE}/api/service-ajwains?locale=en`, {
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
                            ServiceTitle: formData.ServiceTitle_ar,
                            serviceDescription: formData.serviceDescription_ar,
                            product_ajwans: productAjwansIds,
                            service_items: serviceItemsIds,
                            videoUrl: formData.videoUrl || undefined,
                            publishedAt: status === 'published' ? new Date().toISOString() : null
                        },
                    };

                    // Handle images
                    if (uploadedFiles.length > 0) {
                        const imageFiles = uploadedFiles.filter(f => 
                            formData.ServiceImages.some(img => img.name === f.name)
                        );
                        const iconFile = uploadedFiles.find(f => 
                            formData.ServiceIcon && formData.ServiceIcon.name === f.name
                        );
                        
                        if (imageFiles.length > 0) {
                            finalDataAr.data.ServiceImages = imageFiles.map(f => f.id);
                        }
                        if (iconFile) {
                            finalDataAr.data.ServiceIcon = iconFile.id;
                        }
                    }

                    const arResp = await fetch(
                        `${API_BASE}/api/service-ajwains/${selectedEnglishDocumentId}?locale=ar-SA`,
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
            // ----------------- ✅ UPDATE -----------------
            else {
                const getFinalImages = (existingImages) => {
                    const keptImages = existingImages
                        .filter(img => !existingMedia.imagesToDelete.includes(img.id))
                        .map(img => img.id);
                    const newImages = uploadedFiles
                        .filter(f => formData.ServiceImages.some(img => img.name === f.name))
                        .map(f => f.id);
                    return [...keptImages, ...newImages];
                };

                const getFinalIcon = () => {
                    if (formData.ServiceIcon instanceof File) {
                        const iconFile = uploadedFiles.find(f => f.name === formData.ServiceIcon.name);
                        return iconFile ? iconFile.id : existingMedia.iconId;
                    }
                    return existingMedia.iconId;
                };

                const targetDocumentId = editingService.documentId;
                const targetLocale = editingService.locale;

                if (!targetDocumentId) {
                    toast.error(language === 'ar' ? "⚠️ Document ID مفقود. برجاء إعادة المحاولة." : "⚠️ Document ID missing. Please try again.");
                    setIsSaving(false);
                    return;
                }

                const finalData = {
                    ServiceTitle: formLanguage === "en" ? formData.ServiceTitle_en : formData.ServiceTitle_ar,
                    serviceDescription: formLanguage === "en" ? formData.serviceDescription_en : formData.serviceDescription_ar,
                    ServiceImages: getFinalImages(editingService.ServiceImages || []),
                    ServiceIcon: getFinalIcon(),
                    product_ajwans: productAjwansIds,
                    service_items: serviceItemsIds,
                    videoUrl: formData.videoUrl || undefined,
                    publishedAt: status === 'published' ? new Date().toISOString() : null
                };

                const updateResponse = await fetch(
                    `${API_BASE}/api/service-ajwains/${targetDocumentId}?locale=${targetLocale}`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${TOKEN}`,
                        },
                        body: JSON.stringify({ data: finalData }),
                    }
                );
                await checkResponse(updateResponse);
            }

            // ✅ بعد الحفظ
            await loadServices();
            setShowForm(false);
            setEditingService(null);
            setExistingMedia({ 
                imageIds: [], 
                iconId: null, 
                images: [], 
                icon: null, 
                imagesToDelete: [] 
            });
            setSelectedServiceItems([]);
            setSelectedProjects([]);
            toast.success(language === 'ar' ? "تم حفظ الخدمة بنجاح" : "Service saved successfully");
        } catch (error) {
            console.error("Error saving service:", error);
            toast.error(language === 'ar' ? "حدث خطأ أثناء الحفظ" : "Error while saving");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteService = async (documentId) => {
        try {
            const result = await Swal.fire({
                title: language === 'ar' ? "هل أنت متأكد؟" : "Are you sure?",
                text: language === 'ar' ? "لن تستطيع التراجع عن هذا الحذف!" : "You won't be able to revert this!",
                icon: "warning",
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
                Swal.fire("Error", language === 'ar' ? "Token غير موجود، يرجى تسجيل الدخول" : "Token not found, please login", "error");
                return;
            }

            const response = await fetch(`${API_BASE}/api/service-ajwains/${documentId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error(language === 'ar' ? "حدث خطأ أثناء حذف الخدمة" : "Error deleting service");

            setServices((prev) => prev.filter((service) => service.documentId !== documentId));

            Swal.fire(
                language === 'ar' ? "تم الحذف!" : "Deleted!",
                language === 'ar' ? "تم حذف الخدمة بنجاح." : "Service has been deleted.",
                "success"
            );
        } catch (error) {
            console.error("Delete error:", error);
            Swal.fire(
                language === 'ar' ? "خطأ" : "Error",
                language === 'ar' ? "فشل الحذف، حاول مرة أخرى" : "Delete failed, please try again",
                "error"
            );
        } finally {
            setDeletingId(null);
        }
    };

    const getMediaUrl = (media) => {
        if (!media) return null;

        // معالجة مختلف أشكال البيانات
        let url;
        if (media.attributes?.url) {
            url = media.attributes.url;
        } else if (media.url) {
            url = media.url;
        } else if (media.formats) {
            // إذا كانت الوسائط تحتوي على تنسيقات مختلفة
            url = media.formats.thumbnail?.url || 
                  media.formats.small?.url || 
                  media.formats.medium?.url || 
                  media.url;
        } else if (media.data?.attributes?.url) {
            // معالجة الحالة عندما تكون الأيقونة داخل كائن data
            url = media.data.attributes.url;
        } else if (media.data?.url) {
            url = media.data.url;
        }
        
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
                    onError={(e) => {
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg="64" height="64" fill="#F3F4F6"/><path d="M32 16V48" stroke="#9A9A9A" stroke-width="2" stroke-linecap="round"/><path d="M16 32H48" stroke="#9A9A9A" stroke-width="2" stroke-linecap="round"/></svg>';
                    }}
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
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: "easeOut" }
        }
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

    const normalizeImages = (imgData) => {
        if (!imgData) return [];
        if (imgData.data) {
            return imgData.data.map((img) => {
                const rawUrl = img.attributes?.url;
                if (!rawUrl) return null;
                return {
                    id: img.id,
                    url: rawUrl.startsWith("http") ? rawUrl : `${API_BASE}${rawUrl}`,
                    name: img.attributes?.name,
                };
            }).filter(Boolean);
        }
        if (Array.isArray(imgData)) {
            return imgData.map((img) => {
                if (!img.url) return null;
                return {
                    id: img.id,
                    url: img.url.startsWith("http") ? img.url : `${API_BASE}${img.url}`,
                    name: img.name,
                };
            }).filter(Boolean);
        }
        return [];
    };

    const normalizeImage = (imgData) => {
        if (!imgData) return null;
        if (imgData.data) {
            const img = imgData.data;
            const rawUrl = img.attributes?.url;
            if (!rawUrl) return null;
            return {
                id: img.id,
                url: rawUrl.startsWith("http") ? rawUrl : `${API_BASE}${rawUrl}`,
                name: img.attributes?.name,
            };
        }
        if (imgData.url) {
            return {
                id: imgData.id,
                url: imgData.url.startsWith("http") ? imgData.url : `${API_BASE}${imgData.url}`,
                name: imgData.name,
            };
        }
        return null;
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
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {language === 'ar' ? 'إدارة الخدمات' : 'Manage Services'}
                        </h1>
                        <p className="text-gray-600 mt-1 dark:text-gray-400">
                            {language === 'ar' ? 'إدارة وتحديث الخدمات المقدمة' : 'Manage and update provided services'}
                        </p>
                    </div>
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Button
                            onClick={() => startAddService('en')}
                            className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            {language === 'ar' ? 'إضافة خدمة جديدة (EN)' : 'Add New Service (EN)'}
                        </Button>
                        <Button
                            onClick={() => startAddService('ar')}
                            className="ml-2 bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-700 dark:hover:bg-emerald-800"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            {language === 'ar' ? 'إضافة خدمة جديدة (AR)' : 'Add New Service (AR)'}
                        </Button>
                    </motion.div>
                </div>
            </motion.div>

            <motion.div variants={itemVariants}>
                <Card className="shadow-sm border-0 dark:bg-gray-800 dark:text-white">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="dark:text-white">
                                {language === 'ar' ? 'قائمة الخدمات' : 'Services List'}
                            </CardTitle>
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder={language === 'ar' ? 'بحث الخدمات...' : 'Search services...'}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <CardLoader message={language === 'ar' ? 'جاري تحميل البيانات...' : 'Loading data...'} />
                        ) : filteredServices.length === 0 ? (
                            // عرض رسالة عدم وجود بيانات
                            <div className="text-center py-10">
                                <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                                    {language === 'ar' ? 'لا توجد خدمات' : 'No services'}
                                </h3>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    {searchTerm 
                                        ? (language === 'ar' ? 'لم يتم العثور على خدمات تطابق بحثك.' : 'No services found matching your search.')
                                        : (language === 'ar' ? 'لا توجد بيانات متاحة حاليًا. يمكنك إضافة خدمة جديدة من خلال الزر أعلاه.' : 'No data available currently. You can add a new service using the buttons above.')
                                    }
                                </p>
                                {!searchTerm && (
                                    <div className="mt-6">
                                        <Button
                                            onClick={() => startAddService('en')}
                                            className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            {language === 'ar' ? 'إضافة خدمة جديدة (EN)' : 'Add New Service (EN)'}
                                        </Button>
                                        <Button
                                            onClick={() => startAddService('ar')}
                                            className="ml-2 bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-700 dark:hover:bg-emerald-800"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            {language === 'ar' ? 'إضافة خدمة جديدة (AR)' : 'Add New Service (AR)'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // عرض الجدول عند وجود بيانات
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200 dark:border-gray-700">
                                            <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                                                {language === 'ar' ? 'العنوان' : 'Title'}
                                            </th>
                                            <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                                                {language === 'ar' ? 'الوصف' : 'Description'}
                                            </th>
                                            <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-center`}>
                                                {language === 'ar' ? 'الفيديو' : 'Video'}
                                            </th>
                                            <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-center`}>
                                                {language === 'ar' ? 'الحالة' : 'Status'}
                                            </th>
                                            <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                                                {language === 'ar' ? 'تاريخ الإنشاء' : 'Created At'}
                                            </th>
                                            <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${language === 'ar' ? 'text-center' : 'text-center'}`}>
                                                {language === 'ar' ? 'الإجراءات' : 'Actions'}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <AnimatePresence>
                                            {filteredServices.map((service, index) => (
                                                <motion.tr
                                                    key={service.id || index}
                                                    variants={tableRowVariants}
                                                    initial="hidden"
                                                    animate="visible"
                                                    exit="hidden"
                                                    whileHover="hover"
                                                    transition={{ delay: index * 0.1 }}
                                                    className="border-b border-gray-100 dark:border-gray-700"
                                                >
                                                    <td className="py-4 px-4">
                                                        <div className="font-medium text-gray-900 dark:text-white">
                                                            {service.ServiceTitle || '-'}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">
                                                            {service.serviceDescription || '-'}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        {service.videoUrl ? (
                                                            <a 
                                                                href={service.videoUrl} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="text-blue-500 hover:text-blue-700 flex items-center justify-center"
                                                            >
                                                                <Video className="w-4 h-4 mr-1" />
                                                                {language === 'ar' ? 'عرض الفيديو' : 'View Video'}
                                                            </a>
                                                        ) : (
                                                            <span className="text-gray-400 text-sm">-</span>
                                                        )}
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <Badge 
                                                            className={service.status === 'published' 
                                                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" 
                                                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                                                            }
                                                        >
                                                            {service.status === 'published' 
                                                                ? (language === 'ar' ? 'منشور' : 'Published') 
                                                                : (language === 'ar' ? 'مسودة' : 'Draft')
                                                            }
                                                        </Badge>
                                                    </td>
                                                    <td className="py-4 px-4 text-gray-500 dark:text-gray-400">
                                                        {formatDate(service.createdAt)}
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center justify-center space-x-2">
                                                            <motion.button
                                                                whileHover={{ scale: 1.1 }}
                                                                whileTap={{ scale: 0.9 }}
                                                                onClick={() => handleEditService(service)}
                                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors dark:hover:bg-gray-700"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </motion.button>
                                                            <motion.button
                                                                whileHover={{ scale: 1.1 }}
                                                                whileTap={{ scale: 0.9 }}
                                                                onClick={() => handleDeleteService(service.documentId)}
                                                                disabled={deletingId === service.documentId}
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-gray-700 disabled:opacity-50"
                                                            >
                                                                {deletingId === service.documentId ? (
                                                                    <InlineLoader size="small" />
                                                                ) : (
                                                                    <Trash2 className="w-4 h-4" />
                                                                )}
                                                            </motion.button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))}
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
                                    {editingService 
                                        ? (language === 'ar' ? 'تعديل الخدمة' : 'Edit Service') 
                                        : (language === 'ar' ? 'إضافة خدمة جديدة' : 'Add New Service')
                                    }
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
                                    <Label htmlFor="status" className="dark:text-gray-200">
                                        {language === 'ar' ? 'الحالة' : 'Status'}
                                    </Label>
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
                                            <Label htmlFor="ServiceTitle_en" className="dark:text-gray-200">
                                                {language === 'ar' ? 'عنوان الخدمة (إنجليزي)' : 'Service Title (English)'}
                                            </Label>
                                            <Input
                                                id="ServiceTitle_en"
                                                value={formData.ServiceTitle_en}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, ServiceTitle_en: e.target.value });
                                                    if (formErrors.ServiceTitle_en) {
                                                        setFormErrors({ ...formErrors, ServiceTitle_en: '' });
                                                    }
                                                }}
                                                placeholder={language === 'ar' ? 'أدخل عنوان الخدمة بالإنجليزية' : 'Enter service title in English'}
                                                className={`mt-1 transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                                                    formErrors.ServiceTitle_en ? 'border-red-500 focus:ring-red-500' : ''
                                                }`}
                                            />
                                            {formErrors.ServiceTitle_en && (
                                                <p className="text-red-500 text-sm mt-1">{formErrors.ServiceTitle_en}</p>
                                            )}
                                        </motion.div>
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                        >
                                            <Label htmlFor="serviceDescription_en" className="dark:text-gray-200">
                                                {language === 'ar' ? 'وصف الخدمة (إنجليزي)' : 'Service Description (English)'}
                                            </Label>
                                            <Textarea
                                                id="serviceDescription_en"
                                                value={formData.serviceDescription_en}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, serviceDescription_en: e.target.value });
                                                    if (formErrors.serviceDescription_en) {
                                                        setFormErrors({ ...formErrors, serviceDescription_en: '' });
                                                    }
                                                }}
                                                placeholder={language === 'ar' ? 'أدخل وصف الخدمة بالإنجليزية' : 'Enter service description in English'}
                                                rows={4}
                                                className={`mt-1 transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                                                    formErrors.serviceDescription_en ? 'border-red-500 focus:ring-red-500' : ''
                                                }`}
                                            />
                                            {formErrors.serviceDescription_en && (
                                                <p className="text-red-500 text-sm mt-1">{formErrors.serviceDescription_en}</p>
                                            )}
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
                                            <Label htmlFor="link_en" className="dark:text-gray-200">
                                                {language === 'ar' ? 'ربط بالخدمة الإنجليزية' : 'Link to English Service'}
                                            </Label>
                                            <Select
                                                value={selectedEnglishDocumentId}
                                                onValueChange={(value) => {
                                                    handleEnglishServiceSelect(value);
                                                    if (formErrors.englishService) {
                                                        setFormErrors({ ...formErrors, englishService: '' });
                                                    }
                                                }}
                                            >
                                                <SelectTrigger className={`w-full dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                                                    formErrors.englishService ? 'border-red-500 focus:ring-red-500' : ''
                                                }`}>
                                                    <SelectValue placeholder={language === 'ar' ? 'اختر الخدمة الإنجليزية' : 'Select English service'} />
                                                </SelectTrigger>
                                                <SelectContent className="dark:bg-gray-700 dark:text-white">
                                                    {englishServicesForDropdown.map((opt) => (
                                                        <SelectItem key={opt.documentId} value={opt.documentId}>
                                                            {opt.ServiceTitle || `#${opt.id}`}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {formErrors.englishService && (
                                                <p className="text-red-500 text-sm mt-1">{formErrors.englishService}</p>
                                            )}
                                        </motion.div>
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 }}
                                        >
                                            <Label htmlFor="ServiceTitle_ar" className="dark:text-gray-200">
                                                {language === 'ar' ? 'عنوان الخدمة (عربي)' : 'Service Title (Arabic)'}
                                            </Label>
                                            <Input
                                                id="ServiceTitle_ar"
                                                value={formData.ServiceTitle_ar}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, ServiceTitle_ar: e.target.value });
                                                    if (formErrors.ServiceTitle_ar) {
                                                        setFormErrors({ ...formErrors, ServiceTitle_ar: '' });
                                                    }
                                                }}
                                                placeholder={language === 'ar' ? 'أدخل عنوان الخدمة بالعربية' : 'Enter service title in Arabic'}
                                                className={`mt-1 transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                                                    formErrors.ServiceTitle_ar ? 'border-red-500 focus:ring-red-500' : ''
                                                }`}
                                                dir="rtl"
                                            />
                                            {formErrors.ServiceTitle_ar && (
                                                <p className="text-red-500 text-sm mt-1">{formErrors.ServiceTitle_ar}</p>
                                            )}
                                        </motion.div>
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.15 }}
                                        >
                                            <Label htmlFor="serviceDescription_ar" className="dark:text-gray-200">
                                                {language === 'ar' ? 'وصف الخدمة (عربي)' : 'Service Description (Arabic)'}
                                            </Label>
                                            <Textarea
                                                id="serviceDescription_ar"
                                                value={formData.serviceDescription_ar}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, serviceDescription_ar: e.target.value });
                                                    if (formErrors.serviceDescription_ar) {
                                                        setFormErrors({ ...formErrors, serviceDescription_ar: '' });
                                                    }
                                                }}
                                                placeholder={language === 'ar' ? 'أدخل وصف الخدمة بالعربية' : 'Enter service description in Arabic'}
                                                rows={4}
                                                className={`mt-1 transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                                                    formErrors.serviceDescription_ar ? 'border-red-500 focus:ring-red-500' : ''
                                                }`}
                                                dir="rtl"
                                            />
                                            {formErrors.serviceDescription_ar && (
                                                <p className="text-red-500 text-sm mt-1">{formErrors.serviceDescription_ar}</p>
                                            )}
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
                                            ? 'يمكنك إضافة رابط فيديو من YouTube أو أي منصة أخرى' 
                                            : 'You can add a video URL from YouTube or any other platform'
                                        }
                                    </p>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.35 }}
                                >
                                    <Label htmlFor="ServiceImages" className="dark:text-gray-200">
                                        {language === 'ar' ? 'صور الخدمة' : 'Service Images'}
                                    </Label>
                                    <div className="mt-1 flex items-center space-x-2">
                                        <Input
                                            id="ServiceImages"
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={(e) => handleFileChange(e, 'ServiceImages')}
                                            className="flex-grow transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                        />
                                        {Array.isArray(formData.ServiceImages) && formData.ServiceImages.length > 0 && (
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                {formData.ServiceImages.length} {language === 'ar' ? 'ملف مختار' : 'file(s) selected'}
                                            </span>
                                        )}
                                    </div>

                                    {/* عرض الصور الجديدة المختارة */}
                                    {formData.ServiceImages.length > 0 && (
                                        <div className="mt-3 flex flex-wrap">
                                            {formData.ServiceImages.map((file, index) => (
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
                                    {editingService && existingMedia.images?.length > 0 && (
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
                                    transition={{ delay: 0.4 }}
                                >
                                    <Label htmlFor="ServiceIcon" className="dark:text-gray-200">
                                        {language === 'ar' ? 'أيقونة الخدمة' : 'Service Icon'}
                                    </Label>
                                    <div className="mt-1 flex items-center space-x-2">
                                        <Input
                                            id="ServiceIcon"
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleFileChange(e, 'ServiceIcon')}
                                            className="flex-grow transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                        />
                                        {formData.ServiceIcon && (
                                            <span className="text-sm text-gray-500 dark:text-gray-400">{formData.ServiceIcon.name}</span>
                                        )}
                                    </div>

                                    {/* عرض الأيقونة الجديدة */}
                                    {formData.ServiceIcon && (
                                        <div className="mt-3">
                                            <ImageWithDelete
                                                image={formData.ServiceIcon}
                                                onRemove={handleRemoveNewIcon}
                                                isExisting={false}
                                            />
                                        </div>
                                    )}

                                    {/* عرض الأيقونة القديمة */}
                                    {editingService && existingMedia.icon && !formData.ServiceIcon && (
                                        <div className="mt-3">
                                            <ImageWithDelete
                                                image={existingMedia.icon}
                                                onRemove={handleRemoveExistingIcon}
                                                isExisting={true}
                                            />
                                        </div>
                                    )}
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.45 }}
                                >
                                    <Label htmlFor="product_ajwans" className="dark:text-gray-200">
                                        {language === 'ar' ? 'المشاريع المرتبطة' : 'Related Projects'}
                                    </Label>
                                    <Popover open={openProjects} onOpenChange={setOpenProjects}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={openProjects}
                                                className="w-full justify-between dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                            >
                                                {selectedProjects.length > 0 
                                                    ? `${selectedProjects.length} ${language === 'ar' ? 'مختار' : 'selected'}` 
                                                    : language === 'ar' ? 'اختر المشاريع...' : 'Select projects...'}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-full p-0 dark:bg-gray-700 dark:text-white">
                                            <Command className="dark:bg-gray-700 dark:text-white">
                                                <CommandInput placeholder={language === 'ar' ? 'ابحث في المشاريع...' : 'Search projects...'} className="dark:bg-gray-700 dark:text-white" />
                                                <CommandList>
                                                    <CommandEmpty>
                                                        {language === 'ar' ? 'لم يتم العثور على مشاريع' : 'No projects found'}
                                                    </CommandEmpty>
                                                    <CommandGroup>
                                                        {projects.map((project) => (
                                                            <CommandItem
                                                                key={project.id}
                                                                onSelect={() => {
                                                                    if (selectedProjects.some(p => p.id === project.id)) {
                                                                        setSelectedProjects(selectedProjects.filter(p => p.id !== project.id));
                                                                    } else {
                                                                        setSelectedProjects([...selectedProjects, project]);
                                                                    }
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        selectedProjects.some(p => p.id === project.id)
                                                                            ? "opacity-100"
                                                                            : "opacity-0"
                                                                    )}
                                                                />
                                                                {project.name}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {selectedProjects.map((project) => (
                                            <Badge 
                                                key={project.id} 
                                                variant="secondary"
                                                className="flex items-center gap-1 dark:bg-gray-600 dark:text-white"
                                            >
                                                {project.name}
                                                <X 
                                                    className="w-3 h-3 cursor-pointer" 
                                                    onClick={() => setSelectedProjects(selectedProjects.filter(p => p.id !== project.id))}
                                                />
                                            </Badge>
                                        ))}
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    <Label htmlFor="service_items" className="dark:text-gray-200">
                                        {language === 'ar' ? 'عناصر الخدمة' : 'Service Items'}
                                    </Label>
                                    <Popover open={openServiceItems} onOpenChange={setOpenServiceItems}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={openServiceItems}
                                                className="w-full justify-between dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                            >
                                                {selectedServiceItems.length > 0 
                                                    ? `${selectedServiceItems.length} ${language === 'ar' ? 'مختار' : 'selected'}` 
                                                    : language === 'ar' ? 'اختر عناصر الخدمة...' : 'Select service items...'}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-full p-0 dark:bg-gray-700 dark:text-white">
                                            <Command className="dark:bg-gray-700 dark:text-white">
                                                <CommandInput placeholder={language === 'ar' ? 'ابحث في عناصر الخدمة...' : 'Search service items...'} className="dark:bg-gray-700 dark:text-white" />
                                                <CommandList>
                                                    <CommandEmpty>
                                                        {language === 'ar' ? 'لم يتم العثور على عناصر خدمة' : 'No service items found'}
                                                    </CommandEmpty>
                                                    <CommandGroup>
                                                        {serviceItems.map((item) => (
                                                            <CommandItem
                                                                key={item.id}
                                                                onSelect={() => {
                                                                    if (selectedServiceItems.some(i => i.id === item.id)) {
                                                                        setSelectedServiceItems(selectedServiceItems.filter(i => i.id !== item.id));
                                                                    } else {
                                                                        setSelectedServiceItems([...selectedServiceItems, item]);
                                                                    }
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        selectedServiceItems.some(i => i.id === item.id)
                                                                            ? "opacity-100"
                                                                            : "opacity-0"
                                                                    )}
                                                                />
                                                                {item.name}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {selectedServiceItems.map((item) => (
                                            <Badge 
                                                key={item.id} 
                                                variant="secondary"
                                                className="flex items-center gap-1 dark:bg-gray-600 dark:text-white"
                                            >
                                                {item.name}
                                                <X 
                                                    className="w-3 h-3 cursor-pointer" 
                                                    onClick={() => setSelectedServiceItems(selectedServiceItems.filter(i => i.id !== item.id))}
                                                />
                                            </Badge>
                                        ))}
                                    </div>
                                </motion.div>
                            </div>

                            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowForm(false)}
                                    className="mr-3 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                                >
                                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                                </Button>
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <Button
                                        onClick={handleSaveService}
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
                                                {editingService 
                                                    ? (language === 'ar' ? 'تحديث' : 'Update') 
                                                    : (language === 'ar' ? 'حفظ' : 'Save')
                                                }
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
    );
};

export default ServicesManager;