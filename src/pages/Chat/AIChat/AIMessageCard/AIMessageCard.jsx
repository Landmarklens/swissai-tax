import PropTypes from 'prop-types';
import React from 'react';

import './AIMessageCard.scss';

const AIAgentIcon = () => (
  <div className="wrapper-icon">
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#3E63DD" />
      <path
        d="M24.9996 21C25.0009 21.2039 24.9389 21.4031 24.8223 21.5703C24.7057 21.7375 24.5401 21.8645 24.3484 21.9338L21.1246 23.125L19.9371 26.3512C19.8668 26.5423 19.7396 26.7072 19.5726 26.8236C19.4056 26.9401 19.2069 27.0025 19.0034 27.0025C18.7998 27.0025 18.6011 26.9401 18.4341 26.8236C18.2672 26.7072 18.1399 26.5423 18.0696 26.3512L16.8746 23.125L13.6484 21.9375C13.4573 21.8672 13.2924 21.7399 13.176 21.573C13.0595 21.406 12.9971 21.2073 12.9971 21.0037C12.9971 20.8002 13.0595 20.6015 13.176 20.4345C13.2924 20.2676 13.4573 20.1403 13.6484 20.07L16.8746 18.875L18.0621 15.6488C18.1324 15.4577 18.2597 15.2928 18.4266 15.1764C18.5936 15.0599 18.7923 14.9975 18.9959 14.9975C19.1994 14.9975 19.3981 15.0599 19.5651 15.1764C19.7321 15.2928 19.8593 15.4577 19.9296 15.6488L21.1246 18.875L24.3509 20.0625C24.5427 20.1324 24.7082 20.2601 24.8244 20.428C24.9406 20.5959 25.0018 20.7958 24.9996 21Z"
        fill="white"
      />
    </svg>
  </div>
);

const AIMessageContent = ({ title, message, className = '' }) => (
  <div className="content">
    <h4 className="title">{title}</h4>
    <p className={`description ${className}`}>{message}</p>
  </div>
);

const AIMessageCard = ({ message, isTyping }) => {
  if (isTyping) {
    return (
      <div className="AI-message-card">
        <AIAgentIcon />
        <AIMessageContent title="AI Agent" message="Typing..." />
      </div>
    );
  }

  if (message) {
    return (
      <div className="AI-message-card">
        <AIAgentIcon />
        <AIMessageContent title="AI Agent" message={message} />
      </div>
    );
  }

  return null;
};

AIMessageCard.propTypes = {
  message: PropTypes.string,
  isTyping: PropTypes.bool,
  recommendationsLoading: PropTypes.bool
};

export { AIMessageCard };
