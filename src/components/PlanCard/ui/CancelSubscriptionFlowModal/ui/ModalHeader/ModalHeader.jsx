import './ModalHeader.scss';
import PropTypes from 'prop-types';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';

const ModalHeader = ({ handleCloseModal }) => {
  const { t } = useTranslation();
  return (
    <div className="modal-header">
      <p className="modal-title">{t('filing.cancel_subscription')}</p>
      <button className="close-button" onClick={handleCloseModal}>
        <CloseIcon className="close-icon" />
      </button>
    </div>
  );
};

export { ModalHeader };

ModalHeader.propTypes = {
  handleCloseModal: PropTypes.func.isRequired
};
