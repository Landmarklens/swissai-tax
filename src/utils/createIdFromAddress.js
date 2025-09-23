export function createStringId(address) {
  // Convert the address to lowercase
  let id = address.toLowerCase();

  // Remove any accents and diacritics
  id = id.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Remove special characters except spaces
  id = id.replace(/[^a-z0-9\s]/g, '');

  // Trim extra whitespace
  id = id.trim();

  // Replace one or more spaces with a single hyphen
  id = id.replace(/\s+/g, '-');

  return id;
}
