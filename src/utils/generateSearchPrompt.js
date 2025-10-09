function getArticle(propertyType) {
  const { t } = useTranslation();
  if (!propertyType) return '';
  const firstLetter = propertyType.trim().charAt(0).toLowerCase();
  return ['a', 'e', 'i', 'o', 'u'].includes(firstLetter) ? 'an' : 'a';
}

function getRoomDescription(bedrooms, bathrooms) {
  const parts = [];

  if (bedrooms) {
    parts.push(`${bedrooms} ${bedrooms === 1 ? 'bedroom' : 'bedrooms'}`);
  }

  if (bathrooms) {
    parts.push(`at least ${bathrooms} ${bathrooms === 1 ? 'bathroom' : 'bathrooms'}`);
  }

  if (parts.length) {
    return ` with ${parts.join(' and ')}`;
  }

  return '';
}

function getPriceDescription(minPrice, maxPrice) {
  if (minPrice && maxPrice) {
    return `, priced between CHF ${minPrice} and CHF ${maxPrice}`;
  } else if (minPrice) {
    return `, starting from CHF ${minPrice}`;
  } else if (maxPrice) {
    return `, under CHF ${maxPrice}`;
  }
  return '';
}

function getListingAction(listingType) {
  if (listingType === 'rent') return 'rent';
  if (listingType === 'buy') return 'buy';
  return '';
}

export function generateSearchPrompt(filters) {
  const { bedrooms, bathrooms, minPrice, maxPrice, location, propertyType, listingType } = filters;

  if (!Object.values(filters).some(Boolean)) return '';

  let description = "I'm looking to";

  const action = getListingAction(listingType);
  if (action) {
    description += ` ${action}`;
  }

  if (propertyType) {
    const article = getArticle(propertyType);
    description += ` ${article} ${propertyType}`;
  }

  if (location) {
    description += ` in ${location}`;
  }

  description += getRoomDescription(bedrooms, bathrooms);
  description += getPriceDescription(minPrice, maxPrice);

  return description.trim() + '.';
}
