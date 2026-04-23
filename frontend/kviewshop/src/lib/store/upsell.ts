'use client'

import { create } from 'zustand'
import type { UpsellContext } from '@/lib/pricing/v3/errors'

interface UpsellModalStore {
  isOpen: boolean
  context: UpsellContext | null
  open: (context: UpsellContext) => void
  close: () => void
}

export const useUpsellModal = create<UpsellModalStore>((set) => ({
  isOpen: false,
  context: null,
  open: (context) => set({ isOpen: true, context }),
  close: () => set({ isOpen: false, context: null }),
}))
