import { useGalleryStore } from '../store/galleryStore';
import { Check, AlertCircle } from 'lucide-react';

export default function Toast() {
  const { toastMessage, toastVisible, toastType } = useGalleryStore();

  if (!toastVisible) return null;

  const isError = toastType === 'error';

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] toast" style={{ minWidth: '200px' }}>
      <div className={`flex items-center gap-2 px-5 py-3 rounded-2xl backdrop-blur-xl shadow-xl ${
        isError
          ? 'bg-red-500/20 border border-red-500/40 text-red-300'
          : 'bg-green-500/20 border border-green-500/40 text-green-300'
      }`}>
        {isError
          ? <AlertCircle className="w-4 h-4 flex-shrink-0" />
          : <Check className="w-4 h-4 flex-shrink-0" />
        }
        <span className="text-sm font-medium">{toastMessage}</span>
      </div>
    </div>
  );
}
