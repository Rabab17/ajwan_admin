# دليل التحديث - استخدام متغيرات البيئة والمكونات الموحدة

## التغييرات المنجزة ✅

### 1. إعداد متغيرات البيئة
- ✅ تم إنشاء ملف `.env` مع متغير `VITE_API_URL=http://localhost:1337/api`
- ✅ تم إنشاء ملف `src/config/api.js` لإدارة إعدادات الـ API
- ✅ تم تحديث جميع الملفات لاستخدام متغير البيئة بدلاً من URL مباشر

### 2. المكونات الموحدة الجديدة
- ✅ `src/components/ui/Loader.jsx` - مكونات التحميل الموحدة
- ✅ `src/components/ui/Alert.jsx` - مكونات التنبيهات والرسائل الموحدة
- ✅ `src/hooks/useNotifications.js` - Hook لإدارة الرسائل
- ✅ `src/hooks/useApi.js` - Hook مخصص لاستدعاءات الـ API
- ✅ `src/components/ui/NotificationContainer.jsx` - حاوي الرسائل

### 3. الملفات المحدثة
- ✅ `src/components/auth/LoginPage.jsx`
- ✅ `src/components/content/ServicesManager.jsx`
- ✅ `src/components/content/ProjectsManager.jsx`
- ✅ `src/components/content/ServiceItemManager.jsx`
- ✅ `src/components/content/MessagesManager.jsx`
- ✅ `src/components/content/UsersManager.jsx`
- ✅ `src/components/content/TestimonialsManager.jsx`
- ✅ `src/components/content/UploadForm.jsx`

## كيفية استخدام المكونات الجديدة

### 1. استبدال URLs المباشرة

**قبل:**
```jsx
const response = await fetch("http://localhost:1337/api/users");
```

**بعد:**
```jsx
import { getApiUrl } from '../../config/api';

const response = await fetch(getApiUrl("/users"));
```

### 2. استخدام مكونات التحميل الموحدة

**قبل:**
```jsx
{loading && <div>جاري التحميل...</div>}
```

**بعد:**
```jsx
import { PageLoader, InlineLoader } from '../ui/Loader';

// للصفحة كاملة
{loading && <PageLoader message="جاري التحميل..." />}

// داخل الأزرار
<Button disabled={saving}>
  {saving ? <InlineLoader size="small" /> : 'حفظ'}
</Button>
```

### 3. استخدام نظام الرسائل الموحد

**قبل:**
```jsx
import Swal from "sweetalert2";
Swal.fire('نجح!', 'تم الحفظ بنجاح', 'success');
```

**بعد:**
```jsx
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationContainer } from '../ui/NotificationContainer';

const MyComponent = () => {
  const { notifications, showSuccess, showError, removeNotification } = useNotifications();

  const handleSave = async () => {
    try {
      // منطق الحفظ
      showSuccess('تم الحفظ بنجاح!');
    } catch (error) {
      showError('حدث خطأ في الحفظ');
    }
  };

  return (
    <div>
      {/* محتوى المكون */}
      <NotificationContainer 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </div>
  );
};
```

## الخطوات التالية المطلوبة

### 1. تحديث باقي الملفات (اختياري)
يمكنك تطبيق نفس النمط على أي ملفات أخرى تحتاج تحديث:

```bash
# البحث عن جميع استخدامات localhost:1337
grep -r "localhost:1337" src/
```

### 2. تحديث متغير البيئة للإنتاج
عند النشر، غيّر قيمة `VITE_API_URL` في ملف `.env`:

```env
# للتطوير
VITE_API_URL=http://localhost:1337/api

# للإنتاج
VITE_API_URL=https://your-production-api.com/api
```

### 3. اختبار التحديثات
1. تأكد من أن جميع الصفحات تعمل بشكل صحيح
2. اختبر رسائل النجاح والخطأ
3. تأكد من عمل مكونات التحميل

## الملفات المرجعية

- `src/examples/UpdatedComponentExample.jsx` - مثال كامل على الاستخدام
- `src/components/ui/README.md` - دليل تفصيلي للمكونات
- `src/config/api.js` - إعدادات الـ API

## ملاحظات مهمة

1. **متغيرات البيئة**: يجب أن تبدأ بـ `VITE_` لتعمل مع Vite
2. **الرسائل**: النظام الجديد يدعم الرسائل المتعددة والاختفاء التلقائي
3. **التحميل**: مكونات التحميل متجاوبة وتدعم أحجام مختلفة
4. **التوافق**: جميع المكونات متوافقة مع النظام الحالي ولا تحتاج تغييرات كبيرة

## الدعم

إذا واجهت أي مشاكل:
1. تأكد من وجود ملف `.env` في جذر المشروع
2. تأكد من إعادة تشغيل خادم التطوير بعد إضافة متغيرات البيئة
3. تحقق من console للأخطاء
