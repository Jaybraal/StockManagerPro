import { X } from 'lucide-react';

/**
 * Reusable Modal component
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  icon: Icon,
  children,
  maxWidth = 'max-w-md',
  showCloseButton = true
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 pb-16 sm:pb-4">
      <div className={`bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full ${maxWidth} p-4 sm:p-6 relative max-h-[85vh] sm:max-h-[92vh] overflow-y-auto`}>
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Cerrar"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        )}

        {title && (
          <h2 className="text-base font-semibold mb-4 text-gray-800 dark:text-gray-100 flex items-center gap-2 pr-8">
            {Icon && <Icon size={16} className="text-blue-600 dark:text-blue-400" />}
            {title}
          </h2>
        )}

        {children}
      </div>
    </div>
  );
};

export default Modal;
