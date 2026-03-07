import { useSelector, useDispatch } from 'react-redux';
import { useCallback, useRef } from 'react';
import { showToast, hideToast } from '../store/uiSlice';

export const useToast = () => {
  const dispatch = useDispatch();
  const { toast } = useSelector((state) => state.ui);
  const timeoutRef = useRef(null);

  const showToastMessage = useCallback((message, type = 'info') => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    dispatch(showToast({ message, type }));
    
    // Auto hide after 3 seconds
    timeoutRef.current = setTimeout(() => {
      dispatch(hideToast());
      timeoutRef.current = null;
    }, 3000);
  }, [dispatch]);

  const hideToastMessage = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    dispatch(hideToast());
  }, [dispatch]);

  const success = useCallback((message) => showToastMessage(message, 'success'), [showToastMessage]);
  const error = useCallback((message) => showToastMessage(message, 'error'), [showToastMessage]);
  const warning = useCallback((message) => showToastMessage(message, 'warning'), [showToastMessage]);
  const info = useCallback((message) => showToastMessage(message, 'info'), [showToastMessage]);

  return {
    toast,
    addToast: showToastMessage,
    show: showToastMessage,
    hide: hideToastMessage,
    success,
    error,
    warning,
    info,
  };
};
