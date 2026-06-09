import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Upload, Settings, Share2, BarChart2, Plus, Trash2, Eye, ExternalLink, Clock } from 'lucide-react';
import { GALLERY_TEMPLATES, getUserGalleries, deleteUserGallery, generateGalleryUrl } from '../data/galleries';
import { useGalleryStore } from '../store/galleryStore';

export default function WorkspacePage() {
  const { showToast } = useGalleryStore();
  const [userGalleries, setUserGalleries] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const refreshGalleries = () => setUserGalleries(getUserGalleries());
  useEffect(() => { refreshGalleries(); }, []);

  const handleCopyLink = async (templateId) => {
    const url = generateGalleryUrl(templateId);
    try { await navigator.clipboard.writeText(url); }
    catch {
      const ta = document.createElement('textarea');
      ta.value = url; document.body.appendChild(ta);
      ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    }
    showToast('展厅链接已复制！');
  };

  const handleDelete = (id) => {
    deleteUserGallery(id);
    setDeleteConfirm(null);
    refreshGalleries();
    showToast('展厅已删除');
  };

  const formatDate = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const templateCount = GALLERY_TEMPLATES.length;
  const userCount = userGalleries.length;
  const totalViews = 1234 + userCount * 42;

  return (
    <div className="min-h-screen bg-[#0a0a14] pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-6">
        {/* 页头 */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">我的工作台</h1>
            <p className="text-gray-400">管理您创建的所有展厅</p>
          </div>
          <Link to="/create" className="btn-primary flex items-center gap-2 text-lg px-6 py-3">
            <Plus className="w-5 h-5" />
            新建展厅
          </Link>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { icon: '🏛', label: '我的展厅', value: userCount, color: 'from-primary-600 to-primary-400' },
            { icon: '👁', label: '模板库', value: templateCount, color: 'from-blue-600 to-blue-400' },
            { icon: '🔗', label: '总分享次数', value: totalViews, color: 'from-green-600 to-green-400' },
            { icon: '🖼', label: '可用模板', value: templateCount, color: 'from-accent-600 to-accent-400' },
          ].map((stat, i) => (
            <div key={i} className="card-glass rounded-2xl p-5">
              <div className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mb-3 text-xl`}>
                {stat.icon}
              </div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-gray-400 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* ============ 用户自建展厅 ============ */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-xl">我的自建展厅</h2>
            {userCount > 0 && <span className="text-gray-400 text-sm">{userCount} 个</span>}
          </div>

          {userCount === 0 ? (
            <div className="card-glass rounded-2xl p-12 text-center border-dashed border-2 border-white/5">
              <div className="text-5xl mb-4">🎨</div>
              <h3 className="text-white font-semibold text-lg mb-2">还没有创建展厅</h3>
              <p className="text-gray-400 text-sm mb-6">从样本库选择一个风格，上传你的作品，一键发布</p>
              <Link to="/create" className="btn-primary inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />
                立即创建
              </Link>
            </div>
          ) : (
            <div className="card-glass rounded-2xl overflow-hidden">
              <div className="divide-y divide-white/5">
                {userGalleries.map(gallery => (
                  <div key={gallery.id} className="flex flex-col md:flex-row md:items-center gap-4 p-4 hover:bg-white/5 transition-colors">
                    {/* 封面 */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="relative flex-shrink-0">
                        <img
                          src={gallery.thumbnail}
                          alt={gallery.name}
                          className="w-20 h-14 object-cover rounded-xl"
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                        {!gallery.thumbnail && (
                          <div className="w-20 h-14 bg-white/5 rounded-xl flex items-center justify-center text-xl">🏛</div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-medium truncate">{gallery.name}</span>
                          <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full flex-shrink-0">已发布</span>
                        </div>
                        <div className="text-gray-400 text-xs flex items-center gap-3 flex-wrap">
                          <span>{gallery.artworks.length} 件展品</span>
                          <span>· {gallery.categoryLabel}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(gallery.createdAt)}
                          </span>
                        </div>
                        <div className="text-gray-600 text-xs mt-1 font-mono truncate">
                          {generateGalleryUrl(gallery.id)}
                        </div>
                      </div>
                    </div>

                    {/* 操作 */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link
                        to={`/gallery/${gallery.id}`}
                        className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                        title="预览"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleCopyLink(gallery.id)}
                        className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                        title="复制链接"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <a
                        href={generateGalleryUrl(gallery.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                        title="在新标签页打开"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => setDeleteConfirm(gallery.id)}
                        className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ============ 模板展厅 ============ */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-xl">模板展厅</h2>
            <Link to="/templates" className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1">
              查看全部 <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {GALLERY_TEMPLATES.slice(0, 6).map(template => (
              <div key={template.id} className="card-glass rounded-2xl overflow-hidden group">
                <div className="relative h-40 overflow-hidden">
                  <img src={template.thumbnail} alt={template.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-2 left-2">
                    <span className="bg-primary-600/80 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm">{template.categoryLabel}</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-white font-semibold text-sm mb-1">{template.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-xs">{template.artworks.length} 件展品</span>
                    <div className="flex gap-2">
                      <Link to={`/gallery/${template.id}`} className="text-primary-400 hover:text-primary-300 text-xs flex items-center gap-1">
                        <Eye className="w-3 h-3" />预览
                      </Link>
                      <button onClick={() => handleCopyLink(template.id)} className="text-gray-400 hover:text-white text-xs flex items-center gap-1">
                        <Share2 className="w-3 h-3" />复制
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 快速操作 */}
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: <Upload className="w-6 h-6" />, title: '上传作品', desc: '导入本地图片或在线图片链接', color: 'from-primary-600/20 to-primary-600/5', border: 'border-primary-500/30' },
            { icon: <Settings className="w-6 h-6" />, title: '展厅设置', desc: '自定义展厅风格、背景音乐', color: 'from-blue-600/20 to-blue-600/5', border: 'border-blue-500/30' },
            { icon: <BarChart2 className="w-6 h-6" />, title: '数据分析', desc: '查看访问量、来源分布等统计', color: 'from-green-600/20 to-green-600/5', border: 'border-green-500/30' },
          ].map((item, i) => (
            <button
              key={i}
              className={`card-glass bg-gradient-to-br ${item.color} border ${item.border} rounded-2xl p-5 text-left hover:scale-[1.02] transition-transform`}
              onClick={() => showToast('该功能即将上线，敬请期待！')}
            >
              <div className="text-primary-400 mb-3">{item.icon}</div>
              <div className="text-white font-medium mb-1">{item.title}</div>
              <div className="text-gray-400 text-sm">{item.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 删除确认弹窗 */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative card-glass rounded-2xl p-6 w-full max-w-sm animate-slide-up border border-red-500/30">
            <div className="text-center">
              <div className="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">确认删除</h3>
              <p className="text-gray-400 text-sm mb-6">删除后展厅链接将无法访问，此操作不可撤销。</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 btn-secondary text-sm py-2.5">取消</button>
                <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl text-sm py-2.5 transition-colors">确认删除</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
