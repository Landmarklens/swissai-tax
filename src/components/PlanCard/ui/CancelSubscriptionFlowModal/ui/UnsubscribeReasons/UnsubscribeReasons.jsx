import './UnsubscribeReasons.scss';
import PropTypes from 'prop-types';

import { ModalFooter } from '../ModalFooter/ModalFooter';
import { ModalHeader } from '../ModalHeader/ModalHeader';

import { RadioGroup, FormControlLabel, Radio, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { reasons } from './models/constants';
import { useTranslation } from 'react-i18next';

const UnsubscribeReasons = ({ handleCloseModal, decrementStep, incrementStep }) => {
  const { t } = useTranslation();
  const [selectedReason, setSelectedReason] = useState(reasons[0]?.value);
  const [comment, setComment] = useState('');

  const handleChangeReason = (event) => {
    setSelectedReason(event.target.value);
  };

  return (
    <div className="unsubscribe-reasons-modal-body">
      <ModalHeader handleCloseModal={handleCloseModal} />
      <div className="content">
        <h2 className="title">{t('filing.whats_going_wrong')}</h2>
        <p className="description">{t('filing.wed_love_to_hear_why_you_are_think_4c5834')}</p>

        <RadioGroup
          className="reasons-list"
          aria-label={t("filing.unsubscribereasons")}
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
          placeholder={t("filing.we_read_every_answer")}
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
