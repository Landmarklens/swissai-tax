import { styled } from '@mui/material/styles';
import { Box, Grid, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

const CardsWrapper = styled(Box)({
  display: 'grid',
  alignItems: 'center',
  justifyContent: 'center',
  paddingTop: 40,
  paddingBottom: 40,
  gridTemplateColumns: '100%',
  gap: 16,

  '@media (min-width: 600px)': {
    gridTemplateColumns: '100%',
    columnGap: 0,
    rowGap: 32
  },

  '@media (min-width: 900px)': {
    gridTemplateColumns: 'auto 100px auto 100px auto',
    alignItems: 'center'
  },
  '@media (min-width: 1000px)': {
    gap: 32
  }
});

const GridItem = styled(Grid)({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  margin: 'auto',
  padding: 8,
  maxWidth: 300,
  width: '100%'
});

const Circle = styled(Box)({
  width: 80,
  height: 80,
  borderRadius: '50%',
  backgroundColor: '#F5F8FF',
  margin: '0 auto',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  border: '1px solid #E0E5FF',
  position: 'relative'
});

const Badge = styled(Box)(({ color }) => ({
  position: 'absolute',
  top: -5,
  right: -5,
  width: 20,
  height: 20,
  borderRadius: '50%',
  backgroundColor: color,
  border: `2px solid ${color}`,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  color: '#fff',
  fontSize: 10,
  fontWeight: 'bold'
}));

const Title = styled(Typography)({
  fontWeight: 700,
  fontSize: 16,
  color: '#2F2F2F'
});

const Description = styled(Typography)({
  color: '#6B7280',
  fontSize: 14,
  margin: '5px auto'
});

const WrapperArrow = styled(Typography)({
  '@media (max-width: 900px)': {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '62px'
  }
});
const Arrow = styled(Typography)({
  '@media (max-width: 900px)': { transform: 'rotate(90deg)' }
});

export { CardsWrapper, GridItem, Circle, Badge, Title, Description, WrapperArrow, Arrow };
