import { useState } from 'react';
import { Check, Copy, ExternalLink, Share2, X } from 'lucide-react';
import { useGalleryStore } from '../store/galleryStore';

export default function ShareModal({ isOpen, onClose, galleryUrl, galleryName }) {
  const [copied, setCopied] = useState(false);
  const { showToast } = useGalleryStore();

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(galleryUrl);
      setCopied(true);
      showToast('链接已复制到剪贴板！');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 兼容不支持 clipboard API 的情况
      const ta = document.createElement('textarea');
      ta.value = galleryUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      showToast('链接已复制！');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenNew = () => {
    window.open(galleryUrl, '_blank', 'noopener,noreferrer');
  };

  const shareOptions = [
    {
      icon: '💬',
      label: '微信',
      action: () => showToast('请截图后分享至微信'),
    },
    {
      icon: '🔗',
      label: 'QQ',
      action: () => showToast('请截图后分享至 QQ'),
    },
    {
      icon: '🐦',
      label: '微博',
      action: () => {
        window.open(`http://v.t.sina.com.cn/share/share.php?url=${encodeURIComponent(galleryUrl)}&title=${encodeURIComponent('来参观我的3D虚拟展厅：' + galleryName)}`, '_blank');
      },
    },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* 遮罩 */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 弹窗 */}
      <div className="relative card-glass rounded-3xl p-8 w-full max-w-lg shadow-2xl animate-slide-up border border-white/20">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg animate-float">
            <Share2 className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">分享展厅</h3>
          <p className="text-gray-400 text-sm">将链接分享给好友，他们可以在任意浏览器中浏览</p>
        </div>

        {/* 展厅名称 */}
        <div className="bg-white/5 rounded-xl p-3 mb-4 flex items-center gap-3 border border-white/10">
          <span className="text-2xl">🏛</span>
          <div>
            <div className="text-xs text-gray-400">展厅名称</div>
            <div className="text-white font-medium">{galleryName}</div>
          </div>
        </div>

        {/* 链接框 */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-1 mb-5 flex items-center gap-2">
          <div className="flex-1 px-3 py-2 text-sm text-gray-300 truncate font-mono">
            {galleryUrl}
          </div>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              copied
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-primary-600 hover:bg-primary-500 text-white'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? '已复制' : '复制'}
          </button>
        </div>

        {/* 在新标签页打开 */}
        <button
          onClick={handleOpenNew}
          className="w-full btn-secondary mb-5 flex items-center justify-center gap-2 text-sm"
        >
          <ExternalLink className="w-4 h-4" />
          在新标签页打开展厅
        </button>

        {/* 社交分享 */}
        <div>
          <div className="text-xs text-gray-500 text-center mb-3">分享至</div>
          <div className="flex justify-center gap-3">
            {shareOptions.map(opt => (
              <button
                key={opt.label}
                onClick={opt.action}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-white/10 transition-colors"
              >
                <span className="text-2xl">{opt.icon}</span>
                <span className="text-xs text-gray-400">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 提示 */}
        <p className="text-center text-xs text-gray-500 mt-4">
          此链接可在任意浏览器打开，无需登录即可浏览
        </p>
      </div>
    </div>
  );
}
