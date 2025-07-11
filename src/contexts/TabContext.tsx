import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

interface TabContextType {
  activeTab: number
  setActiveTab: (tab: number) => void
  navigateToMap: () => void
  navigateToImport: () => void
  navigateToProject: () => void
}

const TabContext = createContext<TabContextType | undefined>(undefined)

interface TabProviderProps {
  children: ReactNode
}

export function TabProvider({ children }: TabProviderProps) {
  const [activeTab, setActiveTab] = useState(0)

  const navigateToMap = () => setActiveTab(0)
  const navigateToImport = () => setActiveTab(1)
  const navigateToProject = () => setActiveTab(2)

  const value: TabContextType = {
    activeTab,
    setActiveTab,
    navigateToMap,
    navigateToImport,
    navigateToProject
  }

  return (
    <TabContext.Provider value={value}>
      {children}
    </TabContext.Provider>
  )
}

export function useTabNavigation() {
  const context = useContext(TabContext)
  if (!context) {
    throw new Error('useTabNavigation must be used within a TabProvider')
  }
  return context
} 