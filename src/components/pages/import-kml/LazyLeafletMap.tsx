import React, { Suspense, lazy } from 'react'
import { Box, CircularProgress, Typography } from '@mui/material'
import type { LayerGroup } from '../../../stores/importKMLAtoms'

// Lazy load LeafletMap component
const LeafletMap = lazy(() => 
  import('./LeafletMap').then(module => ({ default: module.LeafletMap }))
)

interface LazyLeafletMapProps {
  layerGroups: LayerGroup[]
  height?: string | number
  onLayoutChange?: boolean
}

// Loading component
const MapLoading = () => (
  <Box 
    sx={{ 
      height: '100%',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      bgcolor: 'grey.50',
      borderRadius: 2,
      flexDirection: 'column',
      gap: 2
    }}
  >
    <CircularProgress size={60} thickness={4} />
    <Typography variant="h6" color="text.secondary">
      Đang tải bản đồ...
    </Typography>
  </Box>
)

// Error fallback component
const MapError = ({ error, retry }: { error: Error, retry: () => void }) => (
  <Box 
    sx={{ 
      height: '100%',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      bgcolor: 'error.light',
      borderRadius: 2,
      flexDirection: 'column',
      gap: 2,
      p: 3
    }}
  >
    <Typography variant="h6" color="error.main">
      Không thể tải bản đồ
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
      {error.message}
    </Typography>
    <button 
      onClick={retry}
      style={{ 
        padding: '8px 16px', 
        borderRadius: 4, 
        border: 'none', 
        backgroundColor: '#1976d2', 
        color: 'white',
        cursor: 'pointer'
      }}
    >
      Thử lại
    </button>
  </Box>
)

// Error boundary class component
class MapErrorBoundary extends React.Component<
  { children: React.ReactNode; onRetry: () => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; onRetry: () => void }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[MapErrorBoundary] Map rendering error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return <MapError error={this.state.error} retry={this.props.onRetry} />
    }

    return this.props.children
  }
}

// Main component
export const LazyLeafletMap = React.memo<LazyLeafletMapProps>(({ 
  layerGroups, 
  height = '100%', 
  onLayoutChange 
}) => {
  const [retryKey, setRetryKey] = React.useState(0)

  const handleRetry = React.useCallback(() => {
    setRetryKey(prev => prev + 1)
  }, [])

  return (
    <MapErrorBoundary key={retryKey} onRetry={handleRetry}>
      <Suspense fallback={<MapLoading />}>
        <LeafletMap 
          layerGroups={layerGroups}
          height={height}
          onLayoutChange={onLayoutChange}
        />
      </Suspense>
    </MapErrorBoundary>
  )
})

LazyLeafletMap.displayName = 'LazyLeafletMap' 