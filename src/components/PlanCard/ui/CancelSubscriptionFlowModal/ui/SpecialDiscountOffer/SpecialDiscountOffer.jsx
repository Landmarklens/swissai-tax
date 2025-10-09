import { ModalFooter } from '../ModalFooter/ModalFooter';
import { ModalHeader } from '../ModalHeader/ModalHeader';
import './SpecialDiscountOffer.scss';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

const SpecialDiscountOffer = ({ handleCloseModal, decrementStep, incrementStep }) => {
  const { t } = useTranslation();
  return (
    <div className="special-discount-offer-modal-body">
      <ModalHeader handleCloseModal={handleCloseModal} />
      <div className="content">
        <h2 className="title">{t('filing.still_not_convinced_hows_premium_f_ea68f2')}</h2>
        <p className="description">
          We're a small team working hard to make the best product possible. Please let us know
          where we need to improve whether that's product features, user experience, design, or
          anything else on your mind.
        </p>

        <div className="offer-block">
          <p className="offer-time">{t('filing.claim_your_limitedtime_offer')}</p>
          <h2 className="offer-title">40% off for 12 months</h2>
          <button className="offer-button">{t('filing.accept_offer')}</button>
        </div>
      </div>
      <ModalFooter
        handleGoBack={decrementStep}
        handleNext={incrementStep}
        buttonText="Decline Offer"
      />
    </div>
  );
};

export { SpecialDiscountOffer };

SpecialDiscountOffer.propTypes = {
  handleCloseModal: PropTypes.func,
  decrementStep: PropTypes.func,
  incrementStep: PropTypes.func
};
