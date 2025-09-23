import { useNavigate } from 'react-router-dom';
import { ModalFooter } from '../ModalFooter/ModalFooter';
import { ModalHeader } from '../ModalHeader/ModalHeader';
import './CancellationSuccess.scss';
import PropTypes from 'prop-types';

const CancellationSuccess = ({ handleCloseModal }) => {
  const navigate = useNavigate();

  const navigateToAccount = () => {
    handleCloseModal();
    navigate('/my-account?section=searches');
  };

  return (
    <div className="cancellation-success-modal-body">
      <ModalHeader handleCloseModal={handleCloseModal} />
      <div className="content">
        <h2 className="title">Cancellation Confirmed.</h2>
        <p className="description">You won’t be billed again.</p>
      </div>
      <ModalFooter handleNext={navigateToAccount} buttonText="Go to Account" isUnsubscribed />
    </div>
  );
};

export { CancellationSuccess };

CancellationSuccess.propTypes = {
  handleCloseModal: PropTypes.func
};
