import './ModalHeader.scss';
import PropTypes from 'prop-types';
import CloseIcon from '@mui/icons-material/Close';

const ModalHeader = ({ handleCloseModal }) => {
  return (
    <div className="modal-header">
      <p className="modal-title">Cancel Subscription</p>
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
