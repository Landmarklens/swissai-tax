export const getEstimatedTime = ({ progress, maxTime = 5, locale = 'de-CH' }) => {
  if (typeof progress !== 'number' || isNaN(progress)) {
    return;
  }

  const maxTimeMs = maxTime * 60 * 1000;
  const estimatedTime = maxTimeMs - (maxTimeMs / 100) * progress;

  const minutes = Math.floor(estimatedTime / 60000);
  const seconds = Math.floor((estimatedTime % 60000) / 1000);

  const minutesFormatted = new Intl.NumberFormat(locale, {
    minimumIntegerDigits: 1,
    useGrouping: false
  }).format(minutes);

  const secondsFormatted = new Intl.NumberFormat(locale, {
    minimumIntegerDigits: 2,
    useGrouping: false
  }).format(seconds);

  return `${minutesFormatted}m:${secondsFormatted}s`;
};
