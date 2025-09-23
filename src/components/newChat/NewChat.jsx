import React, { useEffect } from 'react';
import { Box, Button, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { theme } from '../../theme/theme';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { jsonData } from '../../db';
import UpgradeModal from '../modals/upgradeModal';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useHover } from './../../hooks/useHover';
import { useDispatch, useSelector } from 'react-redux';
import { selectSubscriptions } from '../../store/slices/subscriptionsSlice';

const buttonStyling = {
  width: '100%',
  backgroundColor: 'transparent',
  color: theme.palette.text.primary,
  border: `1px solid #848a98`,
  height: '48px'
};

const NewChat = ({ prevVisitedList, onClick, onDeleteClick }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const [hoverRef, isHovered] = useHover();

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const { subscription } = useSelector(selectSubscriptions);

  const activePlan = subscription.data?.[0];

  const handleNewChatClick = () => {
    if (!activePlan) {
      handleOpen();
      return;
    }

    if (activePlan.plan === 'free' && !activePlan.canceled_at && !activePlan.next_billing_date) {
      handleOpen();
      return;
    }

    if (activePlan.next_billing_date && new Date() > new Date(activePlan.next_billing_date)) {
      handleOpen();
      return;
    }

    if (
      activePlan.status === 'incomplete' &&
      (!activePlan.canceled_at ||
        !activePlan.next_billing_date ||
        new Date() > new Date(activePlan.canceled_at))
    ) {
      handleOpen();
      return;
    }

    navigate('/chat');
  };

  return (
    <Box ref={hoverRef} id="NewChat">
      <Box>
        <Button fullWidth sx={buttonStyling} onClick={handleNewChatClick} startIcon={<AddIcon />}>
          {t('New ChatPage')}
        </Button>
      </Box>
      <UpgradeModal
        translate
        currentPlan={jsonData.currentPlan}
        upgradePlan={jsonData.upgradePlan}
        open={open}
        onClose={handleClose}
      />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 5 }}>
        {Object.keys(prevVisitedList).map((key) => {
          if (prevVisitedList[key].length === 0) return null;

          return (
            <Box key={key} sx={{ mb: 3 }}>
              <Typography sx={{ fontWeight: 500, color: 'black', mb: 1 }}>{key}</Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {prevVisitedList[key].map((item, index) => (
                  <Box
                    id={`prevVisitedList-${key}-${index}`}
                    onClick={() => onClick(item.id)}
                    key={item.id}
                    sx={{
                      backgroundColor: item.selected ? '#edf2fe' : 'transparent',
                      color: '#4f6ece',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      fontSize: '14px',
                      display: 'flex',
                      gap: 1,
                      position: 'relative',
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: '#d0e4fd' }
                    }}>
                    <Box>
                      <ChatBubbleOutlineIcon
                        sx={{ fontSize: '16px', mt: 0.3, color: theme.palette.text.secondary }}
                      />
                    </Box>
                    <Box sx={{ position: 'relative' }}>
                      <Typography sx={{ fontSize: '12px', color: 'black' }}>
                        {item.location}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Typography sx={{ fontSize: '10px' }}>
                          {`${t('Rooms')}: ${item.rooms}`}
                        </Typography>
                        <Typography sx={{ fontSize: '10px' }}>{item.size}</Typography>
                      </Box>
                    </Box>

                    {(item.selected || isHovered) && (
                      <Box>
                        <DeleteOutlineIcon
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteClick(item.id);
                          }}
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            fontSize: '15px',
                            color: theme.palette.text.secondary,
                            transition: 'transform 0.2s ease',
                            '&:hover': { transform: 'scale(1.2)' }
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default NewChat;
