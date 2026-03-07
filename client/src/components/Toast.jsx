import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { COLORS } from '../utils/constants';
import { hideToast } from '../store/uiSlice';

const Toast = () => {
  const dispatch = useDispatch();
  const { toast } = useSelector((state) => state.ui);

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        dispatch(hideToast());
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [toast.show, dispatch]);

  const getToastColor = (type) => {
    switch (type) {
      case 'success':
        return COLORS.success;
      case 'error':
        return COLORS.error;
      case 'warning':
        return COLORS.warning;
      case 'info':
      default:
        return COLORS.info;
    }
  };

  const getToastIcon = (type) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  return (
    <AnimatePresence>
      {toast.show && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            top: '2rem',
            right: '2rem',
            zIndex: 9999,
            backgroundColor: COLORS.surface,
            border: `2px solid ${getToastColor(toast.type)}`,
            borderRadius: '12px',
            padding: '1rem 1.5rem',
            minWidth: '300px',
            maxWidth: '400px',
            boxShadow: `0 8px 24px ${getToastColor(toast.type)}40`,
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <span
            style={{
              fontSize: '1.5rem',
              flexShrink: 0,
            }}
          >
            {getToastIcon(toast.type)}
          </span>
          <div
            style={{
              flex: 1,
              color: COLORS.text,
              fontSize: '0.95rem',
              lineHeight: '1.4',
            }}
          >
            {toast.message}
          </div>
          <button
            onClick={() => dispatch(hideToast())}
            style={{
              background: 'none',
              border: 'none',
              color: COLORS.textSecondary,
              fontSize: '1.2rem',
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: '4px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = COLORS.surfaceLight;
              e.target.style.color = COLORS.text;
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = COLORS.textSecondary;
            }}
          >
            ×
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;
