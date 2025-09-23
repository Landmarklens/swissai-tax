'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box, Typography, CircularProgress } from '@mui/material';
import { theme } from '../../../theme/theme';
import { ArrowUpRight } from '../../../assets/svg/ArrowUpRight';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

// Custom marker icon
const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  shadowSize: [41, 41]
});

const tileUrl = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

const Location = (props) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [position, setPosition] = useState([47.2607, 8.5964]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const radius = 100;

  const geocodeLocation = async (locationName) => {
    if (!locationName || locationName.trim() === '') {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);

      // Add country bias for Switzerland and add headers
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)},Switzerland&countrycodes=ch&limit=1`,
        {
          headers: {
            'User-Agent': 'HomeAI/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch location data');
      }

      const data = await response.json();

      if (data && data.length > 0) {
        const lat = Number.parseFloat(data[0].lat);
        const lon = Number.parseFloat(data[0].lon);
        setPosition([lat, lon]);
      } else {
        // Fallback to default Switzerland coordinates if location not found
        console.warn(`Location "${locationName}" not found, using default position`);
        setPosition([47.2607, 8.5964]); // Keep default position
      }
    } catch (err) {
      setError(err.message || 'Failed to geocode location');
      console.error('Geocoding error:', err);
      // Keep default position on error
      setPosition([47.2607, 8.5964]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (props.locationName) {
      geocodeLocation(props.locationName);
    }
  }, [props.locationName]);

  return (
    <Box
      sx={{
        width: props.width ? props.width : '100%',
        pb: props.padding ? props.padding : 0,
        display: 'flex',
        flexDirection: 'column',
        [theme.breakpoints.down('md')]: {
          width: '100%'
        }
      }}>
      <Typography
        variant="h6"
        sx={{
          display: props.title ? 'flex' : 'none'
        }}
        gutterBottom>
        {props.title}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '24px',
          width: '100%'
        }}>
        <Box
          sx={{
            height: '230px',
            border: `1px solid ${theme.palette.border.blue}`,
            borderRadius: '8px',
            overflow: 'hidden',
            width: '100%',
            p: 2,
            position: 'relative',
            [theme.breakpoints.down('md')]: {
              flexGrow: 1
            }
          }}>
          {loading && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 1000,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                borderRadius: '4px',
                p: 2
              }}>
              <CircularProgress size={24} />
              <Typography variant="body2" sx={{ mt: 1 }}>
                Loading location...
              </Typography>
            </Box>
          )}

          {error && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 1000,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '4px',
                p: 2,
                textAlign: 'center'
              }}>
              <Typography variant="body2" color="error">
                {error}
              </Typography>
            </Box>
          )}

          <MapContainer
            center={position}
            zoom={15}
            style={{ width: '100%', height: '100%', borderRadius: '5px' }}
            key={`${position[0]}-${position[1]}`}>
            <TileLayer
              url={tileUrl}
              attribution='&copy; <a href="https://carto.com/attributions">Carto</a> contributors'
            />
            <Marker position={position} icon={markerIcon} />
            <Circle center={position} radius={radius} color="#4285F4" />
          </MapContainer>
        </Box>
        {/* {!props.hideContact && (
          <Typography
            onClick={() => navigate('/contact-us')}
            sx={{ whiteSpace: 'nowrap', cursor: 'pointer' }}>
            {t('Contact information')}
            <Typography
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                color: '#3E63DD',
                marginLeft: '4px'
              }}>
              {t('here')}
              <ArrowUpRight />
            </Typography>
          </Typography>
        )} */}
      </Box>
    </Box>
  );
};

export { Location };
