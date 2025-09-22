import { useState, useCallback } from 'react';
import { getApiUrl } from '../config/api';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiCall = useCallback(async (endpoint, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const url = getApiUrl(endpoint);
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const get = useCallback((endpoint, options = {}) => {
    return apiCall(endpoint, { ...options, method: 'GET' });
  }, [apiCall]);

  const post = useCallback((endpoint, data, options = {}) => {
    return apiCall(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }, [apiCall]);

  const put = useCallback((endpoint, data, options = {}) => {
    return apiCall(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }, [apiCall]);

  const del = useCallback((endpoint, options = {}) => {
    return apiCall(endpoint, { ...options, method: 'DELETE' });
  }, [apiCall]);

  return {
    loading,
    error,
    apiCall,
    get,
    post,
    put,
    delete: del,
  };
};
