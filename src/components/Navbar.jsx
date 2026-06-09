import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';

const NAV_LINKS = [
  { label: '首页', path: '/' },
  { label: '样本库', path: '/templates' },
  { label: '工作台', path: '/workspace' },
  { label: '关于我们', path: '/about' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productDropdown, setProductDropdown] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#0a0a14]/90 nav-backdrop border-b border-white/10 shadow-2xl'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <span className="text-white text-lg">🏛</span>
              </div>
              <span className="font-bold text-xl text-white">
                虚拟<span className="gradient-text">展厅平台</span>
              </span>
            </Link>

            {/* 桌面端导航 */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(link.path)
                      ? 'bg-primary-600/30 text-primary-300 shadow-sm'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {/* 产品服务下拉 */}
              <div
                className="relative"
                onMouseEnter={() => setProductDropdown(true)}
                onMouseLeave={() => setProductDropdown(false)}
              >
                <button className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200">
                  产品服务
                  <ChevronDown className={`w-4 h-4 transition-transform ${productDropdown ? 'rotate-180' : ''}`} />
                </button>

                {productDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-64 card-glass rounded-2xl shadow-2xl p-2 border border-white/10">
                    {[
                      { icon: '🖼', label: '3D 虚拟展厅', desc: '沉浸式三维漫游体验', path: '/templates' },
                      { icon: '🌐', label: 'VR 全景展示', desc: '360° 全景交互体验', path: '/templates' },
                      { icon: '📊', label: '数据可视化', desc: '动态数据图表展示', path: '/templates' },
                      { icon: '🎨', label: '艺术画廊', desc: '艺术家专属展示空间', path: '/templates' },
                    ].map(item => (
                      <Link
                        key={item.label}
                        to={item.path}
                        className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors"
                      >
                        <span className="text-2xl mt-0.5">{item.icon}</span>
                        <div>
                          <div className="text-sm font-medium text-white">{item.label}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{item.desc}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 右侧 CTA */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/workspace"
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors px-3 py-2"
              >
                进入工作台
              </Link>
              <Link
                to="/templates"
                className="btn-primary text-sm py-2.5 px-5"
              >
                创建 3D 展厅
              </Link>
            </div>

            {/* 移动端汉堡 */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* 移动端菜单 */}
        <div
          className={`md:hidden transition-all duration-300 overflow-hidden ${
            mobileOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="bg-[#0a0a14]/95 nav-backdrop border-t border-white/10 px-4 py-4 space-y-1">
            {NAV_LINKS.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? 'bg-primary-600/30 text-primary-300'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-white/10 space-y-2">
              <Link to="/workspace" className="btn-secondary block text-center text-sm py-3">
                进入工作台
              </Link>
              <Link to="/templates" className="btn-primary block text-center text-sm py-3">
                创建 3D 展厅
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
