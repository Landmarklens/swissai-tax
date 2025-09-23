import React, { useEffect, useState, useRef } from 'react';
import { TextField, Autocomplete, CircularProgress } from '@mui/material';
import PropTypes from 'prop-types';
import configService from '../../../../../../services/configService';
import googleMapsLoader from '../../../../../../services/googleMapsLoader';

const LocationAutocomplete = ({ onPlaceSelected }) => {
  const autocompleteService = useRef(null);
  const placesService = useRef(null);

  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [apiKeyLoading, setApiKeyLoading] = useState(true);

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMaps = async () => {
      try {
        const apiKey = await configService.getGoogleMapsApiKey();
        const result = await googleMapsLoader.load(apiKey, ['places']);
        setIsLoaded(result.isLoaded);
        setLoadError(result.loadError);
      } catch (error) {
        console.error('Failed to load Google Maps:', error);
        setLoadError(error);
      } finally {
        setApiKeyLoading(false);
      }
    };
    loadGoogleMaps();
  }, []);

  useEffect(() => {
    if (isLoaded && !autocompleteService.current) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
      // Initialize PlacesService for getting place details
      const mapDiv = document.createElement('div');
      const map = new window.google.maps.Map(mapDiv);
      placesService.current = new window.google.maps.places.PlacesService(map);
    }
  }, [isLoaded]);

  useEffect(() => {
    if (!inputValue || !inputValue.trim()) {
      setOptions([]);
      return;
    }
    
    if (!autocompleteService.current || !isLoaded) {
      return;
    }

    setLoading(true);

    // Use a timeout to debounce requests
    const timeoutId = setTimeout(() => {
      autocompleteService.current.getPlacePredictions(
        {
          input: inputValue,
          types: ['(regions)'], // Changed from '(cities)' to '(regions)' for better Swiss location results
          componentRestrictions: { country: 'ch' },
          language: 'en'
        },
        (predictions, status) => {
          setLoading(false);
          
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            // Filter and enhance predictions for Swiss locations
            const enhancedPredictions = predictions.map(prediction => ({
              ...prediction,
              description: prediction.description.replace(', Switzerland', '') // Clean up display
            }));
            setOptions(enhancedPredictions);
          } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            // Try alternative search without type restriction
            autocompleteService.current.getPlacePredictions(
              {
                input: inputValue + ', Switzerland',
                componentRestrictions: { country: 'ch' }
              },
              (altPredictions, altStatus) => {
                if (altStatus === window.google.maps.places.PlacesServiceStatus.OK && altPredictions) {
                  const enhancedPredictions = altPredictions.map(prediction => ({
                    ...prediction,
                    description: prediction.description.replace(', Switzerland', '')
                  }));
                  setOptions(enhancedPredictions);
                } else {
                  setOptions([]);
                  console.warn('No predictions found for:', inputValue);
                }
              }
            );
          } else {
            setOptions([]);
            console.error('Autocomplete error:', status);
          }
        }
      );
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [inputValue, isLoaded]);

  const handleChange = async (event, value) => {
    if (!value) {
      onPlaceSelected?.(null);
      return;
    }
    
    if (!placesService.current) {
      console.error('Google Places Service not initialized');
      return;
    }

    try {
      // Use PlacesService to get place details
      const request = {
        placeId: value.place_id,
        fields: [
          'place_id',
          'name',
          'formatted_address',
          'geometry',
          'address_components',
          'types',
          'vicinity'
        ]
      };

      placesService.current.getDetails(request, (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          const placeData = {
            place_id: place.place_id,
            name: place.name || value.structured_formatting?.main_text || value.description,
            formatted_address: place.formatted_address || value.description,
            geometry: place.geometry ? {
              location: {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng()
              },
              viewport: place.geometry.viewport
            } : null,
            address_components: place.address_components || [],
            types: place.types || [],
            vicinity: place.vicinity || ''
          };

          onPlaceSelected?.(placeData);
        } else {
          console.error('Error fetching place details:', status);
          // Fallback: use basic info from prediction
          const fallbackData = {
            place_id: value.place_id,
            name: value.structured_formatting?.main_text || value.description,
            formatted_address: value.description,
            geometry: null,
            address_components: [],
            types: value.types || []
          };
          onPlaceSelected?.(fallbackData);
        }
      });
    } catch (error) {
      console.error('Error in handleChange:', error);
    }
  };

  if (apiKeyLoading) {
    return <CircularProgress size={24} />;
  }

  if (loadError) {
    console.error('Google Maps load error:', loadError);
    return (
      <TextField
        placeholder="Enter location manually"
        variant="outlined"
        fullWidth
        sx={{ height: '40px' }}
        onChange={(e) => onPlaceSelected?.({ 
          name: e.target.value,
          formatted_address: e.target.value 
        })}
      />
    );
  }
  
  if (!isLoaded) {
    return <CircularProgress size={24} />;
  }

  return (
    <Autocomplete
      sx={{ flexGrow: 1, height: '40px' }}
      getOptionLabel={(option) => (typeof option === 'string' ? option : option.description)}
      isOptionEqualToValue={(option, value) => option.place_id === value.place_id}
      filterOptions={(x) => x}
      options={options}
      autoComplete
      includeInputInList
      filterSelectedOptions
      loading={loading}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      onChange={handleChange}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Where do you want to move?"
          variant="outlined"
          fullWidth
          InputProps={{
            ...params.InputProps,
            sx: { height: '40px' },

            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            )
          }}
        />
      )}
    />
  );
};

LocationAutocomplete.propTypes = {
  onPlaceSelected: PropTypes.func
};

export { LocationAutocomplete };
