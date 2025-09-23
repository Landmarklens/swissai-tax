import { useState } from 'react';
import { ModalFooter } from '../ModalFooter/ModalFooter';
import { ModalHeader } from '../ModalHeader/ModalHeader';
import './FinalConfirmationNotice.scss';
import PropTypes from 'prop-types';
import {
  cancelSubscription,
  getSubscription
} from '../../../../../../store/slices/subscriptionsSlice';
import { useDispatch } from 'react-redux';

const FinalConfirmationNotice = ({ handleCloseModal, decrementStep, incrementStep }) => {
  const dispatch = useDispatch();

  const [isLoading, setIsLoading] = useState(false);

  const handleCancelSubscription = async () => {
    try {
      setIsLoading(true);
      dispatch(cancelSubscription());
      dispatch(getSubscription());

      incrementStep();
    } catch (error) {
      console.error('Error during cancellation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="final-confirmation-notice-modal-body">
      <ModalHeader handleCloseModal={handleCloseModal} />
      <div className="content">
        <h2 className="title">Just making sure.</h2>
        <p className="description">
          You’ll only be able to match 1 and won’t be able to get premium feature.
        </p>
      </div>
      <ModalFooter
        handleGoBack={decrementStep}
        handleNext={handleCancelSubscription}
        buttonText="Confirm & Cancel"
        isLoading={isLoading}
      />
    </div>
  );
};

export { FinalConfirmationNotice };

FinalConfirmationNotice.propTypes = {
  handleCloseModal: PropTypes.func,
  decrementStep: PropTypes.func,
  incrementStep: PropTypes.func
};
