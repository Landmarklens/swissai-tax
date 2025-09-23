import { ModalFooter } from '../ModalFooter/ModalFooter';
import { ModalHeader } from '../ModalHeader/ModalHeader';
import './SpecialDiscountOffer.scss';
import PropTypes from 'prop-types';

const SpecialDiscountOffer = ({ handleCloseModal, decrementStep, incrementStep }) => {
  return (
    <div className="special-discount-offer-modal-body">
      <ModalHeader handleCloseModal={handleCloseModal} />
      <div className="content">
        <h2 className="title">Still not convinced? How's Premium for 40% off instead?</h2>
        <p className="description">
          We're a small team working hard to make the best product possible. Please let us know
          where we need to improve whether that's product features, user experience, design, or
          anything else on your mind.
        </p>

        <div className="offer-block">
          <p className="offer-time">Claim your limited-time offer:</p>
          <h2 className="offer-title">40% off for 12 months</h2>
          <button className="offer-button">Accept Offer</button>
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
