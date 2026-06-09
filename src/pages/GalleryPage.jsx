import { Suspense, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Share2, Info, Eye, Maximize2,
  ChevronLeft, ChevronRight, List, X, Clock
} from 'lucide-react';
import { getGalleryById, generateGalleryUrl, GALLERY_TEMPLATES, getUserGalleries } from '../data/galleries';
import GalleryScene from '../components/GalleryScene';
import ShareModal from '../components/ShareModal';

function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-[#0a0a14] flex flex-col items-center justify-center z-50">
      <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center mb-6 animate-float">
        <span className="text-3xl">🏛</span>
      </div>
      <p className="text-white text-lg font-medium mb-2">正在加载展厅...</p>
      <p className="text-gray-500 text-sm">首次加载可能需要几秒钟</p>
      <div className="mt-6 w-48 h-1 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full animate-pulse" style={{ width: '60%' }} />
      </div>
    </div>
  );
}

export default function GalleryPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const gallery = getGalleryById(id);
  const [shareOpen, setShareOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  if (!gallery) {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🏚</div>
          <h2 className="text-2xl font-bold text-white mb-2">展厅不存在</h2>
          <p className="text-gray-400 mb-6">该展厅链接已失效或不存在</p>
          <Link to="/templates" className="btn-primary">浏览样本库</Link>
        </div>
      </div>
    );
  }

  const galleryUrl = generateGalleryUrl(gallery);
  const isUserGallery = gallery.id.startsWith('user-');

  // 上一个 / 下一个（模板 + 用户展厅合并后的全部ID）
  const templateIds = GALLERY_TEMPLATES.map(t => t.id);
  const userIds = getUserGalleries().map(g => g.id);
  const allIds = [...templateIds, ...userIds];
  const currentIdx = allIds.indexOf(id);
  const prevId = currentIdx > 0 ? allIds[currentIdx - 1] : null;
  const nextId = currentIdx < allIds.length - 1 ? allIds[currentIdx + 1] : null;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setFullscreen(!fullscreen);
  };

  // 格式化日期
  const formatDate = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#0a0a14] relative">
      {/* 3D 场景 */}
      <Suspense fallback={<LoadingScreen />}>
        <GalleryScene template={gallery} />
      </Suspense>

      {/* 顶部 HUD 工具栏 */}
      <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
        <div className="flex items-center justify-between p-4 md:p-6">
          {/* 左侧 */}
          <div className="flex items-center gap-3 pointer-events-auto">
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 rounded-xl bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm border border-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-2 hidden md:block">
              <div className="flex items-center gap-1.5">
                {isUserGallery && <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">我的展厅</span>}
                <span className="text-xs text-gray-400">当前展厅</span>
              </div>
              <div className="text-white font-medium text-sm">{gallery.name}</div>
            </div>
          </div>

          {/* 右侧：操作按钮 */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => setInfoOpen(!infoOpen)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm border border-white/10 transition-colors text-sm"
            >
              <Info className="w-4 h-4" />
              <span className="hidden md:inline">展厅信息</span>
            </button>
            <button
              onClick={() => setShareOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white transition-colors text-sm font-semibold shadow-lg"
            >
              <Share2 className="w-4 h-4" />
              <span>分享展厅</span>
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2.5 rounded-xl bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm border border-white/10 transition-colors"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 底部导航 */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
        {prevId && (
          <Link
            to={`/gallery/${prevId}`}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm border border-white/10 text-sm transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            上一个
          </Link>
        )}
        <Link
          to="/templates"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm border border-white/10 text-sm transition-colors"
        >
          <List className="w-4 h-4" />
          全部展厅
        </Link>
        {nextId && (
          <Link
            to={`/gallery/${nextId}`}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm border border-white/10 text-sm transition-colors"
          >
            下一个
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* 展厅信息侧边栏 */}
      {infoOpen && (
        <div className="absolute top-20 right-4 md:right-6 z-30 w-80 card-glass rounded-2xl p-5 animate-slide-up border border-white/15 max-h-[80vh] overflow-y-auto">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-white font-bold text-lg">{gallery.name}</h3>
            <button onClick={() => setInfoOpen(false)} className="text-gray-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-gray-400 text-sm mb-4 leading-relaxed">{gallery.description}</p>
          
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">分类</span>
              <span className="bg-primary-600/30 text-primary-300 px-2 py-0.5 rounded-full text-xs">{gallery.categoryLabel}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">展品数量</span>
              <span className="text-white">{gallery.artworks.length} 件</span>
            </div>
            {isUserGallery && gallery.createdAt && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">创建时间</span>
                <span className="text-white text-xs flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(gallery.createdAt)}
                </span>
              </div>
            )}
          </div>

          {gallery.tags && gallery.tags.length > 0 && (
            <div className="mb-4">
              <div className="text-gray-500 text-xs mb-2">标签</div>
              <div className="flex flex-wrap gap-1.5">
                {gallery.tags.map(tag => (
                  <span key={tag} className="bg-white/5 text-gray-400 text-xs px-2 py-0.5 rounded-full border border-white/10">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mb-4">
            <div className="text-gray-500 text-xs mb-2">展品列表</div>
            <div className="space-y-2">
              {gallery.artworks.map(aw => (
                <div key={aw.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                  <img
                    src={aw.image}
                    alt={aw.title}
                    className="w-10 h-8 object-cover rounded-md flex-shrink-0"
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-xs font-medium">{aw.title}</div>
                    <div className="text-gray-500 text-xs">{aw.artist}</div>
                    {aw.description && <div className="text-gray-600 text-[10px] mt-0.5 truncate">{aw.description}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => { setShareOpen(true); setInfoOpen(false); }}
            className="w-full btn-primary text-sm py-2.5 flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            分享此展厅
          </button>
        </div>
      )}

      {/* 操作提示 */}
      <div className="absolute bottom-20 left-4 md:left-6 z-20">
        <div className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-xs text-gray-400 space-y-1">
          <div>⌨️ WASD / 方向键 — 移动</div>
          <div>🖱 鼠标 — 视角转向</div>
          <div>🖱 点击画作 — 查看详情</div>
          <div>ESC — 退出漫游</div>
        </div>
      </div>

      {/* 分享弹窗 */}
      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        galleryUrl={galleryUrl}
        galleryName={gallery.name}
      />
    </div>
  );
}
