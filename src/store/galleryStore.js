import { create } from 'zustand';

export const useGalleryStore = create((set, get) => ({
  // 当前选中的模板
  currentTemplate: null,
  // 分享链接
  shareUrl: '',
  // Toast 消息
  toastMessage: '',
  toastVisible: false,
  toastType: 'success', // 'success' | 'error'
  // 导航状态
  isNavOpen: false,

  setCurrentTemplate: (template) => set({ currentTemplate: template }),
  
  setShareUrl: (url) => set({ shareUrl: url }),

  showToast: (message, type = 'success') => {
    set({ toastMessage: message, toastVisible: true, toastType: type });
    setTimeout(() => set({ toastVisible: false }), 3000);
  },

  toggleNav: () => set(s => ({ isNavOpen: !s.isNavOpen })),
  closeNav: () => set({ isNavOpen: false }),
}));
