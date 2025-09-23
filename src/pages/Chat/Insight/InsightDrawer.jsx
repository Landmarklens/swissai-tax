import React from 'react';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import { capitalizeFirstLetter } from '../../../utils/capitalizeFirstLetter';
import { Close } from '@mui/icons-material';
import { useMediaQuery } from '@mui/material';

const PRIORITY_OPTIONS = [
  { value: 'MUST', label: 'Must' },
  { value: 'IMPORTANT', label: 'Important' },
  { value: 'NICE-TO-HAVE', label: 'Nice-to-have' }
];

const InsightDrawer = ({
  open,
  onClose,
  insight,
  priorityLoading,
  onPriorityChange,
  onDeleteClick
}) => {
  const isMobile = useMediaQuery('(max-width: 600px)');

  if (!insight) return null;
  return (
    <Drawer
      anchor={isMobile ? 'bottom' : 'right'}
      open={open}
      onClose={onClose}
      PaperProps={{
        className: 'insight-drawer'
      }}>
      <div className="insight-drawer-content-wrapper">
        <div className="insight-drawer-header">
          <div className="insight-drawer-title">💡 {capitalizeFirstLetter(insight.text)}</div>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </div>
        <hr className="insight-drawer-divider" />
        <div className="insight-drawer-section">
          <div className="insight-drawer-section-label">Source sentence:</div>
          <div className="insight-drawer-section-value">{insight.source_sentence}</div>
        </div>
        <div className="insight-drawer-section">
          <div className="insight-drawer-section-label">Confidence:</div>
          <div className="insight-drawer-section-value">{insight.confidence}%</div>
        </div>
        <div className="insight-drawer-section">
          <div className="insight-drawer-section-label">
            Priority:
            <Select
              size="small"
              value={insight.priority || ''}
              onChange={onPriorityChange}
              disabled={priorityLoading}
              sx={{ ml: 1, minWidth: 120 }}>
              {PRIORITY_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {priorityLoading && <CircularProgress size={18} sx={{ ml: 1 }} />}
          </div>
        </div>
      </div>
      <div className="insight-drawer-actions">
        <Button variant="contained" color="primary" onClick={onClose}>
          Keep
        </Button>
        <Button variant="outlined" color="error" onClick={onDeleteClick}>
          Delete
        </Button>
      </div>
    </Drawer>
  );
};

export default InsightDrawer;
