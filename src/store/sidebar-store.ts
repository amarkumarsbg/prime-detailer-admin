"use client";

import { create } from "zustand";

interface SidebarState {
  collapsed: boolean;
  toggle: () => void;
  collapse: () => void;
  expand: () => void;
  mobileOpen: boolean;
  openMobile: () => void;
  closeMobile: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  collapsed: false,
  toggle: () => set((s) => ({ collapsed: !s.collapsed })),
  collapse: () => set({ collapsed: true }),
  expand: () => set({ collapsed: false }),
  mobileOpen: false,
  openMobile: () => set({ mobileOpen: true }),
  closeMobile: () => set({ mobileOpen: false }),
}));
