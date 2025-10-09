import { useNavigate } from 'react-router-dom';
import { ModalFooter } from '../ModalFooter/ModalFooter';
import { ModalHeader } from '../ModalHeader/ModalHeader';
import './CancellationSuccess.scss';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

const CancellationSuccess = ({ handleCloseModal }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const navigateToAccount = () => {
    handleCloseModal();
    navigate('/my-account?section=searches');
  };

  return (
    <div className="cancellation-success-modal-body">
      <ModalHeader handleCloseModal={handleCloseModal} />
      <div className="content">
        <h2 className="title">{t('filing.cancellation_confirmed')}</h2>
        <p className="description">{t('filing.you_wont_be_billed_again')}</p>
      </div>
      <ModalFooter handleNext={navigateToAccount} buttonText="Go to Account" isUnsubscribed />
    </div>
  );
};

export { CancellationSuccess };

CancellationSuccess.propTypes = {
  handleCloseModal: PropTypes.func
};
