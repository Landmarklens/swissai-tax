import React, { Fragment } from 'react';

import ChatIcon from '@mui/icons-material/ChatBubbleOutline';
import DeleteIcon from '@mui/icons-material/DeleteOutlineSharp';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import './ConversationsList.scss';
import { useDispatch, useSelector } from 'react-redux';
import {
  getConversationHistory,
  setActiveConversationId
} from '../../../../store/slices/conversationsSlice';
import { useSearchParams } from 'react-router-dom';

const ConversationsList = ({ className, onConversationSelect, isCollapsed }) => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const conversationProfiles = useSelector((state) => state.conversations.conversationProfiles);
  const activeConversationId = useSelector((state) => state.conversations.activeConversationId);

  const handleSelectConversation = (id) => {
    dispatch(setActiveConversationId(id));
    dispatch(getConversationHistory({ id }));

    // Update URL with conversation ID
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('conversation', id);
    setSearchParams(newSearchParams);

    if (onConversationSelect) {
      onConversationSelect(id);
    }
  };

  const handleDeleteConversation = (id) => {};

  const formatChatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
      return 'Today';
    } else if (isYesterday) {
      return 'Yesterday';
    } else {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return date.toLocaleDateString('en-US', options);
    }
  };

  const groupChatsByDay = (conversations) => {
    if (!Array.isArray(conversations) || conversations.length === 0) {
      return;
    }

    const sortedConversations = [...conversations].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const groups = {};

    for (const conversation of sortedConversations) {
      const key = formatChatDate(conversation.created_at);

      if (!groups[key]) {
        groups[key] = [];
      }

      groups[key].push(conversation);
    }

    return groups;
  };

  const sortGroupKeys = (keys) => {
    return keys.sort((a, b) => {
      const priority = {
        Today: 0,
        Yesterday: 1
      };

      const aPriority = priority[a];
      const bPriority = priority[b];

      if (aPriority !== undefined && bPriority !== undefined) {
        return aPriority - bPriority;
      }

      if (aPriority !== undefined) return -1;
      if (bPriority !== undefined) return 1;

      const aDate = new Date(a);
      const bDate = new Date(b);
      return bDate.getTime() - aDate.getTime();
    });
  };

  const groupedConversations = groupChatsByDay(conversationProfiles);
  const sortedGroupKeys = groupedConversations
    ? sortGroupKeys(Object.keys(groupedConversations))
    : [];

  if (isCollapsed) {
    return (
      <>
        {groupedConversations &&
          sortedGroupKeys.map((day) => {
            const conversations = groupedConversations[day];

            return (
              <div key={day} className={clsx('main-wrapper', className)}>
                <ul className="list">
                  {conversations.map(({ id, name, profile }) => {
                    return (
                      <li
                        key={id}
                        className={clsx('list-item', {
                          active: id === activeConversationId
                        })}>
                        <button
                          onClick={() => handleSelectConversation(id)}
                          className="item-button">
                          <ChatIcon className="chat-icon" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
      </>
    );
  }

  return (
    <>
      {groupedConversations &&
        sortedGroupKeys.map((day) => {
          const conversations = groupedConversations[day];

          return (
            <Fragment key={day}>
              <div className={clsx('main-wrapper', className)}>
                <h3 className="day">{day}</h3>
                <ul className="list">
                  {conversations.map(({ id, name }) => {
                    // const resultTitle = formatChatTitle(profile?.insights, 12);

                    return (
                      <li
                        key={id}
                        className={clsx('list-item', {
                          active: id === activeConversationId
                        })}>
                        <button
                          onClick={() => handleSelectConversation(id)}
                          className="item-button">
                          <ChatIcon className="chat-icon" />
                          <span className="content">
                            <span className="title">{name || 'New Chat'}</span>
                          </span>
                        </button>
                        <button
                          onClick={() => handleDeleteConversation(id)}
                          className="delete-button">
                          <DeleteIcon />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </Fragment>
          );
        })}
    </>
  );
};

export { ConversationsList };

ConversationsList.propTypes = {
  className: PropTypes.string,
  onConversationSelect: PropTypes.func,
  isCollapsed: PropTypes.bool
};
