import type { IMapMockResponse } from '@/constants/mock';
import { Layers } from '@mui/icons-material';
import { Box, Button } from '@mui/material';
import { useCallback } from 'react';

interface LayerButtonProps {
  anchorEl: HTMLElement | null
  setAnchorEl: React.Dispatch<React.SetStateAction<HTMLElement | null>>
  isAnimating: boolean
  setIsAnimating: React.Dispatch<React.SetStateAction<boolean>>
  open: boolean
  data: IMapMockResponse[]
}

export function LayerButton({ anchorEl, setAnchorEl, isAnimating, setIsAnimating, open, data }: LayerButtonProps) {
  const handleClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    if (isAnimating) return
    setIsAnimating(true)
    setAnchorEl(anchorEl ? null : event.currentTarget)
    setTimeout(() => setIsAnimating(false), 200)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchorEl, isAnimating])

  return (
    <Box className="absolute top-5 left-5 z-[1000]">
      <Box className="relative">
        <Button
          onClick={handleClick}
          variant="contained"
          disabled={isAnimating}
          sx={{
            minWidth: 48,
            width: 48,
            height: 48,
            borderRadius: 3,
            bgcolor: open ? 'primary.dark' : 'background.paper',
            color: open ? 'white' : 'text.primary',
            border: open ? 'none' : '1px solid',
            borderColor: 'divider',
            boxShadow: open ? 3 : 2,
            '&:hover': {
              bgcolor: open ? 'primary.dark' : 'grey.100',
              transform: 'translateY(-1px)',
              boxShadow: open ? 4 : 3
            },
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <Layers fontSize="medium" />
        </Button>

        {data && (
          <Box
            sx={{
              position: 'absolute',
              top: -8,
              right: -8,
              minWidth: 20,
              height: 20,
              borderRadius: '50%',
              bgcolor: 'error.main',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              border: '2px solid white',
              boxShadow: 2,
              zIndex: 10,
            }}
          >
            {/* Tổng số geometry của tất cả vùng và package */}
            {data.reduce((sum, zone) => {
              let geomCount = (zone.geometry?.length || 0);
              if (zone.packages) {
                geomCount += zone.packages.reduce((pkgSum, pkg) => pkgSum + (pkg.geometry?.length || 0), 0);
              }
              return sum + geomCount;
            }, 0)}
          </Box>
        )}
      </Box>
    </Box>
  )
}