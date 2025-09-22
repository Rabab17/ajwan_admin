# مكونات UI موحدة

هذا المجلد يحتوي على مكونات UI موحدة يمكن استخدامها في جميع أنحاء المشروع.

## المكونات المتاحة

### 1. Loader Components

#### `Loader`
مكون تحميل أساسي مع أحجام مختلفة.

```jsx
import { Loader, PageLoader, InlineLoader } from '../ui/Loader';

// استخدام أساسي
<Loader size="medium" />

// صفحة تحميل كاملة
<PageLoader message="جاري التحميل..." />

// تحميل داخل النص
<InlineLoader size="small" />
```

**الأحجام المتاحة:**
- `small`: 16x16px
- `medium`: 32x32px  
- `large`: 48x48px
- `xlarge`: 64x64px

### 2. Alert Components

#### `Alert`
مكون تنبيهات أساسي مع أنواع مختلفة.

```jsx
import { Alert, SuccessAlert, ErrorAlert, WarningAlert, InfoAlert } from '../ui/Alert';

// استخدام أساسي
<Alert type="success" title="نجح!" message="تم الحفظ بنجاح" />

// استخدام مخصص
<SuccessAlert title="تم!" message="تم إنشاء الحساب بنجاح" />
<ErrorAlert title="خطأ!" message="حدث خطأ في الاتصال" />
<WarningAlert title="تحذير!" message="تأكد من صحة البيانات" />
<InfoAlert title="معلومة" message="سيتم تحديث البيانات قريباً" />
```

**الأنواع المتاحة:**
- `success`: أخضر - للنجاح
- `error`: أحمر - للأخطاء
- `warning`: أصفر - للتحذيرات
- `info`: أزرق - للمعلومات

#### `Toast`
رسائل منبثقة تختفي تلقائياً.

```jsx
import { Toast } from '../ui/Alert';

<Toast 
  type="success" 
  message="تم الحفظ بنجاح!" 
  duration={3000}
  onClose={() => console.log('تم الإغلاق')}
/>
```

### 3. Notification System

#### `useNotifications` Hook
Hook لإدارة الرسائل والتنبيهات.

```jsx
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationContainer } from '../ui/NotificationContainer';

const MyComponent = () => {
  const { 
    notifications, 
    showSuccess, 
    showError, 
    showWarning, 
    showInfo,
    removeNotification 
  } = useNotifications();

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
      
      {/* حاوي الرسائل */}
      <NotificationContainer 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </div>
  );
};
```

### 4. API Configuration

#### `getApiUrl` Function
دالة للحصول على URL الـ API من متغيرات البيئة.

```jsx
import { getApiUrl } from '../../config/api';

// استخدام أساسي
const url = getApiUrl('/users');

// مع معاملات
const url = getApiUrl('/users?page=1&limit=10');
```

## متغيرات البيئة

تأكد من وجود ملف `.env` في جذر المشروع:

```env
VITE_API_URL=http://localhost:1337/api
```

## الاستخدام المقترح

1. **استبدال جميع استخدامات `http://localhost:1337/api` بـ `getApiUrl()`**
2. **استخدام `PageLoader` أثناء تحميل البيانات**
3. **استخدام `useNotifications` لإظهار رسائل النجاح والخطأ**
4. **استخدام `InlineLoader` في الأزرار أثناء العمليات**

## مثال كامل

```jsx
import { useState } from 'react';
import { PageLoader, InlineLoader } from '../ui/Loader';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationContainer } from '../ui/NotificationContainer';
import { getApiUrl } from '../../config/api';

const MyComponent = () => {
  const [loading, setLoading] = useState(false);
  const { notifications, showSuccess, showError, removeNotification } = useNotifications();

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch(getApiUrl('/data'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ /* data */ })
      });
      
      if (response.ok) {
        showSuccess('تم الحفظ بنجاح!');
      } else {
        showError('حدث خطأ في الحفظ');
      }
    } catch (error) {
      showError('خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <PageLoader message="جاري التحميل..." />;
  }

  return (
    <div>
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? <InlineLoader size="small" /> : 'حفظ'}
      </button>
      
      <NotificationContainer 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </div>
  );
};
```
