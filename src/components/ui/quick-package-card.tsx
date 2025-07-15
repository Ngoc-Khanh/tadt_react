import { useSetAtom } from 'jotai'
import { sidePanelOpenAtom, selectedPackageIdForPanelAtom } from '@/stores'
import { Button, Card, CardContent, Typography } from '@mui/material'
import React from 'react'

interface QuickPackageCardProps {
  packageId: string
  packageName: string
  status: string
  progress: number
}

/**
 * Component ví dụ cho thấy cách sử dụng atoms trực tiếp
 * để mở panel từ bất kỳ component nào trong ứng dụng
 */
export const QuickPackageCard: React.FC<QuickPackageCardProps> = ({
  packageId,
  packageName,
  status,
  progress
}) => {
  const setSidePanelOpen = useSetAtom(sidePanelOpenAtom)
  const setSelectedPackageId = useSetAtom(selectedPackageIdForPanelAtom)

  const handleViewDetails = () => {
    // Chỉ cần set packageId và mở panel
    setSelectedPackageId(packageId)
    setSidePanelOpen(true)
  }

  return (
    <Card className="mb-2">
      <CardContent>
        <Typography variant="h6" className="mb-1">
          {packageName}
        </Typography>
        <Typography variant="body2" color="text.secondary" className="mb-2">
          Trạng thái: {status} - Tiến độ: {progress}%
        </Typography>
        <Button 
          variant="outlined" 
          size="small" 
          onClick={handleViewDetails}
        >
          Xem chi tiết
        </Button>
      </CardContent>
    </Card>
  )
}
