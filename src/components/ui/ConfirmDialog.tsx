// src/components/ui/ConfirmDialog.tsx
import React, { createContext, useState, useContext, useCallback, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';
import { Transition, TransitionChild } from '@headlessui/react';

// Context untuk mengelola state dialog
interface ConfirmDialogContextType {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    onConfirm: () => void;
    onCancel: () => void;
    variant: 'danger' | 'primary';
    openConfirmDialog: (options: ConfirmDialogOptions) => void;
    closeConfirmDialog: () => void;
}

interface ConfirmDialogOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel?: () => void;
    variant?: 'danger' | 'primary';
}

const initialState: ConfirmDialogContextType = {
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Ya',
    cancelText: 'Batal',
    onConfirm: () => { },
    onCancel: () => { },
    variant: 'primary',
    openConfirmDialog: () => { },
    closeConfirmDialog: () => { }
};

const ConfirmDialogContext = createContext<ConfirmDialogContextType>(initialState);

// Provider untuk modal
export const ConfirmDialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [dialogState, setDialogState] = useState<Omit<ConfirmDialogContextType, 'openConfirmDialog' | 'closeConfirmDialog'>>(initialState);

    // Fungsi untuk membuka dialog
    const openConfirmDialog = useCallback((options: ConfirmDialogOptions) => {
        setDialogState({
            isOpen: true,
            title: options.title,
            message: options.message,
            confirmText: options.confirmText || 'Ya',
            cancelText: options.cancelText || 'Batal',
            onConfirm: options.onConfirm,
            onCancel: options.onCancel || (() => { }),
            variant: options.variant || 'primary'
        });
    }, []);

    // Fungsi untuk menutup dialog
    const closeConfirmDialog = useCallback(() => {
        setDialogState(state => ({
            ...state,
            isOpen: false
        }));
    }, []);

    return (
        <ConfirmDialogContext.Provider
            value={{
                ...dialogState,
                openConfirmDialog,
                closeConfirmDialog
            }}
        >
            {children}
            <ConfirmDialogComponent />
        </ConfirmDialogContext.Provider>
    );
};

// Hook untuk menggunakan confirm dialog
// eslint-disable-next-line react-refresh/only-export-components
export const useConfirmDialog = () => {
    const context = useContext(ConfirmDialogContext);
    if (!context) {
        throw new Error('useConfirmDialog must be used within a ConfirmDialogProvider');
    }
    return context;
};

// Komponen dialog
const ConfirmDialogComponent: React.FC = () => {
    const {
        isOpen,
        title,
        message,
        confirmText,
        cancelText,
        onConfirm,
        onCancel,
        variant,
        closeConfirmDialog
    } = useContext(ConfirmDialogContext);

    const handleConfirm = () => {
        onConfirm();
        closeConfirmDialog();
    };

    const handleCancel = () => {
        onCancel();
        closeConfirmDialog();
    };

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            handleCancel();
        }
    };

    // Gunakan portal untuk merender dialog di luar hierarki komponen
    return createPortal(
        <Transition show={isOpen} as={Fragment}>
            <div
                className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto"
                onClick={handleBackdropClick} // Backdrop click handler remains here
            >
                {/* Backdrop transition */}
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
                    aria-hidden="true"
                />

                {/* Dialog panel transition */}
                <TransitionChild
                    as={Fragment}
                    enter="transition-all duration-300 ease-out"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="transition-all duration-200 ease-in"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                >
                    <div
                        className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
                    >
                        <div className="text-lg font-semibold mb-2">{title}</div>
                        <div className="text-gray-600 mb-6">{message}</div>

                        <div className="flex justify-end space-x-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCancel}
                            >
                                {cancelText}
                            </Button>
                            <Button
                                type="button"
                                variant={variant}
                                onClick={handleConfirm}
                            >
                                {confirmText}
                            </Button>
                        </div>
                    </div>
                </TransitionChild>
            </div>
        </Transition>,
        document.body
    );
};

export default ConfirmDialogProvider;