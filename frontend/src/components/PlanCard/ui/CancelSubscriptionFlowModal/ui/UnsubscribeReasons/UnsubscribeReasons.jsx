import './UnsubscribeReasons.scss';
import PropTypes from 'prop-types';

import { ModalFooter } from '../ModalFooter/ModalFooter';
import { ModalHeader } from '../ModalHeader/ModalHeader';

import { RadioGroup, FormControlLabel, Radio, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { reasons } from './models/constants';

const UnsubscribeReasons = ({ handleCloseModal, decrementStep, incrementStep }) => {
  const [selectedReason, setSelectedReason] = useState(reasons[0]?.value);
  const [comment, setComment] = useState('');

  const handleChangeReason = (event) => {
    setSelectedReason(event.target.value);
  };

  return (
    <div className="unsubscribe-reasons-modal-body">
      <ModalHeader handleCloseModal={handleCloseModal} />
      <div className="content">
        <h2 className="title">What's going wrong?</h2>
        <p className="description">We'd love to hear why you are thinking about cancelling.</p>

        <RadioGroup
          className="reasons-list"
          aria-label="unsubscribe-reasons"
          name="unsubscribe-reasons"
          sx={{ rowGap: '10px' }}
          value={selectedReason}
          onChange={handleChangeReason}>
          {reasons.map(({ value, label }) => (
            <FormControlLabel
              key={value}
              value={value}
              control={<Radio sx={{ padding: 0, paddingRight: '16px' }} />}
              label={label}
            />
          ))}
        </RadioGroup>

        <Typography
          variant="subtitle1"
          component="label"
          htmlFor="comment-textarea"
          sx={{ mb: 1, display: 'block' }}>
          Could you tell us more? Be brutally honest
        </Typography>

        <TextField
          id="comment-textarea"
          placeholder="We read every answer..."
          multiline
          rows={2.3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          fullWidth
          variant="outlined"
        />
      </div>
      <ModalFooter handleGoBack={decrementStep} handleNext={incrementStep} />
    </div>
  );
};

export { UnsubscribeReasons };

UnsubscribeReasons.propTypes = {
  handleCloseModal: PropTypes.func,
  decrementStep: PropTypes.func,
  incrementStep: PropTypes.func
};
