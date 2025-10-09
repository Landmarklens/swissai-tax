import { ModalFooter } from '../ModalFooter/ModalFooter';
import { ModalHeader } from '../ModalHeader/ModalHeader';
import './RetentionOffer.scss';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

const RetentionOffer = ({ handleCloseModal, incrementStep }) => {
  const { t } = useTranslation();
  return (
    <div className="retention-offer-modal-body">
      <ModalHeader handleCloseModal={handleCloseModal} />
      <div className="content">
        <h2 className="title">{t('filing.what_would_bring_you_back_to_home__939723')}</h2>
        <p className="description">
          We're a small team working hard to make the best product possible. Please let us know
          where we need to improve whether that's product features, user experience, design, or
          anything else on your mind.
        </p>
        <p className="offer">
          How's Premium Advance Search for <span className="accent">40% off</span> instead?
        </p>
      </div>
      <ModalFooter handleGoBack={handleCloseModal} handleNext={incrementStep} />
    </div>
  );
};

export { RetentionOffer };

RetentionOffer.propTypes = {
  handleCloseModal: PropTypes.func,
  incrementStep: PropTypes.func
};
