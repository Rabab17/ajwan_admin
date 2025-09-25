import { useState, useEffect, Suspense } from 'react';
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
    Languages,
    Upload,
    FileImage
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

const ServicesManager = () => {
    const { t, language } = useLanguage();
    const { theme } = useTheme();
    const { notifications, showSuccess, showError, removeNotification } = useNotifications();

    const [services, setServices] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
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

    const [formLanguage, setFormLanguage] = useState(language);
    const [englishServicesForDropdown, setEnglishServicesForDropdown] = useState([]);
    const [selectedEnglishDocumentId, setSelectedEnglishDocumentId] = useState('');
    const [editingServiceId, setEditingServiceId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [formErrors, setFormErrors] = useState({});
    const [status, setStatus] = useState('published');
    const [isDeleting, setIsDeleting] = useState(false);
    const [deletingServiceId, setDeletingServiceId] = useState(null);

    // States for Dropdowns
    const [serviceItems, setServiceItems] = useState([]);
    const [projects, setProjects] = useState([]);
    const [selectedServiceItems, setSelectedServiceItems] = useState([]);
    const [selectedProjects, setSelectedProjects] = useState([]);
    const [openServiceItems, setOpenServiceItems] = useState(false);
    const [openProjects, setOpenProjects] = useState(false);

    // Enhanced date formatting function
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

    // Enhanced token validation
    const getValidToken = () => {
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error(t('auth_error') || 'Authentication token missing');
            throw new Error('Authentication token missing');
        }
        return token;
    };

    // Enhanced response checking
    const checkResponse = async (response) => {
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('token');
                toast.error(t('auth_error') || 'Authentication failed. Please login again.');
                throw new Error('Authentication failed');
            }

            const errorText = await response.text();
            console.error(`Server error: ${response.status}`, errorText);
            throw new Error(`Server error: ${response.status} - ${errorText}`);
        }
        return response;
    };

    // **FIXED: Simplified and robust media URL generation**
    const getMediaUrl = (media) => {
        if (!media) return null;

        console.log("🔍 Processing media:", media);

        let url = null;

        // Handle different Strapi response formats
        if (media.attributes?.url) {
            url = media.attributes.url;
        } else if (media.data?.attributes?.url) {
            url = media.data.attributes.url;
        } else if (media.url) {
            url = media.url;
        } else if (typeof media === 'string' && media.startsWith('http')) {
            return media;
        }

        if (!url) {
            console.warn("❌ No valid URL found in media:", media);
            return null;
        }

        // If URL is already absolute, return it
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }

        // Build absolute URL for relative URLs
        const baseUrl = getApiUrl().replace('/api', '');
        const fullUrl = `${baseUrl}${url.startsWith('/') ? url : '/' + url}`;
        
        console.log("✅ Generated URL:", fullUrl);
        return fullUrl;
    };

    // **FIXED: Simplified image upload with better error handling**
    const uploadFiles = async (files) => {
        if (!files || files.length === 0) return [];

        setIsUploading(true);
        setUploadProgress(0);

        try {
            const TOKEN = getValidToken();
            const formData = new FormData();

            // Add all files to form data
            Array.from(files).forEach(file => {
                console.log("📤 Uploading file:", file.name, file.type, file.size);
                formData.append('files', file);
            });

            // Upload with progress tracking
            const uploadResponse = await fetch(`${getApiUrl()}/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${TOKEN}`,
                },
                body: formData
            });

            await checkResponse(uploadResponse);
            const uploadedFiles = await uploadResponse.json();

            console.log("✅ Upload successful:", uploadedFiles);
            
            // Validate uploaded files
            if (!Array.isArray(uploadedFiles)) {
                throw new Error('Invalid upload response format');
            }

            return uploadedFiles;

        } catch (error) {
            console.error("❌ Upload failed:", error);
            toast.error(language === 'ar' 
                ? `فشل رفع الملفات: ${error.message}` 
                : `File upload failed: ${error.message}`
            );
            throw error;
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    // Load service items
    // const fetchServiceItems = async () => {
    //     try {
    //         const lang = language === 'ar' ? 'ar-SA' : 'en';
    //         const response = await fetch(
    //             `${getApiUrl()}/service-items?populate=*&locale=${lang}`
    //         );
            
    //         if (!response.ok) {
    //             throw new Error(`HTTP error! status: ${response.status}`);
    //         }
            
    //         const data = await response.json();
    //         const formattedItems = data.data.map(item => ({
    //             id: item.id,
    //             name: item.attributes?.name || item.name || `Service Item #${item.id}`,
    //             documentId: item.attributes?.documentId || item.documentId
    //         }));
            
    //         setServiceItems(formattedItems);
    //     } catch (error) {
    //         console.error("Error fetching service items:", error);
    //         toast.error("Error loading service items");
    //     }
    // };
    // Load service items
const fetchServiceItems = async () => {
    try {
        const lang = language === 'ar' ? 'ar-SA' : 'en';
        const response = await fetch(
            `${getApiUrl()}/service-items?populate=*&locale=${lang}`
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("📋 Service Items raw data:", data); // Debug log
        
        const formattedItems = data.data.map(item => {
            // استخراج الاسم من الهيكل الصحيح
            const attributes = item.attributes || item;
            const name = attributes.name || 
                        attributes.ServiceItemName || 
                        attributes.title || 
                        `Service Item #${item.id}`;
            
            return {
                id: item.id,
                name: name,
                documentId: attributes.documentId || item.documentId
            };
        });
        
        setServiceItems(formattedItems);
        console.log("✅ Formatted Service Items:", formattedItems); // Debug log
    } catch (error) {
        console.error("Error fetching service items:", error);
        toast.error("Error loading service items");
    }
};

    // Load projects
    const fetchProjects = async () => {
        try {
            const lang = language === 'ar' ? 'ar-SA' : 'en';
            const response = await fetch(
                `${getApiUrl()}/product-ajwans?populate=*&locale=${lang}`
            );
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
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

    // **FIXED: Enhanced service loading with better error handling**
    const loadServices = async () => {
        setIsLoading(true);
        let lang = language || 'en';

        if (lang === 'ar') {
            lang = 'ar-SA';
        }

        console.log("🌍 Loading services for language:", lang);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            const response = await fetch(
                `${getApiUrl()}/service-ajwains?populate=*&locale=${lang}`,
                {
                    signal: controller.signal,
                    headers: {
                        'Content-Type': 'application/json',
                    }
                }
            );
            
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log("📦 Raw services data:", data);

            const formatted = data.data.map(item => {
                const attrs = item.attributes || item;
                
                // **FIXED: Better image data normalization**
                const normalizedImages = normalizeMediaArray(attrs.ServiceImages);
                const normalizedIcon = normalizeMediaItem(attrs.ServiceIcon);
                
                console.log("🖼️ Processed images for service", item.id, ":", normalizedImages);
                console.log("🎯 Processed icon for service", item.id, ":", normalizedIcon);
                
                return {
                    id: item.id,
                    documentId: attrs.documentId,
                    ServiceTitle: attrs.ServiceTitle,
                    serviceDescription: attrs.serviceDescription,
                    locale: attrs.locale,
                    ServiceImages: normalizedImages,
                    ServiceIcon: normalizedIcon,
                    product_ajwans: attrs.product_ajwans?.data || attrs.product_ajwans || [],
                    service_items: attrs.service_items?.data || attrs.service_items || [],
                    createdAt: attrs.createdAt || item.createdAt,
                    videoUrl: attrs.videoUrl || '',
                    publishedAt: attrs.publishedAt,
                    status: attrs.publishedAt ? 'published' : 'draft'
                };
            });

            setServices(formatted);
            console.log("✅ Services loaded successfully:", formatted);
        } catch (err) {
            console.error("❌ Error loading services:", err);
            
            if (err.name === 'AbortError') {
                toast.error(language === 'ar' 
                    ? "⏰ انتهت مهلة الاتصال. يرجى المحاولة مرة أخرى" 
                    : "⏰ Request timeout. Please try again");
            } else {
                toast.error(language === 'ar' 
                    ? "❌ خطأ في تحميل الخدمات" 
                    : "❌ Error loading services");
            }
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
        service.ServiceTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.serviceDescription?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Start add service flow
    const startAddService = async (lang) => {
        setEditingService(null);
        setFormLanguage(lang);
        setFormErrors({});
        
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
                    `${getApiUrl()}/service-ajwains?locale=en&populate=*`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`,
                        },
                    }
                );
                const data = await response.json();
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
            setExistingMedia({
                imageIds: selectedService.ServiceImages?.map(img => img.id) || [],
                iconId: selectedService.ServiceIcon?.id || null,
                images: selectedService.ServiceImages || [],
                icon: selectedService.ServiceIcon || null,
                imagesToDelete: [],
            });
            
            setFormData(prev => ({
                ...prev,
                videoUrl: selectedService.videoUrl || ''
            }));
            
            setStatus(selectedService.status || 'published');
        }
    };

    // const handleEditService = (service) => {
    //     setEditingService(service);
    //     setFormErrors({});
        
    //     setExistingMedia({
    //         imageIds: service.ServiceImages?.map(i => i.id).filter(Boolean) || [],
    //         iconId: service.ServiceIcon?.id || null,
    //         images: service.ServiceImages || [],
    //         icon: service.ServiceIcon || null,
    //         imagesToDelete: []
    //     });

    //     setFormData({
    //         ServiceTitle_en: service.ServiceTitle || '',
    //         ServiceTitle_ar: service.ServiceTitle || '',
    //         serviceDescription_en: service.serviceDescription || '',
    //         serviceDescription_ar: service.serviceDescription || '',
    //         ServiceImages: [],
    //         ServiceIcon: null,
    //         product_ajwans: '',
    //         service_items: '',
    //         videoUrl: service.videoUrl || ''
    //     });
        
    //     // Initialize dropdowns
    //     setSelectedProjects(service.product_ajwans?.map(p => ({ 
    //         id: p.id, 
    //         name: p.attributes?.productName || p.productName || `Project #${p.id}` 
    //     })) || []);
        
    //     setSelectedServiceItems(service.service_items?.map(i => ({ 
    //         id: i.id, 
    //         name: i.attributes?.name || i.name || `Service Item #${i.id}` 
    //     })) || []);
        
    //     setStatus(service.status || 'published');
    //     setShowForm(true);
    // };


    const handleEditService = (service) => {
    setEditingService(service);
    setFormErrors({});
    
    setExistingMedia({
        imageIds: service.ServiceImages?.map(i => i.id).filter(Boolean) || [],
        iconId: service.ServiceIcon?.id || null,
        images: service.ServiceImages || [],
        icon: service.ServiceIcon || null,
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
    
    // Initialize dropdowns
    setSelectedProjects(service.product_ajwans?.map(p => { 
        const attributes = p.attributes || p;
        return {
            id: p.id, 
            name: attributes.productName || attributes.name || `Project #${p.id}` 
        };
    }) || []);
    
    // FIX: Service Items - استخراج الاسم بشكل صحيح
    setSelectedServiceItems(service.service_items?.map(i => {
        const attributes = i.attributes || i;
        const name = attributes.name || 
                    attributes.ServiceItemName || 
                    attributes.title || 
                    `Service Item #${i.id}`;
        
        return {
            id: i.id, 
            name: name
        };
    }) || []);
    
    setStatus(service.status || 'published');
    setShowForm(true);
};
    const handleFileChange = (e, fieldName) => {
        const files = Array.from(e.target.files);
        
        // Validate image files
        const imageFiles = files.filter(file => {
            if (!file.type.startsWith('image/')) {
                toast.error(language === 'ar' 
                    ? `الملف ${file.name} ليس صورة صالحة` 
                    : `File ${file.name} is not a valid image`);
                return false;
            }
            
            // Check file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                toast.error(language === 'ar' 
                    ? `الملف ${file.name} كبير جداً (الحد الأقصى 10MB)` 
                    : `File ${file.name} is too large (max 10MB)`);
                return false;
            }
            
            return true;
        });
        
        if (imageFiles.length !== files.length) {
            return; // Some files were invalid
        }
        
        setFormData(prev => ({
            ...prev,
            [fieldName]: fieldName === 'ServiceImages' 
                ? [...prev[fieldName], ...imageFiles] 
                : imageFiles[0]
        }));
        
        // Clear field error
        if (formErrors[fieldName]) {
            setFormErrors(prev => ({ ...prev, [fieldName]: '' }));
        }
    };

    // Media removal handlers
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

    // Form validation
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

    // **FIXED: Enhanced save service with proper file handling**
    const handleSaveService = async () => {
        if (isSaving) return;
        
        if (!validateForm()) {
            toast.error(language === 'ar' ? "يرجى تصحيح الأخطاء في النموذج" : "Please correct the errors in the form");
            return;
        }
        
        setIsSaving(true);

        try {
            const TOKEN = getValidToken();
            
            // Prepare related data
            const productAjwansIds = selectedProjects.map(project => project.id || project);
            const serviceItemsIds = selectedServiceItems.map(item => item.id || item);

            // **FIXED: Upload new files first**
            let uploadedFiles = [];
            const filesToUpload = [];
            
            // Collect files to upload
            if (formData.ServiceImages && formData.ServiceImages.length > 0) {
                filesToUpload.push(...formData.ServiceImages);
            }
            if (formData.ServiceIcon && formData.ServiceIcon instanceof File) {
                filesToUpload.push(formData.ServiceIcon);
            }

            // Upload files if any
            if (filesToUpload.length > 0) {
                console.log("📤 Uploading files:", filesToUpload);
                uploadedFiles = await uploadFiles(filesToUpload);
                console.log("✅ Files uploaded:", uploadedFiles);
            }

            // **FIXED: Create or update service**
            if (!editingService) {
                // CREATE NEW SERVICE
                if (formLanguage === "en") {
                    const serviceData = {
                        ServiceTitle: formData.ServiceTitle_en,
                        serviceDescription: formData.serviceDescription_en,
                        locale: "en",
                        product_ajwans: productAjwansIds,
                        service_items: serviceItemsIds,
                        videoUrl: formData.videoUrl || undefined,
                        publishedAt: status === 'published' ? new Date().toISOString() : null
                    };

                    // **FIXED: Link uploaded images properly**
                    if (uploadedFiles.length > 0) {
                        const imageFiles = uploadedFiles.filter(f => 
                            formData.ServiceImages.some(img => img.name === f.name)
                        );
                        const iconFile = uploadedFiles.find(f => 
                            formData.ServiceIcon && formData.ServiceIcon.name === f.name
                        );
                        
                        if (imageFiles.length > 0) {
                            serviceData.ServiceImages = imageFiles.map(f => f.id);
                        }
                        if (iconFile) {
                            serviceData.ServiceIcon = iconFile.id;
                        }
                    }

                    console.log("🚀 Creating English service:", serviceData);

                    const response = await fetch(`${getApiUrl()}/service-ajwains?locale=en`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${TOKEN}`,
                        },
                        body: JSON.stringify({ data: serviceData }),
                    });
                    
                    await checkResponse(response);
                    const result = await response.json();
                    console.log("✅ Service created:", result);

                } else {
                    // CREATE ARABIC LOCALIZATION
                    const serviceData = {
                        ServiceTitle: formData.ServiceTitle_ar,
                        serviceDescription: formData.serviceDescription_ar,
                        product_ajwans: productAjwansIds,
                        service_items: serviceItemsIds,
                        videoUrl: formData.videoUrl || undefined,
                        publishedAt: status === 'published' ? new Date().toISOString() : null
                    };

                    // Link uploaded files
                    if (uploadedFiles.length > 0) {
                        const imageFiles = uploadedFiles.filter(f => 
                            formData.ServiceImages.some(img => img.name === f.name)
                        );
                        const iconFile = uploadedFiles.find(f => 
                            formData.ServiceIcon && formData.ServiceIcon.name === f.name
                        );
                        
                        if (imageFiles.length > 0) {
                            serviceData.ServiceImages = imageFiles.map(f => f.id);
                        }
                        if (iconFile) {
                            serviceData.ServiceIcon = iconFile.id;
                        }
                    }

                    console.log("🚀 Creating Arabic service:", serviceData);

                    const response = await fetch(
                        `${getApiUrl()}/service-ajwains/${selectedEnglishDocumentId}?locale=ar-SA`,
                        {
                            method: "PUT",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${TOKEN}`,
                            },
                            body: JSON.stringify({ data: serviceData }),
                        }
                    );
                    
                    await checkResponse(response);
                    const result = await response.json();
                    console.log("✅ Arabic service created:", result);
                }
            } else {
                // UPDATE EXISTING SERVICE
                const getFinalImages = () => {
                    const keptImages = existingMedia.images
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

                const serviceData = {
                    ServiceTitle: formLanguage === "en" ? formData.ServiceTitle_en : formData.ServiceTitle_ar,
                    serviceDescription: formLanguage === "en" ? formData.serviceDescription_en : formData.serviceDescription_ar,
                    ServiceImages: getFinalImages(),
                    ServiceIcon: getFinalIcon(),
                    product_ajwans: productAjwansIds,
                    service_items: serviceItemsIds,
                    videoUrl: formData.videoUrl || undefined,
                    publishedAt: status === 'published' ? new Date().toISOString() : null
                };

                console.log("🚀 Updating service:", serviceData);

                const response = await fetch(
                    `${getApiUrl()}/service-ajwains/${editingService.documentId}?locale=${editingService.locale}`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${TOKEN}`,
                        },
                        body: JSON.stringify({ data: serviceData }),
                    }
                );
                
                await checkResponse(response);
                const result = await response.json();
                console.log("✅ Service updated:", result);
            }

            // Success - reload and cleanup
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
            
            toast.success(language === 'ar' ? "تم حفظ الخدمة بنجاح ✅" : "Service saved successfully ✅");

        } catch (error) {
            console.error("❌ Error saving service:", error);
            toast.error(language === 'ar' 
                ? `❌ حدث خطأ أثناء الحفظ: ${error.message}` 
                : `❌ Error while saving: ${error.message}`
            );
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

            setIsDeleting(true);
            setDeletingServiceId(documentId);
            
            const token = getValidToken();
            const response = await fetch(`${getApiUrl()}/service-ajwains/${documentId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            await checkResponse(response);
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
            setIsDeleting(false);
            setDeletingServiceId(null);
        }
    };

    // **FIXED: Simplified media normalization functions**
    const normalizeMediaArray = (mediaData) => {
        if (!mediaData) return [];
        
        // Handle Strapi v4 format
        if (mediaData.data && Array.isArray(mediaData.data)) {
            return mediaData.data.map(item => ({
                id: item.id,
                url: getMediaUrl(item),
                name: item.attributes?.name || 'Unknown',
                alternativeText: item.attributes?.alternativeText || ''
            })).filter(item => item.url);
        }
        
        // Handle direct array format
        if (Array.isArray(mediaData)) {
            return mediaData.map(item => ({
                id: item.id,
                url: getMediaUrl(item),
                name: item.name || item.attributes?.name || 'Unknown',
                alternativeText: item.alternativeText || item.attributes?.alternativeText || ''
            })).filter(item => item.url);
        }
        
        return [];
    };

    const normalizeMediaItem = (mediaData) => {
        if (!mediaData) return null;
        
        // Handle Strapi v4 format
        if (mediaData.data) {
            const item = mediaData.data;
            const url = getMediaUrl(item);
            if (!url) return null;
            
            return {
                id: item.id,
                url,
                name: item.attributes?.name || 'Unknown',
                alternativeText: item.attributes?.alternativeText || ''
            };
        }
        
        // Handle direct object format
        if (mediaData.id) {
            const url = getMediaUrl(mediaData);
            if (!url) return null;
            
            return {
                id: mediaData.id,
                url,
                name: mediaData.name || mediaData.attributes?.name || 'Unknown',
                alternativeText: mediaData.alternativeText || mediaData.attributes?.alternativeText || ''
            };
        }
        
        return null;
    };

    // **FIXED: Enhanced ImageWithDelete component with better error handling**
    const ImageWithDelete = ({ image, onRemove, isExisting = false }) => {
        const [isHovered, setIsHovered] = useState(false);
        const [imgSrc, setImgSrc] = useState('');
        const [hasError, setHasError] = useState(false);

        useEffect(() => {
            let imageSrc;
            
            if (isExisting && image) {
                if (typeof image === 'string') {
                    imageSrc = image;
                } else {
                    imageSrc = image.url || getMediaUrl(image);
                }
            } else if (image instanceof File) {
                imageSrc = URL.createObjectURL(image);
            }
            
            setImgSrc(imageSrc);
            setHasError(false);

            // Cleanup for File objects
            return () => {
                if (image instanceof File && imageSrc) {
                    URL.revokeObjectURL(imageSrc);
                }
            };
        }, [image, isExisting]);

        const handleImageError = () => {
            console.error("❌ Image failed to load:", imgSrc);
            setHasError(true);
        };

        return (
            <motion.div
                className="relative inline-block m-1 group"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                whileHover={{ scale: 1.05 }}
            >
                {hasError ? (
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded border flex items-center justify-center">
                        <FileImage className="w-6 h-6 text-gray-400" />
                    </div>
                ) : (
                    <img
                        src={imgSrc}
                        alt="preview"
                        className="w-16 h-16 object-cover rounded border shadow-sm"
                        onError={handleImageError}
                        loading="lazy"
                    />
                )}
                
                <AnimatePresence>
                    {isHovered && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md transition-colors"
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

    // Animation variants
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
                        {isLoading && (
                            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md dark:bg-blue-900/20 dark:border-blue-800">
                                <div className="flex items-center">
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin text-blue-600" />
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                        {language === 'ar' 
                                            ? '⏳ جاري تحميل البيانات...' 
                                            : '⏳ Loading data...'}
                                    </p>
                                </div>
                            </div>
                        )}
                        {isUploading && (
                            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md dark:bg-green-900/20 dark:border-green-800">
                                <div className="flex items-center">
                                    <Upload className="w-4 h-4 mr-2 animate-pulse text-green-600" />
                                    <p className="text-sm text-green-700 dark:text-green-300">
                                        {language === 'ar' 
                                            ? '📤 جاري رفع الملفات...' 
                                            : '📤 Uploading files...'}
                                    </p>
                                </div>
                            </div>
                        )}
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
                            <div className="text-center py-10">
                                <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                                    {language === 'ar' ? 'لا توجد خدمات' : 'No services'}
                                </h3>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    {searchTerm 
                                        ? (language === 'ar' ? 'لم يتم العثور على خدمات تطابق بحثك.' : 'No services found matching your search.')
                                        : (language === 'ar' ? 'لا توجد بيانات متاحة حاليًا. يمكنك إضافة خدمة جديدة من خلال الأزرار أعلاه.' : 'No data available currently. You can add a new service using the buttons above.')
                                    }
                                </p>
                                {!searchTerm && (
                                    <div className="mt-6 space-x-2">
                                        <Button
                                            onClick={() => startAddService('en')}
                                            className="bg-blue-600 hover:bg-blue-700 text-white"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            {language === 'ar' ? 'إضافة خدمة (EN)' : 'Add Service (EN)'}
                                        </Button>
                                        <Button
                                            onClick={() => startAddService('ar')}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            {language === 'ar' ? 'إضافة خدمة (AR)' : 'Add Service (AR)'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Suspense fallback={<CardLoader />}>
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
                                                <th className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-center">
                                                    {language === 'ar' ? 'الصور' : 'Images'}
                                                </th>
                                                <th className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-center">
                                                    {language === 'ar' ? 'الفيديو' : 'Video'}
                                                </th>
                                                <th className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-center">
                                                    {language === 'ar' ? 'الحالة' : 'Status'}
                                                </th>
                                                <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                                                    {language === 'ar' ? 'تاريخ الإنشاء' : 'Created At'}
                                                </th>
                                                <th className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-center">
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
                                                        <td className="py-4 px-4 text-center">
                                                            {service.ServiceImages && service.ServiceImages.length > 0 ? (
                                                                <div className="flex justify-center items-center space-x-1">
                                                                    <ImageIcon className="w-4 h-4 text-green-500" />
                                                                    <span className="text-sm text-green-600 dark:text-green-400">
                                                                        {service.ServiceImages.length}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-gray-400 text-sm">-</span>
                                                            )}
                                                        </td>
                                                        <td className="py-4 px-4 text-center">
                                                            {service.videoUrl ? (
                                                                <a 
                                                                    href={service.videoUrl} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    className="text-blue-500 hover:text-blue-700 inline-flex items-center"
                                                                >
                                                                    <Video className="w-4 h-4" />
                                                                </a>
                                                            ) : (
                                                                <span className="text-gray-400 text-sm">-</span>
                                                            )}
                                                        </td>
                                                        <td className="py-4 px-4 text-center">
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
                                                                    disabled={isDeleting && deletingServiceId === service.documentId}
                                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-gray-700 disabled:opacity-50"
                                                                >
                                                                    {isDeleting && deletingServiceId === service.documentId ? (
                                                                        <Loader2 className="w-4 h-4 animate-spin" />
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
                            </Suspense>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Enhanced Form Modal */}
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
                            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto dark:bg-gray-800"
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
                                    <Label className="dark:text-gray-200">
                                        {language === 'ar' ? 'الحالة' : 'Status'}
                                    </Label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="mt-1 w-full rounded border border-gray-300 p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                    >
                                        <option value="published">{language === 'ar' ? 'منشور' : 'Published'}</option>
                                        <option value="draft">{language === 'ar' ? 'مسودة' : 'Draft'}</option>
                                    </select>
                                </motion.div>

                                {/* Language-specific fields */}
                                {formLanguage === 'en' && (
                                    <div className="space-y-4">
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 }}
                                        >
                                            <Label className="dark:text-gray-200">
                                                {language === 'ar' ? 'عنوان الخدمة (إنجليزي)' : 'Service Title (English)'}
                                            </Label>
                                            <Input
                                                value={formData.ServiceTitle_en}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, ServiceTitle_en: e.target.value });
                                                    if (formErrors.ServiceTitle_en) {
                                                        setFormErrors({ ...formErrors, ServiceTitle_en: '' });
                                                    }
                                                }}
                                                placeholder={language === 'ar' ? 'أدخل عنوان الخدمة بالإنجليزية' : 'Enter service title in English'}
                                                className={`mt-1 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                                                    formErrors.ServiceTitle_en ? 'border-red-500' : ''
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
                                            <Label className="dark:text-gray-200">
                                                {language === 'ar' ? 'وصف الخدمة (إنجليزي)' : 'Service Description (English)'}
                                            </Label>
                                            <Textarea
                                                value={formData.serviceDescription_en}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, serviceDescription_en: e.target.value });
                                                    if (formErrors.serviceDescription_en) {
                                                        setFormErrors({ ...formErrors, serviceDescription_en: '' });
                                                    }
                                                }}
                                                placeholder={language === 'ar' ? 'أدخل وصف الخدمة بالإنجليزية' : 'Enter service description in English'}
                                                rows={4}
                                                className={`mt-1 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                                                    formErrors.serviceDescription_en ? 'border-red-500' : ''
                                                }`}
                                            />
                                            {formErrors.serviceDescription_en && (
                                                <p className="text-red-500 text-sm mt-1">{formErrors.serviceDescription_en}</p>
                                            )}
                                        </motion.div>
                                    </div>
                                )}

                                {formLanguage === 'ar' && (
                                    <div className="space-y-4">
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.05 }}
                                        >
                                            <Label className="dark:text-gray-200">
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
                                                    formErrors.englishService ? 'border-red-500' : ''
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
                                            <Label className="dark:text-gray-200">
                                                {language === 'ar' ? 'عنوان الخدمة (عربي)' : 'Service Title (Arabic)'}
                                            </Label>
                                            <Input
                                                value={formData.ServiceTitle_ar}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, ServiceTitle_ar: e.target.value });
                                                    if (formErrors.ServiceTitle_ar) {
                                                        setFormErrors({ ...formErrors, ServiceTitle_ar: '' });
                                                    }
                                                }}
                                                placeholder={language === 'ar' ? 'أدخل عنوان الخدمة بالعربية' : 'Enter service title in Arabic'}
                                                className={`mt-1 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                                                    formErrors.ServiceTitle_ar ? 'border-red-500' : ''
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
                                            <Label className="dark:text-gray-200">
                                                {language === 'ar' ? 'وصف الخدمة (عربي)' : 'Service Description (Arabic)'}
                                            </Label>
                                            <Textarea
                                                value={formData.serviceDescription_ar}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, serviceDescription_ar: e.target.value });
                                                    if (formErrors.serviceDescription_ar) {
                                                        setFormErrors({ ...formErrors, serviceDescription_ar: '' });
                                                    }
                                                }}
                                                placeholder={language === 'ar' ? 'أدخل وصف الخدمة بالعربية' : 'Enter service description in Arabic'}
                                                rows={4}
                                                className={`mt-1 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                                                    formErrors.serviceDescription_ar ? 'border-red-500' : ''
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
                                    <Label className="dark:text-gray-200 flex items-center">
                                        <Video className="w-4 h-4 mr-2" />
                                        {language === 'ar' ? 'رابط الفيديو' : 'Video URL'}
                                    </Label>
                                    <Input
                                        type="url"
                                        value={formData.videoUrl}
                                        onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                                        placeholder={language === 'ar' ? 'أدخل رابط الفيديو' : 'Enter video URL'}
                                        className="mt-1 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                    />
                                    <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">
                                        {language === 'ar' 
                                            ? 'يمكنك إضافة رابط فيديو من YouTube أو أي منصة أخرى' 
                                            : 'You can add a video URL from YouTube or any other platform'
                                        }
                                    </p>
                                </motion.div>

                                {/* Service Images */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.35 }}
                                >
                                    <Label className="dark:text-gray-200 flex items-center">
                                        <ImageIcon className="w-4 h-4 mr-2" />
                                        {language === 'ar' ? 'صور الخدمة' : 'Service Images'}
                                    </Label>
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={(e) => handleFileChange(e, 'ServiceImages')}
                                        className="mt-1 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                    />
                                    <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">
                                        {language === 'ar' 
                                            ? 'يمكنك اختيار عدة صور (حد أقصى 10MB لكل صورة)' 
                                            : 'You can select multiple images (max 10MB per image)'
                                        }
                                    </p>

                                    {/* New images preview */}
                                    {formData.ServiceImages.length > 0 && (
                                        <div className="mt-3">
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                                {language === 'ar' ? 'الصور الجديدة:' : 'New Images:'}
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {formData.ServiceImages.map((file, index) => (
                                                    <ImageWithDelete
                                                        key={index}
                                                        image={file}
                                                        onRemove={() => handleRemoveNewImage(index)}
                                                        isExisting={false}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Existing images preview */}
                                    {existingMedia.images?.length > 0 && (
                                        <div className="mt-3">
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                                {language === 'ar' ? 'الصور الموجودة:' : 'Existing Images:'}
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {existingMedia.images.map((img) => (
                                                    <ImageWithDelete
                                                        key={img.id}
                                                        image={img}
                                                        onRemove={handleRemoveExistingImage}
                                                        isExisting={true}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>

                                {/* Service Icon */}
                                

                                {/* Related Projects */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.45 }}
                                >
                                    <Label className="dark:text-gray-200">
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
                                                <CommandInput 
                                                    placeholder={language === 'ar' ? 'ابحث في المشاريع...' : 'Search projects...'} 
                                                    className="dark:bg-gray-700 dark:text-white" 
                                                />
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
                                                    className="w-3 h-3 cursor-pointer hover:text-red-500" 
                                                    onClick={() => setSelectedProjects(selectedProjects.filter(p => p.id !== project.id))}
                                                />
                                            </Badge>
                                        ))}
                                    </div>
                                </motion.div>

                                {/* Service Items */}
                                {/* <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    <Label className="dark:text-gray-200">
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
                                                <CommandInput 
                                                    placeholder={language === 'ar' ? 'ابحث في عناصر الخدمة...' : 'Search service items...'} 
                                                    className="dark:bg-gray-700 dark:text-white" 
                                                />
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
                                                    className="w-3 h-3 cursor-pointer hover:text-red-500" 
                                                    onClick={() => setSelectedServiceItems(selectedServiceItems.filter(i => i.id !== item.id))}
                                                />
                                            </Badge>
                                        ))}
                                    </div>
                                </motion.div> */}

                                {/* Service Items */}
<motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.5 }}
>
    <Label className="dark:text-gray-200">
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
                <CommandInput 
                    placeholder={language === 'ar' ? 'ابحث في عناصر الخدمة...' : 'Search service items...'} 
                    className="dark:bg-gray-700 dark:text-white" 
                />
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
                                {item.name} {/* عرض الاسم بدلاً من الـ ID */}
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
                {item.name} {/* عرض الاسم في الـ badges */}
                <X 
                    className="w-3 h-3 cursor-pointer hover:text-red-500" 
                    onClick={() => setSelectedServiceItems(selectedServiceItems.filter(i => i.id !== item.id))}
                />
            </Badge>
        ))}
    </div>
</motion.div>
                            </div>

                            {/* Form Actions */}
                            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowForm(false)}
                                    className="dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                                    disabled={isSaving || isUploading}
                                >
                                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                                </Button>
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <Button
                                        onClick={handleSaveService}
                                        disabled={isSaving || isUploading}
                                        className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50"
                                    >
                                        {isSaving || isUploading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                {isUploading 
                                                    ? (language === 'ar' ? 'جاري الرفع...' : 'Uploading...')
                                                    : (language === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                                                }
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