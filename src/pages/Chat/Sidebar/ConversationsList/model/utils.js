import { capitalizeFirstLetter } from '../../../../../utils/capitalizeFirstLetter';

export const formatChatTitle = (insights = {}, maxLengthPerPart = Infinity) => {
  const parts = [];

  const invalidValues = [
    'No specific preference',
    'no specific preference',
    'None',
    'none',
    'N/A',
    'n/a'
  ];

  const isValidValue = (val) =>
    val && !invalidValues.includes(val.trim()) && val.length <= maxLengthPerPart;

  if (isValidValue(insights['Budget'])) parts.push(capitalizeFirstLetter(insights['Budget']));
  if (isValidValue(insights['Location Preferences']))
    parts.push(capitalizeFirstLetter(insights['Location Preferences']));

  if (parts.length < 2) {
    for (const key in insights) {
      if (insights.hasOwnProperty(key) && key !== 'Budget' && key !== 'Location Preferences') {
        const value = insights[key];
        if (isValidValue(value) && !parts.includes(capitalizeFirstLetter(value))) {
          parts.push(capitalizeFirstLetter(value));
          if (parts.length === 2) break;
        }
      }
    }
  }

  return parts.join(' — ') || 'New Chat';
};
