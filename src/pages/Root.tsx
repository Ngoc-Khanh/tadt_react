import { ImportKMLSection } from "@/components/pages/importKMLSection";
import { MapSection } from "@/components/pages/mapSection";
import { ProjectManagementSection } from "@/components/pages/projectManagementSection";
import { a11yProps, CustomTabPanel } from "@/components/ui/tabs";
import { TabProvider, useTabNavigation } from "@/contexts/TabContext";
import { Box, Tab, Tabs } from "@mui/material";
import React from "react";

function RootContent() {
  const { activeTab, setActiveTab } = useTabNavigation();

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={handleChange}
          aria-label="main navigation tabs"
          variant="fullWidth"
          centered
        >
          <Tab label="Bản đồ" {...a11yProps(0)} />
          <Tab label="Import KML/KMZ" {...a11yProps(1)} />
          <Tab label="Quản lý dự án" {...a11yProps(2)} />
        </Tabs>
      </Box>
      <CustomTabPanel value={activeTab} index={0}>
        <MapSection />
      </CustomTabPanel>
      <CustomTabPanel value={activeTab} index={1}>
        <ImportKMLSection />
      </CustomTabPanel>
      <CustomTabPanel value={activeTab} index={2}>
        <ProjectManagementSection />
      </CustomTabPanel>
    </Box>
  )
}

export default function RootPage() {
  return (
    <TabProvider>
      <RootContent />
    </TabProvider>
  )
}