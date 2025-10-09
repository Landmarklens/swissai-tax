import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@mui/material';
import { styled } from '@mui/system';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectSubscriptions,
  getSubscription,
  createSubscription,
  createCheckoutUrl
} from '../../store/slices/subscriptionsSlice';
import './PlanCard.scss';
import { CancelSubscriptionFlowModal } from './ui/CancelSubscriptionFlowModal/CancelSubscriptionFlowModal';

const PlanContainer = styled('div')(({ theme }) => ({
  maxWidth: 350,
  padding: '28px 24px',
  border: '1px solid #C1D0FF',
  backgroundColor: theme.palette.primary.main,
  borderRadius: '8px',
  color: '#fff'
}));

const PlanInfo = styled('div')(({ theme }) => ({}));

const FeatureList = styled('ul')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  rowGap: 14,
  marginBottom: 20
}));

const AccordionItem = styled('div')(({ theme, isExpanded }) => ({
  borderRadius: theme.shape.borderRadius,
  cursor: 'pointer'
}));

const AccordionTitle = styled('div')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
});

const PlanCard = ({ title, price, keyFeatures }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const [isLoading, setIsLoading] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [isOpenCancelModal, setIsOpenCancelModal] = useState(false);

  const handleOpenModal = () => setIsOpenCancelModal(true);
  const handleCloseModal = () => setIsOpenCancelModal(false);

  const { subscription } = useSelector(selectSubscriptions);

  const activePlan = subscription?.data?.[0];

  const subscriptionStartDate = activePlan?.start_date
    ? new Date(activePlan?.start_date || '')
        .toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })
        .replace(/ /g, ' ')
    : null;

  const subscriptionEndDate = activePlan?.next_billing_date
    ? new Date(activePlan?.next_billing_date || '')
        .toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })
        .replace(/ /g, ' ')
    : null;

  const trialPeriodEndDate = subscription?.accessUntil
    ? new Date(subscription.accessUntil)
        .toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })
        .replace(/ /g, ' ')
    : null;

  const handleCreateSubscribe = async () => {
    try {
      setIsLoading(true);

      dispatch(createCheckoutUrl({ plan: 'comprehensive' }));
    } catch (error) {
      console.error('Error during upgrade:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleAccordionClick = (index) => {
    setExpandedIndex(index === expandedIndex ? null : index);
  };

  const buttonAction = subscription.isActive ? handleOpenModal : handleCreateSubscribe;
  const buttonText = subscription.isActive ? 'Cancel subscription' : 'Subscribe';

  return (
    <PlanContainer>
      <PlanInfo>
        <h3 className="plan-title">{title}</h3>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <Typography variant="h4" style={{ marginRight: 4, fontWeight: 'bold' }}>
            {price}
          </Typography>

          <Typography sx={{ paddingBottom: '6px' }} variant="body2">
            {t('per month')}
          </Typography>
        </div>
      </PlanInfo>

      <div>
        <Typography variant="body1" sx={{ opacity: 0.7, color: 'white', marginBottom: '12px' }}>
          {t('Key Features')}:
        </Typography>
        <FeatureList
          id="FeatureList"
          sx={{
            display: 'flex',
            flexDirection: 'column'
          }}>
          {keyFeatures.map((feature, index) => (
            <AccordionItem
              key={feature.feature}
              isExpanded={expandedIndex === index}
              onClick={() => handleAccordionClick(index)}>
              <AccordionTitle>
                <div style={{ display: 'flex', alignItems: 'center', fontSize: 16 }}>
                  <CheckCircleIcon fontSize="medium" style={{ marginRight: 8 }} />
                  <Typography variant="body2" sx={{ fontSize: 16, paddingY: '4px' }}>
                    {feature.feature}
                  </Typography>
                </div>
                {expandedIndex === index ? (
                  <Typography style={{ color: '#fff' }}>▲</Typography>
                ) : (
                  <Typography style={{ color: '#fff' }}>▼</Typography>
                )}
              </AccordionTitle>
              {expandedIndex === index && (
                <Typography variant="body2" style={{ marginTop: 8 }}>
                  {feature.description}
                </Typography>
              )}
            </AccordionItem>
          ))}
        </FeatureList>

        {subscription.isActive && (
          <div className="wrapper-dates">
            <p>Start a subscription: {subscriptionStartDate}</p>
            <p>Subscription end date: {subscriptionEndDate}</p>
          </div>
        )}
        {subscription.isTrialActive && (
          <div className="wrapper-trial-info">
            <p>{t('filing.trial_period_1_day')}</p>
            <p>The trial period will last until: {trialPeriodEndDate}</p>
          </div>
        )}

        <button disabled={isLoading} onClick={buttonAction} className="button">
          {buttonText}
        </button>
      </div>
      <CancelSubscriptionFlowModal isOpen={isOpenCancelModal} handleCloseModal={handleCloseModal} />
    </PlanContainer>
  );
};

export { PlanCard };
