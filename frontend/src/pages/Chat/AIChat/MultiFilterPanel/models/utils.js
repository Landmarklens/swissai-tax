export const hasThreeOrMoreFilters = (values) => {
  const isFilled = (value) => Boolean(value);
  return values.filter(isFilled).length >= 3;
};

export const buildFilteredInsightsBody = (activeConversationId, allOptions, filtersPriority) => {
  const filterConfig = [
    { keys: ['location'], label: 'Location' },
    { keys: ['homeType'], label: 'Home-type' },
    { keys: ['minPrice', 'maxPrice'], label: 'Price' },
    { keys: ['bedrooms'], label: 'Bedrooms' },
    { keys: ['bathrooms'], label: 'Bathrooms' }
  ];

  const isFilled = (value) => value !== '' && value !== null && value !== undefined;

  return filterConfig
    .filter(({ keys }) => keys.some((key) => isFilled(allOptions[key])))
    .map(({ label }) => ({
      conversation_profile_id: activeConversationId,
      text: label,
      priority: filtersPriority[label.toLowerCase()] || 'MUST'
    }));
};
