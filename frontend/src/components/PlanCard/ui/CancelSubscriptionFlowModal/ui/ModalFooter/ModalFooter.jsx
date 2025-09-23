import './ModalFooter.scss';
import PropTypes from 'prop-types';

const ModalFooter = ({
  handleGoBack,
  handleNext,
  buttonText = 'Next',
  isUnsubscribed,
  isLoading
}) => {
  return (
    <div style={isUnsubscribed && { justifyContent: 'center' }} className="modal-footer">
      {!isUnsubscribed && (
        <>
          <button className="back-button" onClick={handleGoBack}>
            Go Back
          </button>
          <button disabled={isLoading} className="next-button" onClick={handleNext}>
            {buttonText}
          </button>
        </>
      )}

      {isUnsubscribed && (
        <button className="next-button" onClick={handleNext}>
          {buttonText}
        </button>
      )}
    </div>
  );
};

export { ModalFooter };

ModalFooter.propTypes = {
  handleNext: PropTypes.func,
  handleGoBack: PropTypes.func,
  buttonText: PropTypes.string,
  isUnsubscribed: PropTypes.bool,
  isLoading: PropTypes.bool
};
