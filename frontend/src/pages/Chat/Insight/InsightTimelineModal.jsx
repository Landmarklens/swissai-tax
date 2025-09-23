import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import { capitalizeFirstLetter } from '../../../utils/capitalizeFirstLetter';
import { useSelector } from 'react-redux';

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'MUST':
      return '#001cf5';
    case 'IMPORTANT':
      return '#f5a623';
    case 'NICE-TO-HAVE':
      return '#8da4ef';
    default:
      return '#001cf5';
  }
};

const InsightTimelineModal = ({ open, onClose }) => {
  const loading = useSelector(
    (state) => state.conversations.activeConversationProfile?.timelineLoading
  );
  const error = useSelector(
    (state) => state.conversations.activeConversationProfile?.timelineError
  );
  const timeline = useSelector(
    (state) => state.conversations.activeConversationProfile?.timeline || []
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle className="insight-timeline-dialog-title">
        Insight Timeline
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <div className="insight-timeline-loading">
            <CircularProgress />
          </div>
        ) : null}

        {!loading && error && !timeline.length ? (
          <div className="insight-timeline-error">{error}</div>
        ) : null}

        {!loading && timeline.length > 0 && (
          <ul className="insight-timeline-list">
            {timeline.length === 0 && (
              <li className="insight-timeline-list-empty">No history found</li>
            )}
            {timeline.map((item, idx) => {
              const time = item.timestamp ? item.timestamp.slice(11, 16) : '';
              const text = item.new_value?.text || '';
              const priority = item.new_value?.priority || '';
              return (
                <li key={item.id || idx} className="insight-timeline-list-item">
                  <span className="insight-timeline-time">{time}</span>
                  <span
                    className="insight-timeline-badge"
                    style={{ background: getPriorityColor(priority) }}>
                    {priority.replace('-', ' ').toLowerCase()}
                  </span>
                  <span className="insight-timeline-value">{capitalizeFirstLetter(text)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InsightTimelineModal;
