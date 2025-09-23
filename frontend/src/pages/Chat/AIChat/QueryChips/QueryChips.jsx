import { Box, Chip, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

const QueryChips = ({ handleChangeQuery, queryOptions }) => {
  const handleClick = (option) => {
    handleChangeQuery?.(option);
  };

  const isValidQueryOptions = Array.isArray(queryOptions) && queryOptions.length > 0;

  if (!isValidQueryOptions) {
    return;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100%',
        alignItems: 'center'
      }}>
      {queryOptions.map((option) => (
        <Chip
          sx={{
            borderRadius: '16px',
            padding: '8px 18px',
            fontSize: '15px',
            flexShrink: 0,
            mr: 1,
            height: '36px'
          }}
          key={option}
          label={option}
          clickable
          color="primary"
          onClick={() => handleClick(option)}
        />
      ))}
    </Box>
  );
};

export { QueryChips };

QueryChips.propTypes = {
  handleChangeQuery: PropTypes.func,
  queryOptions: PropTypes.array
};
