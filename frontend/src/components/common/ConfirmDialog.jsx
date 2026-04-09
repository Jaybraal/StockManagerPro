import { Bell } from 'lucide-react';
import Modal from './Modal';

/**
 * Confirmation dialog component
 */
const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  children,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmButtonClass = 'bg-red-600 hover:bg-red-700',
  icon: Icon = Bell
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} icon={Icon}>
      <div className="py-4 border-b border-dashed border-gray-200 dark:border-gray-600 mb-4">
        <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed">{message}</p>
        {children}
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={onClose}
          className="px-5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium"
        >
          {cancelText}
        </button>
        <button
          onClick={onConfirm}
          className={`px-5 py-2 text-white rounded-lg font-semibold shadow ${confirmButtonClass}`}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
