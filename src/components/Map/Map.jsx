import React from 'react';
import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box } from '@mui/material';
import { theme } from '../../theme/theme';
import { useTranslation } from 'react-i18next';

// Custom marker icon
const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  shadowSize: [41, 41]
});

// Light-themed map tiles
const tileUrl = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

const Map = () => {
  const { t } = useTranslation();
  const position = [47.3769, 8.5417]; // Example coordinates (Zurich, Switzerland)
  const radius = 100; // Circle radius in meters

  return (
    <Box
      sx={{
        width: '50%',
        pb: 5,
        display: 'flex',
        flexDirection: 'column',
        [theme.breakpoints.down('md')]: {
          width: '100%'
        }
      }}
    >
      <Box
        sx={{
          height: '200px',
          border: `1px solid ${theme.palette.border.blue}`,
          borderRadius: '8px',
          overflow: 'hidden',
          p: 2,
          [theme.breakpoints.down('md')]: {
            flexGrow: 1
          }
        }}
      >
        <MapContainer
          center={position}
          zoom={15}
          style={{ width: '100%', height: '100%', borderRadius: '5px' }}
        >
          <TileLayer
            url={tileUrl}
            attribution='&copy; <a href="https://carto.com/attributions">{t('filing.carto')}</a> contributors'
          />
          <Marker position={position} icon={markerIcon} />
          <Circle center={position} radius={radius} color="#4285F4" />
        </MapContainer>
      </Box>
    </Box>
  );
};

export default Map;
