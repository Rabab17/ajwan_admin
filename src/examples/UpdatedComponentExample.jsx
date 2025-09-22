import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLoader, InlineLoader } from '../components/ui/Loader';
import { SuccessAlert, ErrorAlert } from '../components/ui/Alert';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationContainer } from '../components/ui/NotificationContainer';
import { useApi } from '../hooks/useApi';
import { getApiUrl } from '../config/api';

/**
 * مثال على كيفية تحديث أي مكون لاستخدام المكونات الموحدة
 * هذا المثال يوضح أفضل الممارسات لاستخدام:
 * 1. متغيرات البيئة للـ API
 * 2. مكونات الـ Loader الموحدة
 * 3. نظام الرسائل والتنبيهات الموحد
 * 4. Hook الـ API المخصص
 */
const UpdatedComponentExample = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // استخدام نظام الرسائل الموحد
  const { notifications, showSuccess, showError, removeNotification } = useNotifications();
  
  // استخدام hook الـ API المخصص
  const { get, post, loading: apiLoading, error: apiError } = useApi();

  // تحميل البيانات
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // استخدام متغير البيئة بدلاً من URL مباشر
      const response = await fetch(getApiUrl('/example-data'));
      const result = await response.json();
      
      setData(result);
      showSuccess('تم تحميل البيانات بنجاح');
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
      showError('فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (itemData) => {
    try {
      setSaving(true);
      
      // استخدام hook الـ API
      const result = await post('/example-data', itemData);
      
      setData(prev => [...prev, result]);
      showSuccess('تم الحفظ بنجاح!');
    } catch (error) {
      console.error('خطأ في الحفظ:', error);
      showError('فشل في حفظ البيانات');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      // استخدام hook الـ API
      await fetch(getApiUrl(`/example-data/${id}`), {
        method: 'DELETE'
      });
      
      setData(prev => prev.filter(item => item.id !== id));
      showSuccess('تم الحذف بنجاح');
    } catch (error) {
      console.error('خطأ في الحذف:', error);
      showError('فشل في حذف البيانات');
    }
  };

  // عرض صفحة التحميل أثناء تحميل البيانات الأولي
  if (loading) {
    return <PageLoader message="جاري تحميل البيانات..." />;
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>مثال على المكون المحدث</CardTitle>
        </CardHeader>
        <CardContent>
          {/* عرض رسالة خطأ إذا كان هناك خطأ في الـ API */}
          {apiError && (
            <ErrorAlert 
              title="خطأ في الاتصال" 
              message={apiError}
              className="mb-4"
            />
          )}

          {/* قائمة البيانات */}
          <div className="space-y-4">
            {data.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 border rounded">
                <span>{item.name}</span>
                <div className="space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                  >
                    حذف
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* زر الحفظ مع Loader */}
          <div className="mt-6">
            <Button 
              onClick={() => handleSave({ name: 'عنصر جديد' })}
              disabled={saving}
              className="w-full"
            >
              {saving ? (
                <>
                  <InlineLoader size="small" className="mr-2" />
                  جاري الحفظ...
                </>
              ) : (
                'إضافة عنصر جديد'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* حاوي الرسائل والتنبيهات */}
      <NotificationContainer 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </div>
  );
};

export default UpdatedComponentExample;
