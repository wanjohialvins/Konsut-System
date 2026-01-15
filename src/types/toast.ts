// src/types/toast.ts

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
    id: string;
    type: ToastType;
    message: string;
}

export interface ToastContextType {
    showToast: (type: ToastType, message: string) => void;
}
