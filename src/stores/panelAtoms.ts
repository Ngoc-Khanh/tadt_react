import { atom } from 'jotai'

// Atom để quản lý trạng thái mở/đóng của side panel
export const sidePanelOpenAtom = atom<boolean>(false)

// Atom để quản lý packageId được chọn cho panel detail
export const selectedPackageIdForPanelAtom = atom<string | null>(null)

// Atom để quản lý zone được chọn
export const selectedZoneAtom = atom<string | null>(null)

// Atom để quản lý package được chọn (cho popup)
export const selectedPackageAtom = atom<string | null>(null)
