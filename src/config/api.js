// API Configuration
// استخدام السيرفر البعيد مباشرة
const USE_LOCAL_API = import.meta.env.VITE_USE_LOCAL_API === 'true';

export const API_CONFIG = {
  BASE_URL: USE_LOCAL_API 
    ? 'http://localhost:1337/api' 
    : 'https://ajwan-back-end.onrender.com/api'
};

// إضافة رسالة تحذيرية
if (USE_LOCAL_API) {
  console.log('🔧 Using LOCAL API server: http://localhost:1337/api');
} else {
  console.log('🌐 Using REMOTE API server: https://ajwan-back-end.onrender.com/api');
  console.log('⚠️ Note: Remote server may be slow and have CORS issues');
  console.log('💡 If you encounter CORS errors, the server needs to allow requests from localhost:5173');
}

// Helper function to get full API URL
export const getApiUrl = (endpoint = '') => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to make API calls with CORS handling
export const makeApiCall = async (endpoint, options = {}) => {
  const url = getApiUrl(endpoint);
  
  // إضافة headers افتراضية للتعامل مع CORS
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers: defaultHeaders,
      mode: 'cors', // محاولة التعامل مع CORS
      credentials: 'omit'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};
