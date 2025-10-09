import React from 'react';
import { Modal, IconButton } from '@mui/material';
import { styled } from '@mui/system';
import CloseIcon from '@mui/icons-material/Close';
import Plan from '../plan/plan';
import DiscountOffer from '../discountOffer/discountOffer';
import { useTranslation } from 'react-i18next';

const StyledModalBox = styled('div')(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 800,
  backgroundColor: theme.palette.background.paper,
  borderRadius: '8px',
  boxShadow: 24,
  padding: theme.spacing(4),
  maxHeight: '80vh'
}));

const PlansContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  gap: theme.spacing(2),
  alignItems: 'flex-start'
}));

const ProUpgradeModal = ({ proPlan, discountOffer, open, onClose }) => {
  const { t } = useTranslation();
  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <StyledModalBox>
        <PlansContainer>
          <Plan
            name={proPlan.name}
            price={proPlan.price}
            keyFeatures={proPlan.keyFeatures}
            isUpgrade={true}
            originalPrice={proPlan.originalPrice}
          />
          <DiscountOffer discountOffer={discountOffer} />
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </PlansContainer>
      </StyledModalBox>
    </Modal>
  );
};

export default ProUpgradeModal;
