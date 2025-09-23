import React, { useState, useEffect } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import {
  Box,
  Button,
  Collapse,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton
} from '@mui/material';
import { generateSearchPrompt } from '../../../../utils/generateSearchPrompt';
import { useDispatch, useSelector } from 'react-redux';
import {
  createInsight,
  createInsights,
  createNewConversationProfileThunk,
  sendConversationMessage,
  updateConversationProfile,
  addLocalInsight,
  removeLocalInsight
} from '../../../../store/slices/conversationsSlice';
import { buildFilteredInsightsBody, hasThreeOrMoreFilters } from './models/utils';
import { LocationAutocomplete } from './ui/LocationAutocomplete/LocationAutocomplete';
import { useSearchParams } from 'react-router-dom';
import PropTypes from 'prop-types';

const priorityOptions = [
  { value: 'MUST', label: 'Must-have' },
  { value: 'IMPORTANT', label: 'Important' },
  { value: 'NICE-TO-HAVE', label: 'Nice-to-have' }
];

const filters = ['Location', 'Price', 'Beds', 'Baths', 'Home type'];

const initialFiltersPriority = {
  location: '',
  price: '',
  bedrooms: '',
  bathrooms: '',
  ['home-type']: ''
};

const MultiFilterPanel = ({ expanded, searchPropertyName, onClose }) => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeConversationId = useSelector((state) => state.conversations.activeConversationId);
  const conversationProfiles = useSelector((state) => state.conversations.conversationProfiles);
  const activeConversationProfile = useSelector((state) => state.conversations.activeConversationProfile);
  const isProfileCompleted = useSelector(
    (state) => state.conversations.activeConversationProfile?.profileCompleted
  );

  const hasConversationProfiles =
    Array.isArray(conversationProfiles) && conversationProfiles.length > 0;

  const [openFilters, setOpenFilters] = useState({});
  const [listingType, setListingType] = useState('rent');
  const [location, setLocation] = useState('');
  const [homeType, setHomeType] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedBeds, setSelectedBeds] = useState('');
  const [selectedBaths, setSelectedBaths] = useState('');
  const [filtersPriority, setFiltersPriority] = useState(initialFiltersPriority);
  const [priorityInfoOpen, setPriorityInfoOpen] = useState(false);
  const [highlightPriority, setHighlightPriority] = useState({
    bedrooms: false,
    bathrooms: false
  });

  // Reset all filters when conversation changes
  useEffect(() => {
    // Reset all filter states to initial values
    setOpenFilters({});
    setListingType('rent');
    setLocation('');
    setHomeType('');
    setMinPrice('');
    setMaxPrice('');
    setSelectedBeds('');
    setSelectedBaths('');
    setFiltersPriority(initialFiltersPriority);
    setHighlightPriority({
      bedrooms: false,
      bathrooms: false
    });
  }, [activeConversationId]);

  const handleChangePriority = (filterName, priority) => {
    console.log('🔍 handleChangePriority called:', {
      filterName,
      priority,
      currentBeds: selectedBeds,
      currentBaths: selectedBaths,
      currentHomeType: homeType,
      currentMinPrice: minPrice,
      currentMaxPrice: maxPrice,
      currentFiltersPriority: filtersPriority
    });

    setFiltersPriority((prev) => {
      const newPriority = { ...prev, [filterName]: priority };
      console.log('📝 Updated filtersPriority:', newPriority);
      return newPriority;
    });

    // Remove highlight when priority is set
    setHighlightPriority(prev => ({ ...prev, [filterName]: false }));

    // Create local insight when priority is set and we have a selection
    let insightText = '';
    let step = 'Property Requirements';

    if (priority) {
      if (filterName === 'bedrooms' && selectedBeds) {
        console.log('🛏️ Creating bedroom insight:', { selectedBeds, priority });

        // Remove existing bedroom insight if any
        const existingBedInsight = activeConversationProfile?.insights?.find(
          i => i.isLocal && i.text?.includes('bedroom')
        );
        if (existingBedInsight) {
          console.log('🗑️ Removing existing bedroom insight:', existingBedInsight);
          dispatch(removeLocalInsight(existingBedInsight.id));
        }

        insightText = `${selectedBeds === '5+' ? '5 or more' : selectedBeds} bedroom${selectedBeds === '1' ? '' : 's'}`;
      } else if (filterName === 'bathrooms' && selectedBaths) {
        console.log('🚿 Creating bathroom insight:', { selectedBaths, priority });

        // Remove existing bathroom insight if any
        const existingBathInsight = activeConversationProfile?.insights?.find(
          i => i.isLocal && i.text?.includes('bathroom')
        );
        if (existingBathInsight) {
          console.log('🗑️ Removing existing bathroom insight:', existingBathInsight);
          dispatch(removeLocalInsight(existingBathInsight.id));
        }

        insightText = `${selectedBaths === '3+' ? '3 or more' : selectedBaths} bathroom${selectedBaths === '1' ? '' : 's'}`;
      } else if (filterName === 'home-type' && homeType) {
        console.log('🏠 Creating home type insight:', { homeType, priority });

        // Remove existing home type insight if any
        const existingHomeInsight = activeConversationProfile?.insights?.find(
          i => i.isLocal && (i.text?.includes('House') || i.text?.includes('Apartment'))
        );
        if (existingHomeInsight) {
          console.log('🗑️ Removing existing home type insight:', existingHomeInsight);
          dispatch(removeLocalInsight(existingHomeInsight.id));
        }

        insightText = homeType;
      } else if (filterName === 'price' && (minPrice || maxPrice)) {
        console.log('💰 Creating price insight:', { minPrice, maxPrice, priority });

        // Remove existing price insights
        const existingPriceInsights = activeConversationProfile?.insights?.filter(
          i => i.isLocal && (i.text?.includes('budget') || i.text?.includes('CHF'))
        ) || [];
        existingPriceInsights.forEach(insight => {
          console.log('🗑️ Removing existing price insight:', insight);
          dispatch(removeLocalInsight(insight.id));
        });

        if (minPrice && maxPrice) {
          const formattedMin = parseInt(minPrice).toLocaleString();
          const formattedMax = parseInt(maxPrice).toLocaleString();
          insightText = `Budget: CHF ${formattedMin} - CHF ${formattedMax}`;
        } else if (minPrice) {
          const formattedMin = parseInt(minPrice).toLocaleString();
          insightText = `Minimum budget: CHF ${formattedMin}`;
        } else if (maxPrice) {
          const formattedMax = parseInt(maxPrice).toLocaleString();
          insightText = `Maximum budget: CHF ${formattedMax}`;
        }
        step = 'Budget';
      }

      if (insightText) {
        const insight = {
          text: insightText,
          step: step,
          priority: priority,
          conversation_profile_id: activeConversationId
        };
        console.log('✨ Dispatching addLocalInsight:', insight);
        dispatch(addLocalInsight(insight));
      }
    }
  };

  const toggleFilter = (key) => {
    setOpenFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleListingTypeChange = (_, value) => {
    if (value !== null) setListingType(value);
  };

  const handleHomeTypeChange = (_, value) => {
    console.log('🏠 handleHomeTypeChange called:', {
      newValue: value,
      currentPriority: filtersPriority['home-type'],
      activeConversationId
    });

    if (value !== null) {
      setHomeType(value);

      // Highlight priority field if no priority is set
      if (value && !filtersPriority['home-type']) {
        console.log('⚠️ Home type selected without priority, highlighting priority field');
        setHighlightPriority(prev => ({ ...prev, 'home-type': true }));
      } else if (value && filtersPriority['home-type']) {
        console.log('✅ Home type selected with priority, creating insight');

        // Remove existing home type insight if any
        const existingHomeInsight = activeConversationProfile?.insights?.find(
          i => i.isLocal && (i.text?.includes('House') || i.text?.includes('Apartment'))
        );
        if (existingHomeInsight) {
          console.log('🗑️ Removing existing home type insight:', existingHomeInsight);
          dispatch(removeLocalInsight(existingHomeInsight.id));
        }

        const insight = {
          text: value,
          step: 'Property Requirements',
          priority: filtersPriority['home-type'],
          conversation_profile_id: activeConversationId
        };
        console.log('✨ Creating home type insight:', insight);
        dispatch(addLocalInsight(insight));
      }
    } else {
      // Remove home type insight if selection is cleared
      const existingHomeInsight = activeConversationProfile?.insights?.find(
        i => i.isLocal && (i.text?.includes('House') || i.text?.includes('Apartment'))
      );
      if (existingHomeInsight) {
        console.log('🗑️ Removing home type insight:', existingHomeInsight);
        dispatch(removeLocalInsight(existingHomeInsight.id));
      }
    }
  };

  const handleBedsChange = (_, value) => {
    console.log('🛏️ handleBedsChange called:', {
      newValue: value,
      currentPriority: filtersPriority.bedrooms,
      activeConversationId
    });

    setSelectedBeds(value);

    // Highlight priority field if no priority is set
    if (value && !filtersPriority.bedrooms) {
      console.log('⚠️ Beds selected without priority, highlighting priority field');
      setHighlightPriority(prev => ({ ...prev, bedrooms: true }));
    } else if (value && filtersPriority.bedrooms) {
      console.log('✅ Beds selected with priority, creating insight');

      // Create local insight only if priority is already set
      // Remove existing bedroom insight if any
      const existingBedInsight = activeConversationProfile?.insights?.find(
        i => i.isLocal && i.text?.includes('bedroom')
      );
      if (existingBedInsight) {
        console.log('🗑️ Removing existing bedroom insight:', existingBedInsight);
        dispatch(removeLocalInsight(existingBedInsight.id));
      }

      const insight = {
        text: `${value === '5+' ? '5 or more' : value} bedroom${value === '1' ? '' : 's'}`,
        step: 'Property Requirements',
        priority: filtersPriority.bedrooms,
        conversation_profile_id: activeConversationId
      };
      console.log('✨ Creating bedroom insight:', insight);
      dispatch(addLocalInsight(insight));
    } else if (!value) {
      console.log('❌ Beds cleared, removing insight');

      // Remove bedroom insight if selection is cleared
      const existingBedInsight = activeConversationProfile?.insights?.find(
        i => i.isLocal && i.text?.includes('bedroom')
      );
      if (existingBedInsight) {
        console.log('🗑️ Removing bedroom insight:', existingBedInsight);
        dispatch(removeLocalInsight(existingBedInsight.id));
      }
    }
  };

  const handleBathsChange = (_, value) => {
    console.log('🚿 handleBathsChange called:', {
      newValue: value,
      currentPriority: filtersPriority.bathrooms,
      activeConversationId
    });

    setSelectedBaths(value);

    // Highlight priority field if no priority is set
    if (value && !filtersPriority.bathrooms) {
      console.log('⚠️ Baths selected without priority, highlighting priority field');
      setHighlightPriority(prev => ({ ...prev, bathrooms: true }));
    } else if (value && filtersPriority.bathrooms) {
      console.log('✅ Baths selected with priority, creating insight');

      // Create local insight only if priority is already set
      // Remove existing bathroom insight if any
      const existingBathInsight = activeConversationProfile?.insights?.find(
        i => i.isLocal && i.text?.includes('bathroom')
      );
      if (existingBathInsight) {
        console.log('🗑️ Removing existing bathroom insight:', existingBathInsight);
        dispatch(removeLocalInsight(existingBathInsight.id));
      }

      const insight = {
        text: `${value === '3+' ? '3 or more' : value} bathroom${value === '1' ? '' : 's'}`,
        step: 'Property Requirements',
        priority: filtersPriority.bathrooms,
        conversation_profile_id: activeConversationId
      };
      console.log('✨ Creating bathroom insight:', insight);
      dispatch(addLocalInsight(insight));
    } else if (!value) {
      console.log('❌ Baths cleared, removing insight');

      // Remove bathroom insight if selection is cleared
      const existingBathInsight = activeConversationProfile?.insights?.find(
        i => i.isLocal && i.text?.includes('bathroom')
      );
      if (existingBathInsight) {
        console.log('🗑️ Removing bathroom insight:', existingBathInsight);
        dispatch(removeLocalInsight(existingBathInsight.id));
      }
    }
  };

  const handlePriceChange = (e) => {
    const { name, value } = e.target;

    console.log('💰 handlePriceChange called:', {
      name,
      value,
      currentPriority: filtersPriority.price,
      activeConversationId
    });

    if (name === 'min') {
      setMinPrice(value);
    } else if (name === 'max') {
      setMaxPrice(value);
    }

    // Debounce to avoid creating insights on every keystroke
    clearTimeout(window.priceInsightTimeout);
    window.priceInsightTimeout = setTimeout(() => {
      // Generate insight when price is set
      if (value) {
        // Highlight priority field if no priority is set
        if (!filtersPriority.price) {
          console.log('⚠️ Price set without priority, highlighting priority field');
          setHighlightPriority(prev => ({ ...prev, price: true }));
        } else {
          console.log('✅ Price set with priority, creating insight');

          // Remove existing price insights
          const existingPriceInsights = activeConversationProfile?.insights?.filter(
            i => i.isLocal && (i.text?.includes('budget') || i.text?.includes('CHF'))
          ) || [];
          existingPriceInsights.forEach(insight => {
            console.log('🗑️ Removing existing price insight:', insight);
            dispatch(removeLocalInsight(insight.id));
          });

          // Create budget range insight if both min and max are set
          const currentMin = name === 'min' ? value : minPrice;
          const currentMax = name === 'max' ? value : maxPrice;

          let insightText = '';
          if (currentMin && currentMax) {
            const formattedMin = parseInt(currentMin).toLocaleString();
            const formattedMax = parseInt(currentMax).toLocaleString();
            insightText = `Budget: CHF ${formattedMin} - CHF ${formattedMax}`;
          } else if (currentMin) {
            const formattedMin = parseInt(currentMin).toLocaleString();
            insightText = `Minimum budget: CHF ${formattedMin}`;
          } else if (currentMax) {
            const formattedMax = parseInt(currentMax).toLocaleString();
            insightText = `Maximum budget: CHF ${formattedMax}`;
          }

          if (insightText) {
            const insight = {
              text: insightText,
              step: 'Budget',
              priority: filtersPriority.price,
              conversation_profile_id: activeConversationId
            };
            console.log('✨ Creating price insight:', insight);
            dispatch(addLocalInsight(insight));
          }
        }
      } else {
        // Remove price insights if value is cleared
        const existingPriceInsights = activeConversationProfile?.insights?.filter(
          i => i.isLocal && (i.text?.includes('budget') || i.text?.includes('CHF'))
        ) || [];
        existingPriceInsights.forEach(insight => {
          console.log('🗑️ Removing price insight:', insight);
          dispatch(removeLocalInsight(insight.id));
        });
      }
    }, 500);
  };

  const handleResetFilters = () => {
    setListingType('rent');
    setLocation('');
    setHomeType('');
    setMinPrice('');
    setMaxPrice('');
    setSelectedBeds('');
    setSelectedBaths('');
  };

  const sendPromptToAI = async (generatedPrompt) => {
    if (isProfileCompleted) {
      dispatch(
        updateConversationProfile({
          conversationId: activeConversationId,
          message: generatedPrompt
        })
      );
      handleResetFilters();
      return;
    }

    if (!hasConversationProfiles) {
      const result = await dispatch(createNewConversationProfileThunk()).unwrap();
      const newConversationId = result?.payload?.id || result?.id;

      // Add the new conversation ID to URL search params
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('conversation', newConversationId);
      setSearchParams(newSearchParams);

      dispatch(
        sendConversationMessage({
          conversationId: newConversationId,
          message: generatedPrompt
        })
      );

      handleResetFilters();
      return newConversationId;
    } else {
      dispatch(
        sendConversationMessage({
          conversationId: activeConversationId,
          message: generatedPrompt
        })
      );
    }

    handleResetFilters();
  };

  const handleSelectFilter = async (filterParam, filterName) => {
    const generatedPrompt = generateSearchPrompt(filterParam);

    const newConversationId = await sendPromptToAI(generatedPrompt);

    dispatch(
      createInsight({
        conversation_profile_id: newConversationId || activeConversationId,
        text: filterName,
        priority: filtersPriority[filterName.toLowerCase()] || 'MUST'
      })
    );
  };

  const allOptions = {
    listingType,
    location,
    homeType,
    minPrice,
    maxPrice,
    bedrooms: selectedBeds,
    bathrooms: selectedBaths
  };

  const handleSubmitAllOptions = async () => {
    const generatedPrompt = generateSearchPrompt(allOptions);

    const newConversationId = await sendPromptToAI(generatedPrompt);

    const conversationId = newConversationId || activeConversationId;

    // Get all local insights to send to backend
    const localInsights = activeConversationProfile?.insights?.filter(i => i.isLocal) || [];

    // Build insights from all filters
    const body = buildFilteredInsightsBody(conversationId, allOptions, filtersPriority);

    // Combine local insights with other filters (excluding duplicates)
    const allInsightsToSend = [...body];

    // Add local insights that aren't already in body
    localInsights.forEach(localInsight => {
      const exists = body.some(b => b.text === localInsight.text);
      if (!exists) {
        allInsightsToSend.push({
          conversation_profile_id: conversationId,
          text: localInsight.text,
          step: localInsight.step,
          priority: localInsight.priority
        });
      }
    });

    // Send all insights to backend if we have any
    if (allInsightsToSend.length > 0) {
      dispatch(
        createInsights({
          insights: allInsightsToSend,
          source_type: 'regular_chat'
        })
      );
    }

    // Clear local insights after submitting
    localInsights.forEach(insight => {
      dispatch(removeLocalInsight(insight.id));
    });
  };

  const filledThreeOrMoreFilters = hasThreeOrMoreFilters([
    listingType,
    location,
    homeType,
    minPrice,
    maxPrice,
    selectedBeds,
    selectedBaths
  ]);

  return (
    <Box sx={{ width: '100%', marginBottom: '32px' }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          mb: '32px'
        }}>
        <ToggleButtonGroup
          value={listingType}
          exclusive
          onChange={handleListingTypeChange}
          size="small"
          color="primary">
          <ToggleButton sx={{ width: '66px', height: '40px', fontSize: '16px' }} value="rent">
            Rent
          </ToggleButton>
          <ToggleButton sx={{ width: '66px', height: '40px', fontSize: '16px' }} value="buy">
            Buy
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <Box
        sx={{ display: 'flex', columnGap: '20px', justifyContent: 'center', marginBottom: '20px' }}>
        {filters.map((filter) => (
          <Button
            key={filter}
            sx={{
              padding: '6px 16px',
              width: '100%',
              maxWidth: '130px',
              lineHeight: 1.3,
              fontSize: 18,
              backgroundColor: openFilters[filter] ? '#f0f0f3' : '#ffffff',
              borderColor: openFilters[filter] ? 'transparent' : '#c1d0ff',
              color: '#000'
            }}
            variant="outlined"
            onClick={() => toggleFilter(filter)}>
            {filter}
          </Button>
        ))}
      </Box>
      <Box sx={{ maxWidth: '730px', margin: '0 auto' }}>
        <Collapse
          sx={{
            marginBottom: openFilters['Location'] ? '20px' : 0
          }}
          in={openFilters['Location']}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              columnGap: '14px'
            }}>
            <LocationAutocomplete
              onPlaceSelected={(place) => {
                setLocation(place?.name);
              }}
            />

            <Box sx={{ display: 'flex', columnGap: '4px' }}>
              <Select
                sx={{ minWidth: '130px', height: '40px' }}
                value={filtersPriority.location || ''}
                onChange={(e) => handleChangePriority('location', e.target.value)}
                displayEmpty>
                <MenuItem value="" disabled>
                  Priority
                </MenuItem>
                {priorityOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>

              <HelpOutlineIcon
                sx={{
                  cursor: 'pointer',
                  color: '#777',
                  fontSize: '20px',
                  transition: 'color 0.2s',
                  '&:hover': { color: '#000' }
                }}
                onClick={() => setPriorityInfoOpen(true)}
              />
            </Box>

          </Box>
        </Collapse>

        <Collapse
          sx={{ marginBottom: openFilters['Price'] ? '20px' : 0 }}
          in={openFilters['Price']}>
          <Box sx={{ display: 'flex', alignItems: 'center', columnGap: '14px' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                columnGap: '14px',
                width: '100%'
              }}>
              <Box sx={{ display: 'flex', alignItems: 'center', columnGap: '12px' }}>
                <Typography>Lowest price:</Typography>
                <TextField
                  sx={{ paddingY: '10px', maxWidth: '140px' }}
                  variant="outlined"
                  size="small"
                  name="min"
                  value={minPrice}
                  onChange={handlePriceChange}
                  placeholder="0.00 CHF"
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', columnGap: '12px' }}>
                <Typography>Highest price:</Typography>
                <TextField
                  sx={{ maxWidth: '140px' }}
                  variant="outlined"
                  size="small"
                  name="max"
                  value={maxPrice}
                  onChange={handlePriceChange}
                  placeholder="9,999.00 CHF"
                />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', columnGap: '4px' }}>
              <Select
                sx={{ minWidth: '130px', height: '40px' }}
                value={filtersPriority.price || ''}
                onChange={(e) => handleChangePriority('price', e.target.value)}
                displayEmpty>
                <MenuItem value="" disabled>
                  Priority
                </MenuItem>
                {priorityOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>

              <HelpOutlineIcon
                sx={{
                  cursor: 'pointer',
                  color: '#777',
                  fontSize: '20px',
                  transition: 'color 0.2s',
                  '&:hover': { color: '#000' }
                }}
                onClick={() => setPriorityInfoOpen(true)}
              />
            </Box>

          </Box>
        </Collapse>

        <Collapse sx={{ marginBottom: openFilters['Beds'] ? '20px' : 0 }} in={openFilters['Beds']}>
          <Box sx={{ display: 'flex', alignItems: 'center', columnGap: '14px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', columnGap: '10px', flexGrow: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Total number of beds:
              </Typography>
              <ToggleButtonGroup
                sx={{ flexGrow: 1, justifyContent: 'space-between' }}
                value={selectedBeds}
                exclusive
                onChange={handleBedsChange}
                size="small">
                {[1, 2, 3, 4, 5, '6+'].map((n) => (
                  <ToggleButton
                    sx={{
                      padding: '8px 20px',
                      borderRadius: '6px !important',
                      border: '1px solid rgba(0, 0, 0, 0.12) !important'
                    }}
                    key={n}
                    value={n}>
                    {n}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>

            <Box sx={{ display: 'flex', columnGap: '4px' }}>
              <Select
                sx={{
                  minWidth: '130px',
                  height: '40px',
                  border: highlightPriority.bedrooms ? '2px solid #1976d2' : undefined,
                  backgroundColor: highlightPriority.bedrooms ? 'rgba(25, 118, 210, 0.05)' : undefined,
                  animation: highlightPriority.bedrooms ? 'pulse 1.5s infinite' : undefined,
                  '@keyframes pulse': {
                    '0%': { borderColor: '#1976d2' },
                    '50%': { borderColor: '#42a5f5' },
                    '100%': { borderColor: '#1976d2' }
                  }
                }}
                value={filtersPriority.bedrooms || ''}
                onChange={(e) => handleChangePriority('bedrooms', e.target.value)}
                displayEmpty>
                <MenuItem value="" disabled>
                  Priority
                </MenuItem>
                {priorityOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>

              <HelpOutlineIcon
                sx={{
                  cursor: 'pointer',
                  color: '#777',
                  fontSize: '20px',
                  transition: 'color 0.2s',
                  '&:hover': { color: '#000' }
                }}
                onClick={() => setPriorityInfoOpen(true)}
              />
            </Box>
          </Box>
        </Collapse>

        <Collapse
          sx={{ marginBottom: openFilters['Baths'] ? '20px' : 0 }}
          in={openFilters['Baths']}>
          <Box sx={{ display: 'flex', alignItems: 'center', columnGap: '14px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', columnGap: '10px', flexGrow: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Total number of bathrooms:
              </Typography>
              <ToggleButtonGroup
                sx={{ flexGrow: 1, justifyContent: 'space-between' }}
                value={selectedBaths}
                exclusive
                onChange={handleBathsChange}
                size="small">
                {['1+', '1.5+', '2+', '2.5+', '3+'].map((n) => (
                  <ToggleButton
                    sx={{
                      padding: '8px 20px',
                      borderRadius: '6px !important',
                      border: '1px solid rgba(0, 0, 0, 0.12) !important'
                    }}
                    key={n}
                    value={n}>
                    {n}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>

            <Box sx={{ display: 'flex', columnGap: '4px' }}>
              <Select
                sx={{
                  minWidth: '130px',
                  height: '40px',
                  border: highlightPriority.bathrooms ? '2px solid #1976d2' : undefined,
                  backgroundColor: highlightPriority.bathrooms ? 'rgba(25, 118, 210, 0.05)' : undefined,
                  animation: highlightPriority.bathrooms ? 'pulse 1.5s infinite' : undefined,
                  '@keyframes pulse': {
                    '0%': { borderColor: '#1976d2' },
                    '50%': { borderColor: '#42a5f5' },
                    '100%': { borderColor: '#1976d2' }
                  }
                }}
                value={filtersPriority.bathrooms || ''}
                onChange={(e) => handleChangePriority('bathrooms', e.target.value)}
                displayEmpty>
                <MenuItem value="" disabled>
                  Priority
                </MenuItem>
                {priorityOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>

              <HelpOutlineIcon
                sx={{
                  cursor: 'pointer',
                  color: '#777',
                  fontSize: '20px',
                  transition: 'color 0.2s',
                  '&:hover': { color: '#000' }
                }}
                onClick={() => setPriorityInfoOpen(true)}
              />
            </Box>
          </Box>
        </Collapse>

        <Collapse
          sx={{ marginBottom: openFilters['Home type'] ? '20px' : 0 }}
          in={openFilters['Home type']}>
          <Box sx={{ display: 'flex', alignItems: 'center', columnGap: '14px' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                columnGap: '10px',
                flexGrow: 1
              }}>
              <Typography variant="subtitle2" gutterBottom>
                Home Type:
              </Typography>
              <ToggleButtonGroup
                sx={{ margin: '0 auto' }}
                value={homeType}
                exclusive
                onChange={handleHomeTypeChange}
                size="small">
                {['House', 'Apartment'].map((n) => (
                  <ToggleButton
                    sx={{ borderRadius: '6px', padding: '8px 20px', minWidth: '104px' }}
                    key={n}
                    value={n}>
                    {n}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>

            <Box sx={{ display: 'flex', columnGap: '4px' }}>
              <Select
                sx={{ minWidth: '130px', height: '40px' }}
                value={filtersPriority['home-type'] || ''}
                onChange={(e) => handleChangePriority('home-type', e.target.value)}
                displayEmpty>
                <MenuItem value="" disabled>
                  Priority
                </MenuItem>
                {priorityOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>

              <HelpOutlineIcon
                sx={{
                  cursor: 'pointer',
                  color: '#777',
                  fontSize: '20px',
                  transition: 'color 0.2s',
                  '&:hover': { color: '#000' }
                }}
                onClick={() => setPriorityInfoOpen(true)}
              />
            </Box>

          </Box>
        </Collapse>
      </Box>

      <Dialog
        open={priorityInfoOpen}
        onClose={() => setPriorityInfoOpen(false)}
        maxWidth="sm"
        fullWidth>
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
          What does Priority mean?
          <IconButton
            onClick={() => setPriorityInfoOpen(false)}
            edge="end"
            size="small"
            sx={{ color: '#777' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Typography sx={{ lineHeight: 1.8, fontSize: '16px' }}>
            <strong>Must-have</strong> — an essential requirement; options without this will not be
            considered.
            <br />
            <strong>Important</strong> — preferred, but not critical; these options are considered
            if other parameters fit.
            <br />
            <strong>Nice-to-have</strong> — an extra wish, not a deciding factor.
          </Typography>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

MultiFilterPanel.propTypes = {
  isProfileCompleted: PropTypes.bool
};

export { MultiFilterPanel };
