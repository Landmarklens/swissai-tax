import { Box, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { theme } from '../../../theme/theme';
import { team } from '../../../store/slices/teamSlice';
import { useDispatch } from 'react-redux';
import Loading from '../../Loading/Loading';
import { errorHandler } from '../../../utils';
import { jsonData } from '../../../db';
import { useTranslation } from 'react-i18next';
const Team = () => {
  const { t } = useTranslation();
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();

  const getTeam = async () => {
    setIsLoading(true);
    try {
      const data = await dispatch(team());
      if (data.payload.status === 200) {
        setTeams(data?.payload?.data);
      } else {
        // No data found
      }
    } catch (error) {
      errorHandler(error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    // getTeam();
  }, []);

  return (
    <>
      {!isLoading ? (
        <Box
          id="about-us"
          sx={{
            backgroundColor: theme.palette.background.lightBlue,
            maxWidth: '100%',
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            height: 'auto',
            py: 10,
            px: 15,
            gap: 10,
            [theme.breakpoints.down('md')]: {
              px: 5,
              justifyContent: 'center'
            }
          }}
        >
          <Box
            sx={{
              width: '46%',
              height: '100%',
              display: 'flex',
              justifyContent: 'end',
              alignItems: 'center',
              flexGrow: 1
            }}
          >
            {/* imageBox */}
            <Box
              sx={{
                width: '90%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexWrap: 'wrap',
                borderRadius: '15px',
                gap: 2,
                p: 2,
                backgroundColor: '#edf2fe',
                border: '1px solid #dce4fe',
                [theme.breakpoints.down('md')]: {
                  width: '100%'
                }
              }}
            >
              {jsonData?.team?.map((image, index) => (
                <Box
                  key={index}
                  sx={{
                    width: {
                      xs: '100%', // 1 image per row on small screens (xs)
                      sm: '48%', // 2 images per row on medium screens (sm)
                      md: '30%' // 3 images per row on larger screens (md and up)
                    },
                    height: '120px',
                    borderRadius: '7px',
                    border: '1px solid #dce4fe',
                    padding: '5px',
                    flexGrow: 1,
                    boxSizing: 'border-box',
                    backgroundColor: 'white'
                  }}
                >
                  <img
                    src={image.src}
                    alt={image.alt}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '7px'
                    }}
                  />
                </Box>
              ))}
            </Box>
          </Box>

          <Box
            sx={{
              width: '45%',
              flexGrow: 1
            }}
          >
            <Typography
              sx={{
                fontSize: '25px',
                fontWeight: 700,
                color: 'black'
              }}
            >
              {t('Meet the Team Behind the AI')}
            </Typography>
            <Typography
              sx={{
                pt: 2,
                fontSize: '12px',
                width: '65%',
                [theme.breakpoints.down('md')]: {
                  width: '100%'
                }
              }}
            >
              {t(
                'We are a team of real estate experts, Al engineers, and customer service enthusiasts dedicated to transforming how you find your next home. Our mission is to make property search smarter, faster, and more enjoyable for everyone.'
              )}
            </Typography>
          </Box>
        </Box>
      ) : (
        <Loading />
      )}
    </>
  );
};

export default Team;
