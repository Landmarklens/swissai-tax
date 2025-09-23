import { Avatar, Box, Typography } from '@mui/material';

const FeedbackItem = ({ item }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${month} ${day} ${year}`;
  };
  return (
    <Box
      sx={{
        gap: '6px',
        paddingTop: 2,
        borderTop: '1px solid #C1D0FF'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '6px'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            gap: '10px',
            alignItems: 'center'
          }}
        >
          <Avatar
            src={item.avatar_url || '/path-to-default-image.jpg'}
            sx={{ width: '32px', height: '32px' }}
          />
          {item.user_name && (
            <Typography sx={{ fontSize: 16, color: '#202020', fontWeight: 500 }} variant="body2">
              {item.user_name}
            </Typography>
          )}
        </Box>
        <Typography
          sx={{
            fontSize: 14,
            color: '#646464',
            fontWeight: 300
          }}
          variant="body2"
        >
          {formatDate(item.created_at)}
        </Typography>
      </Box>
      <Box sx={{ ml: '42px' }}>
        <Typography
          sx={{
            fontSize: 16,
            color: '#646464',
            fontWeight: 300,
            mt: '4px'
          }}
          variant="body2"
        >
          {item.feedback}
        </Typography>
      </Box>
    </Box>
  );
};

export default FeedbackItem;
