import { Box, Typography, ToggleButton, ToggleButtonGroup } from '@mui/material';
import React, { useEffect, useState } from 'react';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import PhotoSizeSelectActualOutlinedIcon from '@mui/icons-material/PhotoSizeSelectActualOutlined';
import { theme } from '../../theme/theme';
import HeroImages from './subComponents/HeroImages';
import AiSuggestion from './subComponents/AiSuggestion';
import Details from './subComponents/Details';
import { Location } from './subComponents/Location';
import { Feedback } from './subComponents/Feedback';
import { Link, useNavigate, useParams } from 'react-router-dom';
import LoggedInLayout from '../LoggedInLayout/LoggedInLayout';
import { useDispatch, useSelector } from 'react-redux';
import { getProperty, selectProperties } from '../../store/slices/propertiesSlice';
import { getNote, selectNotes } from '../../store/slices/notesSlice';
import { useTranslation } from 'react-i18next';
import { HomeDetailsMap } from './subComponents/HomeDetailsMap';
import SEOHelmet from '../../components/SEO/SEOHelmet';
import authService from '../../services/authService';
import dayjs from 'dayjs';

const mockProperty = {
  id: 10,
  address: 'Sonnenweg 15',
  city: '8810 Horgen',
  country: 'Switzerland',
  bedrooms: 2,
  bathrooms: 1,
  square_feet: 1200,
  price: '5,500 CHF',
  year_built: 1985,
  latitude: 37.7749,
  longitude: -122.4194
};

const mockPropertyNotes = [
  {
    avatar_url: 'https://example.com/path/to/avatar1.jpg',
    user_name: 'John Doe',
    feedback: 'Great apartment with a beautiful view!',
    created_at: '2023-10-15T10:30:00Z'
  },
  {
    avatar_url: 'https://example.com/path/to/avatar2.jpg',
    user_name: 'Jane Smith',
    feedback: 'The location is excellent',
    created_at: '2023-09-20T14:45:00Z'
  },
  {
    avatar_url: 'https://example.com/path/to/avatar3.jpg',
    user_name: 'Alice Johnson',
    feedback: 'Lovely apartment, very clean and well-maintained. Will book again!',
    created_at: '2023-08-05T08:15:00Z'
  },
  {
    avatar_url: 'https://example.com/path/to/avatar6.jpg',
    user_name: 'Dana White',
    feedback: 'Perfect location for sightseeing. Everything was as described.',
    created_at: '2023-05-10T09:25:00Z'
  },
  {
    avatar_url: 'https://example.com/path/to/avatar7.jpg',
    user_name: 'Ethan Black',
    feedback: 'Great for families! Lots of space and a nice kitchen area.',
    created_at: '2023-04-15T11:45:00Z'
  },
  {
    avatar_url: 'https://example.com/path/to/avatar9.jpg',
    user_name: 'George Gray',
    feedback: 'Very modern and clean, close to public transport.',
    created_at: '2023-02-10T08:00:00Z'
  },
  {
    avatar_url: 'https://example.com/path/to/avatar10.jpg',
    user_name: 'Hannah Yellow',
    feedback: 'Beautiful views, and the host was very accommodating!',
    created_at: '2023-01-05T15:20:00Z'
  }
];

const HomeDetails = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams();
  const dispatch = useDispatch();

  const storedData = localStorage.getItem('persist:root');

  const userObject = JSON.parse(storedData);

  const user = JSON.parse(userObject.account).data;

  const [view, setView] = React.useState('photos');
  const { currentProperty } = useSelector(selectProperties);
  const { notes, addNote } = useSelector(selectNotes) || mockPropertyNotes;

  const [notesState, setNotes] = useState(mockPropertyNotes);

  const property = currentProperty.data || mockProperty;

  useEffect(() => {
    if (params.id) {
      dispatch(getProperty(params.id));
      dispatch(getNote());
    }
  }, [params, dispatch]);

  const linkStyle = {
    color: theme.palette.primary.footer,
    fontSize: '16px',
    cursor: 'pointer',
    fontWeight: 600,
    textDecoration: 'none',
    marginRight: '15px'
  };

  const details = {
    images: [
      'https://plus.unsplash.com/premium_photo-1723901831135-782c98d8d8e0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://plus.unsplash.com/premium_photo-1675615667752-2ccda7042e7e?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8cm9vbXN8ZW58MHx8MHx8fDA%3D',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8cm9vbXN8ZW58MHx8MHx8fDA%3D',
      'https://plus.unsplash.com/premium_photo-1663126298656-33616be83c32?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://plus.unsplash.com/premium_photo-1723901831135-782c98d8d8e0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://plus.unsplash.com/premium_photo-1675615667752-2ccda7042e7e?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8cm9vbXN8ZW58MHx8MHx8fDA%3D',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8cm9vbXN8ZW58MHx8MHx8fDA%3D',
      'https://plus.unsplash.com/premium_photo-1663126298656-33616be83c32?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://plus.unsplash.com/premium_photo-1723901831135-782c98d8d8e0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://plus.unsplash.com/premium_photo-1675615667752-2ccda7042e7e?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8cm9vbXN8ZW58MHx8MHx8fDA%3D',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8cm9vbXN8ZW58MHx8MHx8fDA%3D',
      'https://plus.unsplash.com/premium_photo-1663126298656-33616be83c32?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://plus.unsplash.com/premium_photo-1723901831135-782c98d8d8e0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://plus.unsplash.com/premium_photo-1675615667752-2ccda7042e7e?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8cm9vbXN8ZW58MHx8MHx8fDA%3D',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8cm9vbXN8ZW58MHx8MHx8fDA%3D',
      'https://plus.unsplash.com/premium_photo-1663126298656-33616be83c32?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    ],
    address: `${property?.address}, ${property?.city}, ${property?.country}`,
    beds: property?.bedrooms,
    baths: property?.bathrooms,
    sqrFeet: property.square_feet,
    status: t('Unreviewed'),
    price: property.price,
    built: property.year_built,
    past: 'Jan 15, 2025',
    upcoming: 'Jan 15, 2025'
  };

  const handleViewChange = (event, newView) => {
    if (newView !== null) {
      setView(newView);
    }
  };

  function handleAddNote(feedback) {
    setNotes((prev) => [
      {
        avatar_url: user.avatar_url || 'https://example.com/path/to/avatar1.jpg',
        user_name: user.firstname,
        feedback: feedback,
        created_at: dayjs()
      },
      ...prev
    ]);
  }

  return (
    <LoggedInLayout>
      {/* TODO: Implement dynamic SEO based on content - Dynamic title based on property */}
      <SEOHelmet
        title={property?.title || "Property Details - HomeAI"}
        description={property?.description || "View detailed information about this property on HomeAI"}
      />
      <Box
        sx={{
          width: '100%',
          height: '100%'
        }}>
        {/* Header Section */}

        <Box>
          <Box sx={{ px: 5 }}>
            <Box
              sx={{
                display: 'flex',
                width: '100%',
                height: '60px',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
              <Box onClick={() => navigate(-1)}>
                <Typography
                  sx={{
                    backgroundColor: 'transparent',
                    color: theme.palette.text.secondary,
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}>
                  <ArrowBackIosIcon
                    sx={{
                      fontSize: '12px'
                    }}
                  />
                  {t('Back')}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex' }}>
                <ToggleButtonGroup
                  value={view}
                  exclusive
                  onChange={handleViewChange}
                  aria-label="View selection"
                  sx={{}}>
                  <ToggleButton
                    value="photos"
                    sx={{
                      borderRadius: '3px 0 0 3px',
                      textTransform: 'none',
                      padding: '2px 14px',
                      fontSize: '10px',
                      color: view === 'photos' ? 'black' : 'text.secondary'
                    }}>
                    <PhotoSizeSelectActualOutlinedIcon
                      sx={{
                        fontSize: '16px',
                        marginRight: '4px'
                      }}
                    />
                    {t('Photos')}
                  </ToggleButton>
                  <ToggleButton
                    value="map"
                    sx={{
                      borderRadius: '0 3px 3px 0',
                      textTransform: 'none',
                      padding: '2px 14px',
                      fontSize: '10px',
                      color: view === 'map' ? 'black' : 'text.secondary'
                    }}>
                    <LocationOnOutlinedIcon
                      sx={{
                        fontSize: '16px',
                        marginRight: '4px'
                      }}
                    />
                    {t('Map')}
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </Box>
          </Box>
        </Box>

        {/*   Below Header */}
        {view === 'photos' && (
          <Box
            sx={{
              width: '100%'
            }}>
            <Box>
              <HeroImages images={details.images} />
            </Box>
            <Box
              sx={{
                px: 5
              }}>
              <AiSuggestion property={property} id={property.id} />
            </Box>
            <Box
              sx={{
                px: 5
              }}>
              <Details details={details} />
            </Box>
            <Box
              sx={{
                px: 5
              }}>
              <Location
                details={details}
                latitude={property.latitude}
                longitude={property.longitude}
                padding={5}
                width={'60%'}
                title="Location"
              />
            </Box>
            <Box
              sx={{
                px: 5
              }}>
              <Feedback
                propertyId={property.id}
                propertyNotes={notes.data}
                onAddNote={handleAddNote}
              />
            </Box>

            <Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid #ddd',
                  height: '100px',
                  px: 5
                }}>
                <Box>
                  <Link
                    to="home"
                    smooth={true}
                    offset={50}
                    duration={500}
                    style={{
                      textDecoration: 'none',
                      fontSize: '20px',
                      fontWeight: 700,
                      color: theme.palette.primary.footer
                    }}>
                    HOME AI
                  </Link>
                </Box>

                <Box
                  sx={{
                    [theme.breakpoints.down('md')]: {
                      display: 'none'
                    }
                  }}>
                  <Link to="/privacy-policy" style={{ ...linkStyle }}>
                    {t('Search Property')}
                  </Link>
                  <Link to="/privacy-policy" style={{ ...linkStyle }}>
                    {t('Privacy Policy')}
                  </Link>
                  <Link to="/terms-of-service" style={{ ...linkStyle }}>
                    {t('Terms and Condition')}
                  </Link>
                  <Link to="/terms-of-service" style={{ ...linkStyle }}>
                    {t('Support')}
                  </Link>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    color: theme.palette.primary
                  }}>
                  <Typography variant="body2" color="textSecondary">
                    © 2025 Home Ai, LLC
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        )}

        {view === 'map' && <HomeDetailsMap />}
      </Box>
    </LoggedInLayout>
  );
};

export default HomeDetails;
