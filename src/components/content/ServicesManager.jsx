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
    Eye,
    ToggleLeft,
    ToggleRight,
    Save,
    X
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
const ServicesManager = () => {
    const { t, language } = useLanguage();
    const { theme } = useTheme();

    const [services, setServices] = useState([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [formData, setFormData] = useState({
        ServiceTitle: '',
        serviceDescription: '',
        ServiceImages: [],
        ServiceIcon: null,
        product_ajwans: '',
        service_items: ''
    });
    const [existingMedia, setExistingMedia] = useState({ imageIds: [], iconId: null, images: [], icon: null });

    // Load services from Strapi (with locale and preview)
    const loadServices = async () => {
        const TOKEN = localStorage.getItem('token');
        try {
            const url = language === 'ar'
                ? `http://localhost:1337/api/service-ajwains?populate=*&locale=SA-ar`
                : `http://localhost:1337/api/service-ajwains?populate=*`;
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${TOKEN}` }
            });
            if (!res.ok) {
                const err = await res.text();
                throw new Error(`Failed to fetch services: ${res.status} ${err}`);
            }
            const json = await res.json();
            const mapped = (json.data || []).map(item => {
                const attrs = item.attributes || item || {};
                return {
                    id: item.id,
                    documentId: attrs.documentId || item.documentId,
                    ServiceTitle: attrs.ServiceTitle || item.ServiceTitle || '',
                    serviceDescription: attrs.serviceDescription || item.serviceDescription || '',
                    ServiceImages: attrs.ServiceImages?.data || item.ServiceImages || [],
                    ServiceIcon: attrs.ServiceIcon?.data || item.ServiceIcon || null,
                    product_ajwans: attrs.product_ajwans?.data || item.product_ajwans || [],
                    service_items: attrs.service_items?.data || item.service_items || [],
                    createdAt: ((attrs.createdAt || item.createdAt) || '').slice(0, 10)
                };
            });
            setServices(mapped);
        } catch (e) {
            console.error('loadServices error', e);
            setServices([]);
        }
    };

    useEffect(() => { loadServices(); }, [language]);

    const normalizedTerm = (searchTerm || '').toLowerCase();
    const filteredServices = services.filter(service => {
        const title = (service.ServiceTitle || service.name || '').toLowerCase();
        const description = (service.serviceDescription || service.description || '').toLowerCase();
        return title.includes(normalizedTerm) || description.includes(normalizedTerm);
    });

    const handleAddService = () => {
        setEditingService(null);
        setFormData({
            ServiceTitle: '',
            serviceDescription: '',
            ServiceImages: [],
            ServiceIcon: null,
            product_ajwans: '',
            service_items: ''
        });
        setExistingMedia({ imageIds: [], iconId: null, images: [], icon: null });
        setShowForm(true);
    };

    const handleEditService = (service) => {
        setEditingService(service);
        const imagesArray = Array.isArray(service.ServiceImages) ? service.ServiceImages : (service.ServiceImages?.data || []);
        const iconArray = Array.isArray(service.ServiceIcon) ? service.ServiceIcon : (service.ServiceIcon?.data || []);
        const imageIds = imagesArray.map(i => i.id).filter(Boolean);
        const iconId = iconArray[0]?.id || null;
        setExistingMedia({ imageIds, iconId, images: imagesArray, icon: iconArray[0] || null });
        setFormData({
            ServiceTitle: service.ServiceTitle || '',
            serviceDescription: service.serviceDescription || '',
            ServiceImages: [],
            ServiceIcon: null,
            product_ajwans: (service.product_ajwans || []).map(p => p.id).join(','),
            service_items: (service.service_items || []).map(p => p.id).join(',')
        });
        setShowForm(true);
    };

    const handleSaveService = async () => {
        if (isSaving) return; // prevent double submit
        setIsSaving(true);
        const TOKEN = localStorage.getItem('token');

        const filesToUpload = [];
        if (formData.ServiceImages && formData.ServiceImages.length > 0) {
            for (const file of formData.ServiceImages) filesToUpload.push({ fieldName: 'ServiceImages', file });
        }
        if (formData.ServiceIcon) {
            filesToUpload.push({ fieldName: 'ServiceIcon', file: formData.ServiceIcon });
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
                    throw new Error('Image upload failed');
                }
    
                uploadedFiles = await uploadResponse.json();
    
            } catch (error) {
                console.error('Error uploading images:', error);
                return;
            }
        }
        
        const finalData = { ServiceTitle: formData.ServiceTitle, serviceDescription: formData.serviceDescription, ServiceImages: [], ServiceIcon: null };
        
        if (uploadedFiles.length > 0) {
            const imagesIds = [];
            const originalImageNames = Array.isArray(formData.ServiceImages) ? formData.ServiceImages.map(f => f.name) : [];
            const iconName = formData.ServiceIcon?.name;
            for (const f of uploadedFiles) {
                if (iconName && f.name === iconName) {
                    finalData.ServiceIcon = f.id;
                } else if (originalImageNames.includes(f.name)) {
                    imagesIds.push(f.id);
                }
            }
            finalData.ServiceImages = imagesIds;
        }
        
        // Parse relations to arrays of IDs if provided
        if (formData.product_ajwans) {
            finalData.product_ajwans = formData.product_ajwans.toString().split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        }
        if (formData.service_items) {
            finalData.service_items = formData.service_items.toString().split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        }

        // Preserve existing media on update if not replaced
        if (editingService) {
            if (!formData.ServiceIcon && existingMedia.iconId && !finalData.ServiceIcon) {
                finalData.ServiceIcon = existingMedia.iconId;
            }
            if ((!formData.ServiceImages || formData.ServiceImages.length === 0) && existingMedia.imageIds?.length) {
                finalData.ServiceImages = [...finalData.ServiceImages, ...existingMedia.imageIds];
            }
        }
        
    
        const payload = { data: finalData };
        
        try {
            // Resolve numeric id by documentId when editing
            let apiEndpoint = 'http://localhost:1337/api/service-ajwains';
            let method = 'POST';
            if (editingService) {
                // Prefer documentId in URL as requested
                if (editingService.documentId) {
                    apiEndpoint = `http://localhost:1337/api/service-ajwains/${editingService.documentId}`;
                    method = 'PUT';
                } else {
                    // fallback to numeric id
                    apiEndpoint = `http://localhost:1337/api/service-ajwains/${editingService.id}`;
                    method = 'PUT';
                }
            }
    
            const serviceResponse = await fetch(apiEndpoint, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${TOKEN}`
                },
                body: JSON.stringify(payload),
            });
    
            if (!serviceResponse.ok) {
                const errorData = await serviceResponse.json();
                console.error('Failed to save service data:', errorData);
                throw new Error('Failed to save service data');
            }
    
            await serviceResponse.json();
            // Reload list after save to reflect server truth
            try { await loadServices(); } catch (e) { console.error('reload after save failed', e); }
            setShowForm(false);
            setEditingService(null);
            setExistingMedia({ imageIds: [], iconId: null, images: [], icon: null });
            toast.success(editingService ? t('update') + ' ' + t('success') : t('save') + ' ' + t('success'));
    
        } catch (error) {
            console.error('Error saving service:', error);
            toast.error(t('error') || 'Error while saving');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteService = async (service) => {
        const TOKEN = localStorage.getItem('token');
        try {
            setDeletingId(service.id || service.documentId);
            const del = await fetch(`http://localhost:1337/api/service-ajwains/${service.documentId || service.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${TOKEN}` }
            });
            if (!del.ok) throw new Error('delete failed');
            setServices(services.filter(s => s.documentId !== service.documentId && s.id !== service.id));
            toast.success(t('deleted') || 'Deleted');
        } catch (e) {
            console.error(e);
            toast.error(t('error') || 'Delete failed');
        } finally {
            setDeletingId(null);
        }
    };

    const toggleServiceStatus = (id) => {
        setServices(services.map(service =>
            service.id === id
                ? { ...service, status: service.status === 'active' ? 'inactive' : 'active' }
                : service
        ));
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
            transition: { duration: 0.5, ease: 'easeOut' }
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

    const getMediaUrl = (media) => {
        const base = 'http://localhost:1337';
        if (!media) return null;
        if (Array.isArray(media)) return getMediaUrl(media[0]);
        const url = media.attributes?.url || media.url;
        if (typeof url !== 'string') return null;
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        return `${base}${url}`;
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
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('manage_services')}</h1>
                        <p className="text-gray-600 mt-1 dark:text-gray-400">{t('manage_services_desc')}</p>
                    </div>
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Button
                            onClick={handleAddService}
                            className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            {t('add_new_service')}
                        </Button>
                    </motion.div>
                </div>
            </motion.div>

            <motion.div variants={itemVariants}>
                <Card className="shadow-sm border-0 dark:bg-gray-800 dark:text-white">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="dark:text-white">{t('services_list')}</CardTitle>
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder={t('search_services')}
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
                                        <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${language === 'ar' ? 'text-right' : 'text-left'}`}>Title</th>
                                        <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${language === 'ar' ? 'text-right' : 'text-left'}`}>Description</th>
                                        <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-center`}>Image</th>
                                        <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-center`}>Icon</th>
                                        <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t('created_at')}</th>
                                        <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${language === 'ar' ? 'text-center' : 'text-center'}`}>{t('actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence>
                                        {filteredServices.map((service, index) => (
                                            <motion.tr
                                                key={service.id}
                                                variants={tableRowVariants}
                                                initial="hidden"
                                                animate="visible"
                                                exit="hidden"
                                                whileHover="hover"
                                                transition={{ delay: index * 0.1 }}
                                                className="border-b border-gray-100 dark:border-gray-700"
                                            >
                                                <td className="py-4 px-4">
                                                    <div className="font-medium text-gray-900 dark:text-white">{service.ServiceTitle || '-'}</div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">
                                                        {service.serviceDescription || '-'}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    {getMediaUrl(service.ServiceImages) ? (
                                                        <img src={getMediaUrl(service.ServiceImages)} alt="service" className="inline-block w-12 h-12 object-cover rounded" />
                                                    ) : (
                                                        <span className="text-gray-400 text-sm">-</span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    {getMediaUrl(service.ServiceIcon) ? (
                                                        <img src={getMediaUrl(service.ServiceIcon)} alt="icon" className="inline-block w-8 h-8 object-contain" />
                                                    ) : (
                                                        <span className="text-gray-400 text-sm">-</span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-4 text-gray-500 dark:text-gray-400">
                                                    {service.createdAt}
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
                                                            onClick={() => handleDeleteService(service)}
                                                            disabled={deletingId === (service.id || service.documentId)}
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
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:text-white"
                        >
                            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                    {editingService ? t('edit_service') : t('add_new_service')}
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
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <Label htmlFor="serviceDescription" className="dark:text-gray-200">{t("service_description")}</Label>
                                    <Textarea
                                        id="serviceDescription"
                                        value={formData.serviceDescription}
                                        onChange={(e) => setFormData({ ...formData, serviceDescription: e.target.value })}
                                        placeholder={t("enter_service_description")}
                                        rows={4}
                                        className="mt-1 transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                    />
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <Label htmlFor="ServiceTitle" className="dark:text-gray-200">{t("service_title")}</Label>
                                    <Input
                                        id="ServiceTitle"
                                        value={formData.ServiceTitle}
                                        onChange={(e) => setFormData({ ...formData, ServiceTitle: e.target.value })}
                                        placeholder={t("enter_service_title")}
                                        className="mt-1 transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                    />
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <Label htmlFor="ServiceImages" className="dark:text-gray-200">{t("service_images")}</Label>
                                    <div className="mt-1 flex items-center space-x-2">
                                        <Input
                                            id="ServiceImages"
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={(e) => setFormData({ ...formData, ServiceImages: Array.from(e.target.files || []) })}
                                            className="flex-grow transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                        />
                                        {Array.isArray(formData.ServiceImages) && formData.ServiceImages.length > 0 && (
                                            <span className="text-sm text-gray-500 dark:text-gray-400">{formData.ServiceImages.length} file(s) selected</span>
                                        )}
                                    </div>
                                    {editingService && existingMedia.images?.length > 0 && (
                                        <div className="mt-3 grid grid-cols-4 gap-2">
                                            {existingMedia.images.map((img, idx) => (
                                                <img key={idx} src={getMediaUrl(img)} alt={`image-${idx}`} className="w-16 h-16 object-cover rounded border" />
                                            ))}
                                        </div>
                                    )}
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.35 }}
                                >
                                    <Label htmlFor="ServiceIcon" className="dark:text-gray-200">{t("service_icon")}</Label>
                                    <div className="mt-1 flex items-center space-x-2">
                                        <Input
                                            id="ServiceIcon"
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setFormData({ ...formData, ServiceIcon: e.target.files?.[0] || null })}
                                            className="flex-grow transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                        />
                                        {formData.ServiceIcon && (
                                            <span className="text-sm text-gray-500 dark:text-gray-400">{formData.ServiceIcon.name}</span>
                                        )}
                                    </div>
                                    {editingService && existingMedia.icon && (
                                        <div className="mt-3">
                                            <img src={getMediaUrl(existingMedia.icon)} alt="icon-preview" className="w-12 h-12 object-contain" />
                                        </div>
                                    )}
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    <Label htmlFor="product_ajwans" className="dark:text-gray-200">{t("product_ajwans")}</Label>
                                    <Input
                                        id="product_ajwans"
                                        value={formData.product_ajwans}
                                        onChange={(e) => setFormData({ ...formData, product_ajwans: e.target.value })}
                                        placeholder={t("enter_related_products_comma_separated")}
                                        className="mt-1 transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                    />
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.45 }}
                                >
                                    <Label htmlFor="service_items" className="dark:text-gray-200">{t("service_items")}</Label>
                                    <Input
                                        id="service_items"
                                        value={formData.service_items}
                                        onChange={(e) => setFormData({ ...formData, service_items: e.target.value })}
                                        placeholder={t("enter_service_items_comma_separated")}
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
                                        onClick={handleSaveService}
                                        disabled={isSaving}
                                        className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50"
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        {isSaving ? t('loading') || 'Loading...' : (editingService ? t('update') : t('save'))}
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

export default ServicesManager;



















// import { useState, useEffect } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Textarea } from '@/components/ui/textarea';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
// import {
//     Plus,
//     Edit,
//     Trash2,
//     Search,
//     Eye,
//     ToggleLeft,
//     ToggleRight,
//     Save,
//     X
// } from 'lucide-react';
// import { useLanguage } from '../../contexts/LanguageContext';
// import { useTheme } from '../../contexts/ThemeContext';
// import { Toaster } from '@/components/ui/sonner';
// import { toast } from 'sonner';

// const ServicesManager = () => {
//     const { t, language } = useLanguage();
//     const { theme } = useTheme();

//     const [services, setServices] = useState([]);
//     const [searchTerm, setSearchTerm] = useState('');
//     const [showForm, setShowForm] = useState(false);
//     const [editingService, setEditingService] = useState(null);
//     const [isSaving, setIsSaving] = useState(false);
//     const [deletingId, setDeletingId] = useState(null);
//     const [formData, setFormData] = useState({
//         ServiceTitle: '',
//         serviceDescription: '',
//         ServiceImages: [],
//         ServiceIcon: null,
//         product_ajwans: '',
//         service_items: ''
//     });
//     const [existingMedia, setExistingMedia] = useState({ 
//         imageIds: [], 
//         iconId: null, 
//         images: [], 
//         icon: null,
//         imagesToDelete: [] // جديد: لتخزين الصور المراد حذفها
//     });

//     // Load services from Strapi (with locale and preview)
//     const loadServices = async () => {
//         const TOKEN = localStorage.getItem('token');
//         try {
//             const url = language === 'ar'
//                 ? `http://localhost:1337/api/service-ajwains?populate=*&locale=ar-SA`
//                 : `http://localhost:1337/api/service-ajwains?populate=*`;
//             const res = await fetch(url, {
//                 headers: { 'Authorization': `Bearer ${TOKEN}` }
//             });
//             if (!res.ok) {
//                 const err = await res.text();
//                 throw new Error(`Failed to fetch services: ${res.status} ${err}`);
//             }
//             const json = await res.json();
//             const mapped = (json.data || []).map(item => {
//                 const attrs = item.attributes || item || {};
//                 return {
//                     id: item.id,
//                     documentId: attrs.documentId || item.documentId,
//                     ServiceTitle: attrs.ServiceTitle || item.ServiceTitle || '',
//                     serviceDescription: attrs.serviceDescription || item.serviceDescription || '',
//                     ServiceImages: attrs.ServiceImages?.data || item.ServiceImages || [],
//                     ServiceIcon: attrs.ServiceIcon?.data || item.ServiceIcon || null,
//                     product_ajwans: attrs.product_ajwans?.data || item.product_ajwans || [],
//                     service_items: attrs.service_items?.data || item.service_items || [],
//                     createdAt: ((attrs.createdAt || item.createdAt) || '').slice(0, 10)
//                 };
//             });
//             setServices(mapped);
//         } catch (e) {
//             console.error('loadServices error', e);
//             setServices([]);
//         }
//     };

//     useEffect(() => { loadServices(); }, [language]);

//     const normalizedTerm = (searchTerm || '').toLowerCase();
//     const filteredServices = services.filter(service => {
//         const title = (service.ServiceTitle || service.name || '').toLowerCase();
//         const description = (service.serviceDescription || service.description || '').toLowerCase();
//         return title.includes(normalizedTerm) || description.includes(normalizedTerm);
//     });

//     const handleAddService = () => {
//         setEditingService(null);
//         setFormData({
//             ServiceTitle: '',
//             serviceDescription: '',
//             ServiceImages: [],
//             ServiceIcon: null,
//             product_ajwans: '',
//             service_items: ''
//         });
//         setExistingMedia({ 
//             imageIds: [], 
//             iconId: null, 
//             images: [], 
//             icon: null,
//             imagesToDelete: [] 
//         });
//         setShowForm(true);
//     };

//     const handleEditService = (service) => {
//         setEditingService(service);
//         const imagesArray = Array.isArray(service.ServiceImages) ? service.ServiceImages : (service.ServiceImages?.data || []);
//         const iconArray = Array.isArray(service.ServiceIcon) ? service.ServiceIcon : (service.ServiceIcon?.data || []);
//         const imageIds = imagesArray.map(i => i.id).filter(Boolean);
//         const iconId = iconArray[0]?.id || null;
//         setExistingMedia({ 
//             imageIds, 
//             iconId, 
//             images: imagesArray, 
//             icon: iconArray[0] || null,
//             imagesToDelete: [] 
//         });
//         setFormData({
//             ServiceTitle: service.ServiceTitle || '',
//             serviceDescription: service.serviceDescription || '',
//             ServiceImages: [],
//             ServiceIcon: null,
//             product_ajwans: (service.product_ajwans || []).map(p => p.id).join(','),
//             service_items: (service.service_items || []).map(p => p.id).join(',')
//         });
//         setShowForm(true);
//     };

//     // دالة جديدة: حذف صورة موجودة
//     const handleRemoveExistingImage = (imageId) => {
//         setExistingMedia(prev => ({
//             ...prev,
//             images: prev.images.filter(img => img.id !== imageId),
//             imagesToDelete: [...prev.imagesToDelete, imageId]
//         }));
//     };

//     // دالة جديدة: حذف صورة جديدة تم اختيارها
//     const handleRemoveNewImage = (index) => {
//         setFormData(prev => ({
//             ...prev,
//             ServiceImages: prev.ServiceImages.filter((_, i) => i !== index)
//         }));
//     };

//     const handleSaveService = async () => {
//         if (isSaving) return;
//         setIsSaving(true);
//         const TOKEN = localStorage.getItem('token');
    
//         // التحقق من البيانات المطلوبة
//         if (!formData.ServiceTitle.trim()) {
//             toast.error(t('service_title_required') || 'Service title is required');
//             setIsSaving(false);
//             return;
//         }
    
//         // حذف الصور المحددة للحذف أولاً
//         if (existingMedia.imagesToDelete.length > 0) {
//             try {
//                 await Promise.all(
//                     existingMedia.imagesToDelete.map(async (imageId) => {
//                         const deleteResponse = await fetch(`http://localhost:1337/api/upload/files/${imageId}`, {
//                             method: 'DELETE',
//                             headers: {
//                                 'Authorization': `Bearer ${TOKEN}`
//                             }
//                         });
//                         if (!deleteResponse.ok) {
//                             console.error(`Failed to delete image ${imageId}`);
//                         }
//                     })
//                 );
//             } catch (error) {
//                 console.error('Error deleting images:', error);
//             }
//         }
    
//         const filesToUpload = [];
//         if (formData.ServiceImages && formData.ServiceImages.length > 0) {
//             for (const file of formData.ServiceImages) filesToUpload.push({ fieldName: 'ServiceImages', file });
//         }
//         if (formData.ServiceIcon) {
//             filesToUpload.push({ fieldName: 'ServiceIcon', file: formData.ServiceIcon });
//         }
        
//         let uploadedFiles = [];
//         if (filesToUpload.length > 0) {
//             const uploadFormData = new FormData();
//             filesToUpload.forEach(item => {
//                 uploadFormData.append('files', item.file);
//             });
    
//             try {
//                 const uploadResponse = await fetch('http://localhost:1337/api/upload', {
//                     method: 'POST',
//                     headers: {
//                         'Authorization': `Bearer ${TOKEN}`
//                     },
//                     body: uploadFormData,
//                 });
    
//                 if (!uploadResponse.ok) {
//                     const errorText = await uploadResponse.text();
//                     console.error('Upload failed:', uploadResponse.status, errorText);
//                     throw new Error('Image upload failed');
//                 }
    
//                 uploadedFiles = await uploadResponse.json();
    
//             } catch (error) {
//                 console.error('Error uploading images:', error);
//                 toast.error(t('upload_error') || 'Error uploading images');
//                 setIsSaving(false);
//                 return;
//             }
//         }
        
//         // إعداد البيانات النهائية بشكل صحيح
//         const finalData = { 
//             ServiceTitle: formData.ServiceTitle, 
//             serviceDescription: formData.serviceDescription,
//             // سنتعامل مع الصور والأيقونات بشكل منفصل
//         };
        
//         // معالجة الصور المرفوعة
//         if (uploadedFiles.length > 0) {
//             const imagesIds = [];
//             const originalImageNames = Array.isArray(formData.ServiceImages) ? formData.ServiceImages.map(f => f.name) : [];
//             const iconName = formData.ServiceIcon?.name;
            
//             for (const f of uploadedFiles) {
//                 if (iconName && f.name === iconName) {
//                     finalData.ServiceIcon = f.id;
//                 } else if (originalImageNames.includes(f.name)) {
//                     imagesIds.push(f.id);
//                 }
//             }
            
//             // إضافة الصور الجديدة إلى البيانات النهائية
//             if (imagesIds.length > 0) {
//                 finalData.ServiceImages = imagesIds;
//             }
//         }
        
//         // معالجة العلاقات - التأكد من أنها مصفوفات من الأرقام
//         if (formData.product_ajwans) {
//             const productIds = formData.product_ajwans.toString()
//                 .split(',')
//                 .map(s => s.trim())
//                 .filter(s => s !== '')
//                 .map(s => parseInt(s))
//                 .filter(n => !isNaN(n));
            
//             if (productIds.length > 0) {
//                 finalData.product_ajwans = productIds;
//             }
//         }
        
//         if (formData.service_items) {
//             const serviceItemsIds = formData.service_items.toString()
//                 .split(',')
//                 .map(s => s.trim())
//                 .filter(s => s !== '')
//                 .map(s => parseInt(s))
//                 .filter(n => !isNaN(n));
            
//             if (serviceItemsIds.length > 0) {
//                 finalData.service_items = serviceItemsIds;
//             }
//         }
    
//         // الحفاظ على الوسائط الموجودة عند التحديث إذا لم يتم استبدالها أو حذفها
//         if (editingService) {
//             if (!formData.ServiceIcon && existingMedia.iconId && !finalData.ServiceIcon) {
//                 finalData.ServiceIcon = existingMedia.iconId;
//             }
            
//             // إضافة الصور القديمة المتبقية (غير المحذوفة)
//             const remainingImages = existingMedia.images
//                 .filter(img => !existingMedia.imagesToDelete.includes(img.id))
//                 .map(img => img.id);
                
//             if (remainingImages.length > 0) {
//                 finalData.ServiceImages = finalData.ServiceImages 
//                     ? [...finalData.ServiceImages, ...remainingImages] 
//                     : remainingImages;
//             }
//         }
        
//         // التأكد من أن ServiceImages و ServiceIcon موجودين حتى لو كانوا فارغين
//         if (!finalData.ServiceImages) finalData.ServiceImages = [];
//         if (!finalData.ServiceIcon) finalData.ServiceIcon = null;
        
//         const payload = { data: finalData };
        
//         // تسجيل البيانات المرسلة للتdebug
//         console.log('Payload being sent:', payload);
        
//         try {
//             // تحديد endpoint و method المناسبين
//             let apiEndpoint = 'http://localhost:1337/api/service-ajwains';
//             let method = 'POST';
            
//             if (editingService) {
//                 if (editingService.documentId) {
//                     apiEndpoint = `http://localhost:1337/api/service-ajwains/${editingService.documentId}`;
//                     method = 'PUT';
//                 } else {
//                     apiEndpoint = `http://localhost:1337/api/service-ajwains/${editingService.id}`;
//                     method = 'PUT';
//                 }
//             }
    
//             const serviceResponse = await fetch(apiEndpoint, {
//                 method: method,
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${TOKEN}`
//                 },
//                 body: JSON.stringify(payload),
//             });
    
//             if (!serviceResponse.ok) {
//                 const errorData = await serviceResponse.json();
//                 console.error('Failed to save service data:', errorData);
                
//                 // عرض رسالة الخطأ للمستخدم
//                 const errorMessage = errorData.error?.message || 'Failed to save service data';
//                 toast.error(errorMessage);
                
//                 throw new Error('Failed to save service data');
//             }
    
//             const result = await serviceResponse.json();
//             console.log('Save successful:', result);
            
//             // إعادة تحميل القائمة بعد الحفظ
//             try { 
//                 await loadServices(); 
//             } catch (e) { 
//                 console.error('reload after save failed', e); 
//             }
            
//             setShowForm(false);
//             setEditingService(null);
//             setExistingMedia({ imageIds: [], iconId: null, images: [], icon: null, imagesToDelete: [] });
//             toast.success(editingService ? t('update') + ' ' + t('success') : t('save') + ' ' + t('success'));
    
//         } catch (error) {
//             console.error('Error saving service:', error);
//             toast.error(t('error') || 'Error while saving');
//         } finally {
//             setIsSaving(false);
//         }
//     };

//     const handleDeleteService = async (service) => {
//         const TOKEN = localStorage.getItem('token');
//         try {
//             setDeletingId(service.id || service.documentId);
//             const del = await fetch(`http://localhost:1337/api/service-ajwains/${service.documentId || service.id}`, {
//                 method: 'DELETE',
//                 headers: { 'Authorization': `Bearer ${TOKEN}` }
//             });
//             if (!del.ok) throw new Error('delete failed');
//             setServices(services.filter(s => s.documentId !== service.documentId && s.id !== service.id));
//             toast.success(t('deleted') || 'Deleted');
//         } catch (e) {
//             console.error(e);
//             toast.error(t('error') || 'Delete failed');
//         } finally {
//             setDeletingId(null);
//         }
//     };

//     const toggleServiceStatus = (id) => {
//         setServices(services.map(service =>
//             service.id === id
//                 ? { ...service, status: service.status === 'active' ? 'inactive' : 'active' }
//                 : service
//         ));
//     };

//     const containerVariants = {
//         hidden: { opacity: 0 },
//         visible: {
//             opacity: 1,
//             transition: {
//                 duration: 0.6,
//                 staggerChildren: 0.1
//             }
//         }
//     };

//     const itemVariants = {
//         hidden: { opacity: 0, y: 20 },
//         visible: {
//             opacity: 1,
//             y: 0,
//             transition: { duration: 0.5, ease: 'easeOut' }
//         }
//     };

//     const tableRowVariants = {
//         hidden: { opacity: 0, x: -20 },
//         visible: {
//             opacity: 1,
//             x: 0,
//             transition: { duration: 0.3 }
//         },
//         hover: {
//             backgroundColor: theme === 'dark' ? '#374151' : '#f9fafb',
//             transition: { duration: 0.2 }
//         }
//     };

//     const getMediaUrl = (media) => {
//         const base = 'http://localhost:1337';
//         if (!media) return null;
//         if (Array.isArray(media)) return getMediaUrl(media[0]);
//         const url = media.attributes?.url || media.url;
//         if (typeof url !== 'string') return null;
//         if (url.startsWith('http://') || url.startsWith('https://')) return url;
//         return `${base}${url}`;
//     };

//     // مكون جديد لعرض الصور مع زر الحذف
//     const ImageWithDelete = ({ image, onRemove, isExisting = false }) => {
//         const [isHovered, setIsHovered] = useState(false);
        
//         return (
//             <motion.div 
//                 className="relative inline-block m-1"
//                 onMouseEnter={() => setIsHovered(true)}
//                 onMouseLeave={() => setIsHovered(false)}
//                 whileHover={{ scale: 1.05 }}
//             >
//                 <img 
//                     src={isExisting ? getMediaUrl(image) : URL.createObjectURL(image)} 
//                     alt="preview" 
//                     className="w-16 h-16 object-cover rounded border"
//                 />
//                 <AnimatePresence>
//                     {isHovered && (
//                         <motion.button
//                             initial={{ opacity: 0, scale: 0.8 }}
//                             animate={{ opacity: 1, scale: 1 }}
//                             exit={{ opacity: 0, scale: 0.8 }}
//                             className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md"
//                             onClick={() => onRemove(isExisting ? image.id : image)}
//                             whileHover={{ scale: 1.1 }}
//                             whileTap={{ scale: 0.9 }}
//                         >
//                             <X className="w-3 h-3" />
//                         </motion.button>
//                     )}
//                 </AnimatePresence>
//             </motion.div>
//         );
//     };

//     return (
//         <motion.div
//             variants={containerVariants}
//             initial="hidden"
//             animate="visible"
//             className="space-y-6"
//         >
//             <Toaster />
//             <motion.div variants={itemVariants}>
//                 <div className="flex justify-between items-center">
//                     <div>
//                         <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('manage_services')}</h1>
//                         <p className="text-gray-600 mt-1 dark:text-gray-400">{t('manage_services_desc')}</p>
//                     </div>
//                     <motion.div
//                         whileHover={{ scale: 1.02 }}
//                         whileTap={{ scale: 0.98 }}
//                     >
//                         <Button
//                             onClick={handleAddService}
//                             className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800"
//                         >
//                             <Plus className="w-4 h-4 mr-2" />
//                             {t('add_new_service')}
//                         </Button>
//                     </motion.div>
//                 </div>
//             </motion.div>

//             <motion.div variants={itemVariants}>
//                 <Card className="shadow-sm border-0 dark:bg-gray-800 dark:text-white">
//                     <CardHeader>
//                         <div className="flex items-center justify-between">
//                             <CardTitle className="dark:text-white">{t('services_list')}</CardTitle>
//                             <div className="relative w-64">
//                                 <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
//                                 <Input
//                                     placeholder={t('search_services')}
//                                     value={searchTerm}
//                                     onChange={(e) => setSearchTerm(e.target.value)}
//                                     className="pl-10 dark:bg-gray-700 dark:text-white dark:border-gray-600"
//                                 />
//                             </div>
//                         </div>
//                     </CardHeader>
//                     <CardContent>
//                         <div className="overflow-x-auto">
//                             <table className="w-full">
//                                 <thead>
//                                     <tr className="border-b border-gray-200 dark:border-gray-700">
//                                         <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${language === 'ar' ? 'text-right' : 'text-left'}`}>Title</th>
//                                         <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${language === 'ar' ? 'text-right' : 'text-left'}`}>Description</th>
//                                         <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-center`}>Image</th>
//                                         <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-center`}>Icon</th>
//                                         <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t('created_at')}</th>
//                                         <th className={`py-3 px-4 font-medium text-gray-700 dark:text-gray-300 ${language === 'ar' ? 'text-center' : 'text-center'}`}>{t('actions')}</th>
//                                     </tr>
//                                 </thead>
//                                 <tbody>
//                                     <AnimatePresence>
//                                         {filteredServices.map((service, index) => (
//                                             <motion.tr
//                                                 key={service.id}
//                                                 variants={tableRowVariants}
//                                                 initial="hidden"
//                                                 animate="visible"
//                                                 exit="hidden"
//                                                 whileHover="hover"
//                                                 transition={{ delay: index * 0.1 }}
//                                                 className="border-b border-gray-100 dark:border-gray-700"
//                                             >
//                                                 <td className="py-4 px-4">
//                                                     <div className="font-medium text-gray-900 dark:text-white">{service.ServiceTitle || '-'}</div>
//                                                 </td>
//                                                 <td className="py-4 px-4">
//                                                     <div className="text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">
//                                                         {service.serviceDescription || '-'}
//                                                     </div>
//                                                 </td>
//                                                 <td className="py-4 px-4 text-center">
//                                                     {getMediaUrl(service.ServiceImages) ? (
//                                                         <img src={getMediaUrl(service.ServiceImages)} alt="service" className="inline-block w-12 h-12 object-cover rounded" />
//                                                     ) : (
//                                                         <span className="text-gray-400 text-sm">-</span>
//                                                     )}
//                                                 </td>
//                                                 <td className="py-4 px-4 text-center">
//                                                     {getMediaUrl(service.ServiceIcon) ? (
//                                                         <img src={getMediaUrl(service.ServiceIcon)} alt="icon" className="inline-block w-8 h-8 object-contain" />
//                                                     ) : (
//                                                         <span className="text-gray-400 text-sm">-</span>
//                                                     )}
//                                                 </td>
//                                                 <td className="py-4 px-4 text-gray-500 dark:text-gray-400">
//                                                     {service.createdAt}
//                                                 </td>
//                                                 <td className="py-4 px-4">
//                                                     <div className="flex items-center justify-center space-x-2">
//                                                         <motion.button
//                                                             whileHover={{ scale: 1.1 }}
//                                                             whileTap={{ scale: 0.9 }}
//                                                             onClick={() => handleEditService(service)}
//                                                             className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors dark:hover:bg-gray-700"
//                                                         >
//                                                             <Edit className="w-4 h-4" />
//                                                         </motion.button>
//                                                         <motion.button
//                                                             whileHover={{ scale: 1.1 }}
//                                                             whileTap={{ scale: 0.9 }}
//                                                             onClick={() => handleDeleteService(service)}
//                                                             disabled={deletingId === (service.id || service.documentId)}
//                                                             className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-gray-700 disabled:opacity-50"
//                                                         >
//                                                             <Trash2 className="w-4 h-4" />
//                                                         </motion.button>
//                                                     </div>
//                                                 </td>
//                                             </motion.tr>
//                                         ))}
//                                     </AnimatePresence>
//                                 </tbody>
//                             </table>
//                         </div>
//                     </CardContent>
//                 </Card>
//             </motion.div>

//             {/* Form Modal */}
//             <AnimatePresence>
//                 {showForm && (
//                     <motion.div
//                         initial={{ opacity: 0 }}
//                         animate={{ opacity: 1 }}
//                         exit={{ opacity: 0 }}
//                         className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
//                     >
//                         <motion.div
//                             initial={{ scale: 0.9, opacity: 0 }}
//                             animate={{ scale: 1, opacity: 1 }}
//                             exit={{ scale: 0.9, opacity: 0 }}
//                             transition={{ type: 'spring', damping: 25, stiffness: 300 }}
//                             className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:text-white"
//                         >
//                             <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
//                                 <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
//                                     {editingService ? t('edit_service') : t('add_new_service')}
//                                 </h2>
//                                 <motion.button
//                                     whileHover={{ scale: 1.1 }}
//                                     whileTap={{ scale: 0.9 }}
//                                     onClick={() => setShowForm(false)}
//                                     className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors dark:hover:bg-gray-700"
//                                 >
//                                     <X className="w-5 h-5" />
//                                 </motion.button>
//                             </div>

//                             <div className="p-6 space-y-4">
//                                 <motion.div
//                                     initial={{ opacity: 0, y: 10 }}
//                                     animate={{ opacity: 1, y: 0 }}
//                                     transition={{ delay: 0.1 }}
//                                 >
//                                     <Label htmlFor="serviceDescription" className="dark:text-gray-200">{t("service_description")}</Label>
//                                     <Textarea
//                                         id="serviceDescription"
//                                         value={formData.serviceDescription}
//                                         onChange={(e) => setFormData({ ...formData, serviceDescription: e.target.value })}
//                                         placeholder={t("enter_service_description")}
//                                         rows={4}
//                                         className="mt-1 transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
//                                     />
//                                 </motion.div>

//                                 <motion.div
//                                     initial={{ opacity: 0, y: 10 }}
//                                     animate={{ opacity: 1, y: 0 }}
//                                     transition={{ delay: 0.2 }}
//                                 >
//                                     <Label htmlFor="ServiceTitle" className="dark:text-gray-200">{t("service_title")}</Label>
//                                     <Input
//                                         id="ServiceTitle"
//                                         value={formData.ServiceTitle}
//                                         onChange={(e) => setFormData({ ...formData, ServiceTitle: e.target.value })}
//                                         placeholder={t("enter_service_title")}
//                                         className="mt-1 transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
//                                     />
//                                 </motion.div>

//                                 <motion.div
//                                     initial={{ opacity: 0, y: 10 }}
//                                     animate={{ opacity: 1, y: 0 }}
//                                     transition={{ delay: 0.3 }}
//                                 >
//                                     <Label htmlFor="ServiceImages" className="dark:text-gray-200">{t("service_images")}</Label>
//                                     <div className="mt-1 flex items-center space-x-2">
//                                         <Input
//                                             id="ServiceImages"
//                                             type="file"
//                                             accept="image/*"
//                                             multiple
//                                             onChange={(e) => setFormData({ 
//                                                 ...formData, 
//                                                 ServiceImages: [...formData.ServiceImages, ...Array.from(e.target.files || [])] 
//                                             })}
//                                             className="flex-grow transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
//                                         />
//                                         {Array.isArray(formData.ServiceImages) && formData.ServiceImages.length > 0 && (
//                                             <span className="text-sm text-gray-500 dark:text-gray-400">{formData.ServiceImages.length} file(s) selected</span>
//                                         )}
//                                     </div>
                                    
//                                     {/* عرض الصور الجديدة المختارة */}
//                                     {formData.ServiceImages.length > 0 && (
//                                         <div className="mt-3 flex flex-wrap">
//                                             {formData.ServiceImages.map((file, index) => (
//                                                 <ImageWithDelete 
//                                                     key={index} 
//                                                     image={file} 
//                                                     onRemove={() => handleRemoveNewImage(index)}
//                                                     isExisting={false}
//                                                 />
//                                             ))}
//                                         </div>
//                                     )}
                                    
//                                     {/* عرض الصور القديمة مع إمكانية الحذف */}
//                                     {editingService && existingMedia.images?.length > 0 && (
//                                         <div className="mt-3 flex flex-wrap">
//                                             {existingMedia.images.map((img) => (
//                                                 <ImageWithDelete 
//                                                     key={img.id} 
//                                                     image={img} 
//                                                     onRemove={handleRemoveExistingImage}
//                                                     isExisting={true}
//                                                 />
//                                             ))}
//                                         </div>
//                                     )}
//                                 </motion.div>

//                                 <motion.div
//                                     initial={{ opacity: 0, y: 10 }}
//                                     animate={{ opacity: 1, y: 0 }}
//                                     transition={{ delay: 0.35 }}
//                                 >
//                                     <Label htmlFor="ServiceIcon" className="dark:text-gray-200">{t("service_icon")}</Label>
//                                     <div className="mt-1 flex items-center space-x-2">
//                                         <Input
//                                             id="ServiceIcon"
//                                             type="file"
//                                             accept="image/*"
//                                             onChange={(e) => setFormData({ ...formData, ServiceIcon: e.target.files?.[0] || null })}
//                                             className="flex-grow transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
//                                         />
//                                         {formData.ServiceIcon && (
//                                             <span className="text-sm text-gray-500 dark:text-gray-400">{formData.ServiceIcon.name}</span>
//                                         )}
//                                     </div>
//                                     {editingService && existingMedia.icon && (
//                                         <div className="mt-3">
//                                             <img src={getMediaUrl(existingMedia.icon)} alt="icon-preview" className="w-12 h-12 object-contain" />
//                                         </div>
//                                     )}
//                                 </motion.div>

//                                 <motion.div
//                                     initial={{ opacity: 0, y: 10 }}
//                                     animate={{ opacity: 1, y: 0 }}
//                                     transition={{ delay: 0.4 }}
//                                 >
//                                     <Label htmlFor="product_ajwans" className="dark:text-gray-200">{t("product_ajwans")}</Label>
//                                     <Input
//                                         id="product_ajwans"
//                                         value={formData.product_ajwans}
//                                         onChange={(e) => setFormData({ ...formData, product_ajwans: e.target.value })}
//                                         placeholder={t("enter_related_products_comma_separated")}
//                                         className="mt-1 transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
//                                     />
//                                 </motion.div>

//                                 <motion.div
//                                     initial={{ opacity: 0, y: 10 }}
//                                     animate={{ opacity: 1, y: 0 }}
//                                     transition={{ delay: 0.45 }}
//                                 >
//                                     <Label htmlFor="service_items" className="dark:text-gray-200">{t("service_items")}</Label>
//                                     <Input
//                                         id="service_items"
//                                         value={formData.service_items}
//                                         onChange={(e) => setFormData({ ...formData, service_items: e.target.value })}
//                                         placeholder={t("enter_service_items_comma_separated")}
//                                         className="mt-1 transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
//                                     />
//                                 </motion.div>

//                             </div>

//                             <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
//                                 <Button
//                                     variant="outline"
//                                     onClick={() => setShowForm(false)}
//                                     className="mr-3 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
//                                 >
//                                     {t('cancel')}
//                                 </Button>
//                                 <motion.div
//                                     whileHover={{ scale: 1.02 }}
//                                     whileTap={{ scale: 0.98 }}
//                                 >
//                                     <Button
//                                         onClick={handleSaveService}
//                                         disabled={isSaving}
//                                         className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50"
//                                     >
//                                         <Save className="w-4 h-4 mr-2" />
//                                         {isSaving ? t('loading') || 'Loading...' : (editingService ? t('update') : t('save'))}
//                                     </Button>
//                                 </motion.div>
//                             </div>
//                         </motion.div>
//                     </motion.div>
//                 )}
//             </AnimatePresence>
//         </motion.div>
//     );
// };

// export default ServicesManager;