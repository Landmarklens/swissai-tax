import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import IconButton from '@mui/material/IconButton';
import { capitalizeFirstLetter } from '../../../utils/capitalizeFirstLetter';
import { deleteInsight, updateInsightPriority } from '../../../store/slices/conversationsSlice';
import { Close } from '@mui/icons-material';
import DeleteInsightDialog from './DeleteInsightDialog';
import InsightDrawer from './InsightDrawer';

const InsightItem = ({ insight, onDeleted }) => {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [priorityLoading, setPriorityLoading] = useState(false);
  const dispatch = useDispatch();

  // Debug logging
  console.log('📌 InsightItem rendering:', {
    insightId: insight?.id,
    text: insight?.text,
    priority: insight?.priority,
    isLocal: insight?.isLocal,
    origin: insight?.origin
  });

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    // Check if insight has an ID (saved insights have IDs, temp insights don't)
    if (!insight.id) {
      console.warn('Cannot delete insight without ID (likely a temporary insight)');
      setDeleteModalOpen(false);
      if (onDeleted) onDeleted(insight);
      return;
    }
    
    try {
      await dispatch(deleteInsight(insight.id));
      setDeleteModalOpen(false);
      setSheetOpen(false);
      if (onDeleted) onDeleted(insight.id);
    } catch (e) {
      alert('Failed to delete insight');
    }
  };

  const handleOpenSheet = () => {
    setSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setSheetOpen(false);
  };

  const handlePriorityChange = async (e) => {
    // Check if insight has an ID (saved insights have IDs, temp insights don't)
    if (!insight.id) {
      console.warn('Cannot update priority for insight without ID (likely a temporary insight)');
      return;
    }
    
    const newPriority = e.target.value;
    setPriorityLoading(true);
    try {
      await dispatch(updateInsightPriority({ insightId: insight.id, priority: newPriority }));
    } catch (err) {
      console.error(err);
    } finally {
      setPriorityLoading(false);
    }
  };

  return (
    <>
      <div
        className={`insight-value ${insight.origin === 'AI' ? 'insight-value--ai' : ''}`}
        style={{ marginRight: 4, cursor: 'pointer' }}
        onClick={handleOpenSheet}>
        <span>{capitalizeFirstLetter(insight.text)}</span>
        <IconButton
          sx={{ padding: 0 }}
          size="small"
          aria-label="delete insight"
          onClick={handleDeleteClick}>
          <Close fontSize="16" />
        </IconButton>
      </div>

      <InsightDrawer
        open={sheetOpen}
        onClose={handleCloseSheet}
        insight={insight}
        priorityLoading={priorityLoading}
        onPriorityChange={handlePriorityChange}
        onDeleteClick={() => setDeleteModalOpen(true)}
      />

      <DeleteInsightDialog
        open={deleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};

export default InsightItem;
