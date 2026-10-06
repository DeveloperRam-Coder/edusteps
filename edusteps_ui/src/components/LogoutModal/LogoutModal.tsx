import Button from '../../components/Button/Button';
import { LuLogOut } from 'react-icons/lu';

interface LogoutModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function LogoutModal({ isOpen, onConfirm, onCancel, isLoading = false }: LogoutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-primary/40 flex items-center justify-center z-50 animate-fadeIn" onClick={onCancel}>
      <div className="bg-white rounded-lg p-6 md:p-7.5 lg:p-7.5 max-w-96 w-11/12 shadow-2xl animate-slideUp border-2 border-gray-200" onClick={(e) => e.stopPropagation()}>
        <div className="text-5xl text-center mb-4 animate-bounce"><LuLogOut className="w-12 h-12 mx-auto text-indigo-500" /></div>

        <h2
          className="text-lg md:text-xl lg:text-2xl font-bold text-gray-800 mb-2 md:mb-2.5 lg:mb-3 text-center"
        >
          Log Out?
        </h2>

        <p
          className="text-sm md:text-base lg:text-base text-gray-600 mb-6 md:mb-7.5 lg:mb-7.5 text-center"
        >
          Are you sure you want to Log Out? You will need to log in again to access your account.
        </p>

        <div className="flex gap-3 md:flex-col lg:flex-col">
          <Button
            title="Cancel"
            onClick={onCancel}
            disabled={isLoading}
            size="md"
            fullWidth
          />
          <Button
            title="Log Out"
            onClick={onConfirm}
            loading={isLoading}
            disabled={isLoading}
            size="md"
            fullWidth
          />
        </div>
      </div>
    </div>
  );
}
