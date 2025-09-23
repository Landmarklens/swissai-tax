import React from 'react';
import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';
import L from 'leaflet';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

import 'leaflet/dist/leaflet.css';

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  shadowSize: [41, 41]
});

export const HomeDetailsMap = () => {
  const { t } = useTranslation();

  const position = [47.3769, 8.5417]; // Example coordinates (Zurich, Switzerland)
  const radius = 200; // Circle radius in meters

  return (
    <Box sx={{ width: '100%', height: '100%', px: 6 }}>
      <Typography variant="h6" gutterBottom>
        {t('Location')}
      </Typography>
      <Box
        sx={{
          width: '100%',
          height: '450px',
          border: '1px solid #E0E0E0',
          borderRadius: '8px',
          overflow: 'hidden'
        }}
      >
        <MapContainer center={position} zoom={15} style={{ height: '450px', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <Marker position={position} icon={markerIcon} />
          <Circle center={position} radius={radius} color="#4285F4" />
        </MapContainer>
      </Box>
    </Box>
  );
};
