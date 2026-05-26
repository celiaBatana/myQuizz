import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [xpToast, setXpToast] = useState({ show: false, msg: '' });
  const [successToast, setSuccessToast] = useState({ show: false, msg: '' });

  const showXP = useCallback((msg) => {
    setXpToast({ show: true, msg });
    setTimeout(() => setXpToast({ show: false, msg: '' }), 1800);
  }, []);

  const showSuccess = useCallback((msg) => {
    setSuccessToast({ show: true, msg });
    setTimeout(() => setSuccessToast({ show: false, msg: '' }), 2200);
  }, []);

  return (
    <ToastContext.Provider value={{ showXP, showSuccess }}>
      {children}
      <div className={`toast ${xpToast.show ? 'show' : ''}`}>{xpToast.msg}</div>
      <div className={`toast-success ${successToast.show ? 'show' : ''}`}>{successToast.msg}</div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

// Composant inline pour le Layout (wrappé dans AuthProvider)
export default function Toast() {
  return null; // Les toasts sont gérés par ToastProvider
}
