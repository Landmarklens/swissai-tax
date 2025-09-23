import { Modal } from '@mui/material';
import PropTypes from 'prop-types';
import './CancelSubscriptionFlowModal.scss';
import { RetentionOffer } from './ui/RetentionOffer/RetentionOffer';
import { UnsubscribeReasons } from './ui/UnsubscribeReasons/UnsubscribeReasons';
import { useSteps } from '../../../../hooks/useSteps';
import { SpecialDiscountOffer } from './ui/SpecialDiscountOffer/SpecialDiscountOffer';
import { FinalConfirmationNotice } from './ui/FinalConfirmationNotice\t/FinalConfirmationNotice';
import { CancellationSuccess } from './ui/CancellationSuccess/CancellationSuccess';

const CancelSubscriptionFlowModal = ({ isOpen, handleCloseModal }) => {
  const { incrementStep, decrementStep, steps, resetSteps } = useSteps({ totalSteps: 5 });

  const { isStep1, isStep2, isStep3, isStep4, isStep5 } = steps;

  const onCloseModal = () => {
    resetSteps();
    handleCloseModal();
  };

  return (
    <Modal className="modal-container" open={isOpen} onClose={handleCloseModal}>
      <>
        {isStep1 && (
          <RetentionOffer handleCloseModal={handleCloseModal} incrementStep={incrementStep} />
        )}
        {isStep2 && (
          <UnsubscribeReasons
            handleCloseModal={onCloseModal}
            decrementStep={decrementStep}
            incrementStep={incrementStep}
          />
        )}
        {isStep3 && (
          <SpecialDiscountOffer
            handleCloseModal={onCloseModal}
            decrementStep={decrementStep}
            incrementStep={incrementStep}
          />
        )}
        {isStep4 && (
          <FinalConfirmationNotice
            handleCloseModal={onCloseModal}
            decrementStep={decrementStep}
            incrementStep={incrementStep}
          />
        )}
        {isStep5 && <CancellationSuccess handleCloseModal={onCloseModal} />}
      </>
    </Modal>
  );
};

export { CancelSubscriptionFlowModal };

CancelSubscriptionFlowModal.propTypes = {
  isOpen: PropTypes.bool,
  handleCloseModal: PropTypes.func
};
