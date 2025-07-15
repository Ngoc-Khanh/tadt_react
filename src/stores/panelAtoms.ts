import { atom } from 'jotai'

export const sidePanelOpenAtom = atom<boolean>(false)
export const selectedPackageIdForPanelAtom = atom<string | null>(null)
export const selectedZoneAtom = atom<string | null>(null)
export const selectedPackageAtom = atom<string | null>(null)
