import './PlanCard.scss';
import PropTypes from 'prop-types';
import { PricingFeatureList } from './PricingFeatureList/PricingFeatureList';
import { useTranslation } from 'react-i18next';

const PlanCard = ({ data, handleClickCardButton, userType = 'tenant' }) => {
  const { t } = useTranslation();

  const handleClick = () => {
    handleClickCardButton?.();
  };

  const isLandlord = userType === 'landlord';

  return (
    <li className="plan-card">
      <h2 className="price">
        {isLandlord
          ? t('CHF 49 / month')
          : t('pricing_price_text', 'CHF 29.99 / month')}
      </h2>

      {isLandlord && (
        <p className="badge" style={{ color: '#10B981', fontWeight: '600', marginTop: '-10px', marginBottom: '10px' }}>
          Starter Plan - Perfect for 1-3 properties
        </p>
      )}

      <p className="description">
        {isLandlord
          ? t('Start with your 7-day free trial')
          : t('pricing_start_free_pass', 'Start with your 1-day free pass')}
      </p>

      <PricingFeatureList data={data.features} />

      <div className="wrapper-button">
        <button className="card-button" onClick={handleClick}>
          {isLandlord
            ? t('Start Free Week')
            : t('pricing_get_free_pass', 'Get my free 1‑day pass')}
        </button>
      </div>
      <p className="text">
        {isLandlord
          ? t('No credit card required • Cancel anytime • Full access')
          : t('pricing_no_hidden_fees', 'No hidden fees • Cancel anytime • Try it Now!')}
      </p>
    </li>
  );
};

export { PlanCard };

PlanCard.propTypes = {
  data: PropTypes.any,
  isAuthenticated: PropTypes.bool,
  handleClickCardButton: PropTypes.func
};