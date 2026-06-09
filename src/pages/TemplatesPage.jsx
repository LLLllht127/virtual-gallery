import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight, Eye, Copy, PenLine } from 'lucide-react';
import { GALLERY_TEMPLATES, CATEGORIES, generateGalleryUrl } from '../data/galleries';
import { useGalleryStore } from '../store/galleryStore';

export default function TemplatesPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { showToast } = useGalleryStore();

  const filtered = GALLERY_TEMPLATES.filter(t => {
    const matchCategory = activeCategory === 'all' || t.category === activeCategory;
    const matchSearch = !searchQuery || 
      t.name.includes(searchQuery) || 
      t.description.includes(searchQuery) ||
      t.tags.some(tag => tag.includes(searchQuery));
    return matchCategory && matchSearch;
  });

  const handleCopyLink = async (e, templateId) => {
    e.preventDefault();
    e.stopPropagation();
    const url = generateGalleryUrl(templateId);
    try { await navigator.clipboard.writeText(url); }
    catch {
      const ta = document.createElement('textarea');
      ta.value = url; document.body.appendChild(ta);
      ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    }
    showToast('展厅链接已复制！');
  };

  return (
    <div className="min-h-screen bg-[#0a0a14] pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-6">
        {/* 页头 */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary-600/20 border border-primary-500/30 rounded-full px-4 py-1.5 text-sm text-primary-300 mb-6">
            🎨 {GALLERY_TEMPLATES.length}+ 精选模板，持续更新
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            展厅<span className="gradient-text">样本库</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            选择喜欢的模板风格，填充自己的作品内容，三步即可发布专属 3D 展厅
          </p>
          <Link to="/create" className="btn-primary inline-flex items-center gap-2 mt-6 text-base px-8 py-4">
            <PenLine className="w-5 h-5" />
            创建我的展厅
          </Link>
        </div>

        {/* 搜索 + 筛选工具栏 */}
        <div className="flex flex-col md:flex-row gap-4 mb-10">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索展厅名称、标签..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/60 focus:bg-white/10 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeCategory === cat.id
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="text-gray-500 text-sm mb-6">
          共找到 <span className="text-primary-400 font-medium">{filtered.length}</span> 个展厅模板
        </div>

        {filtered.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(template => (
              <div key={template.id} className="template-card card-glass rounded-2xl overflow-hidden group">
                {/* 封面图 */}
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={template.thumbnail}
                    alt={template.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  
                  {/* 分类标签 */}
                  <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
                    <span className="bg-primary-600/80 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm font-medium">
                      {template.categoryLabel}
                    </span>
                  </div>

                  {/* 悬停操作 */}
                  <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                    <Link
                      to={`/gallery/${template.id}`}
                      className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-lg"
                    >
                      <Eye className="w-4 h-4" />
                      预览
                    </Link>
                    <button
                      onClick={(e) => handleCopyLink(e, template.id)}
                      className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors backdrop-blur-sm border border-white/30"
                    >
                      <Copy className="w-4 h-4" />
                      复制链接
                    </button>
                  </div>

                  {/* 展位数量 */}
                  <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                    {template.spotCount || template.artworks.length} 展位
                  </div>
                </div>

                {/* 内容 */}
                <div className="p-5">
                  <h3 className="text-white font-bold text-lg mb-1.5">{template.name}</h3>
                  <p className="text-gray-400 text-sm mb-4 leading-relaxed">{template.description}</p>
                  
                  {/* 标签 */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {template.tags.map(tag => (
                      <span key={tag} className="bg-white/5 text-gray-400 text-xs px-2.5 py-1 rounded-full border border-white/10">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* 色彩预览 */}
                  <div className="flex items-center gap-1.5 mb-4">
                    <span className="text-gray-600 text-xs">色调：</span>
                    {[template.wallColor, template.floorColor, template.spotlightColor].map((c, i) => (
                      <div key={i} className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: c }} />
                    ))}
                  </div>

                  {/* 底部操作 */}
                  <div className="flex gap-3">
                    <Link
                      to={`/gallery/${template.id}`}
                      className="btn-secondary text-sm py-2.5 px-4 flex items-center gap-1.5"
                    >
                      <Eye className="w-4 h-4" />
                      预览
                    </Link>
                    <Link
                      to="/create"
                      className="flex-1 btn-primary text-sm py-2.5 text-center flex items-center justify-center gap-1.5"
                    >
                      <PenLine className="w-4 h-4" />
                      用此风格创建
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-white mb-2">没有找到相关展厅</h3>
            <p className="text-gray-400">试试换个关键词或分类</p>
            <button
              onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
              className="mt-6 btn-secondary text-sm"
            >
              清除筛选
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
