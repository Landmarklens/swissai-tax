import React from 'react';
import PropTypes from 'prop-types';
import './UserMessageCard.scss';
import { useSelector } from 'react-redux';

const UserMessageCard = ({ message, time }) => {
  const senderName = useSelector((state) => state.account.data?.firstname);
  return (
    <div className="user-card-message">
      <div className="user-info">
        <p className="user-name">You</p>{' '}
        <span className="user-card-icon">{senderName || 'User'}</span>
      </div>
      <div className="user-message">
        <p className="message">{message}</p>
        <p className="time">{time}</p>
      </div>
    </div>
  );
};

export { UserMessageCard };
UserMessageCard.propTypes = {
  message: PropTypes.string.isRequired,
  time: PropTypes.string.isRequired
};
