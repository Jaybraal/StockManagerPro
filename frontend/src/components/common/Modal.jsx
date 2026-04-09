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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full ${maxWidth} p-6 md:p-8 relative max-h-[90vh] overflow-y-auto`}>
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Cerrar"
          >
            <X size={22} className="text-gray-500 dark:text-gray-400" />
          </button>
        )}

        {title && (
          <h2 className="text-2xl font-bold mb-6 text-blue-700 dark:text-blue-400 flex items-center gap-2">
            {Icon && <Icon className="inline-block" size={24} />}
            {title}
          </h2>
        )}

        {children}
      </div>
    </div>
  );
};

export default Modal;
