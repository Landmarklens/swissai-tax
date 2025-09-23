import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  IconButton,
  Chip,
  LinearProgress,
  CircularProgress,
  Menu,
  MenuItem,
  Tooltip,
  Stack
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  Home as HomeIcon,
  Schedule as ScheduleIcon,
  Chat as ChatIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as IncompleteIcon,
  Archive as ArchiveIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  PushPin as PinIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { theme } from '../../../../theme/theme';

const ConversationCard = ({
  conversation,
  onSelect,
  onDelete,
  onArchive,
  onRename,
  onPin,
  onDuplicate,
  viewMode = 'grid'
}) => {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState(null);

  // Extract metadata from conversation profile
  const profile = conversation.profile || {};
  const insights = profile.insights || {};
  
  const location = profile.city || profile.location || insights.location?.city || insights.location?.area || '';
  const canton = profile.canton || '';
  const budget = {
    min: profile.budget_min || insights.budget?.min,
    max: profile.budget_max || insights.budget?.max
  };
  const area = {
    min: profile.area_min,
    max: profile.area_max
  };
  const requirements = {
    bedrooms: profile.nb_bedrooms || insights.requirements?.bedrooms,
    bathrooms: profile.nb_bathrooms,
    rooms: profile.nb_rooms,
    property_type: profile.property_type || insights.requirements?.property_type,
    furnished: profile.furnished || insights.requirements?.furnished,
    parking: profile.parking || insights.requirements?.parking,
    pets_allowed: profile.pets_allowed,
    balcony: profile.balcony,
    garden: profile.garden,
    elevator: profile.elevator
  };
  const messageCount = conversation.message_count || 0;
  const isPinned = conversation.is_pinned || false;
  const isArchived = conversation.is_archived || false;
  
  // Generate a fallback name based on insights if no name is provided
  const getDisplayName = () => {
    // Priority 1: Use actual name if it's meaningful
    if (conversation.name && 
        conversation.name !== 'New chat' && 
        conversation.name !== 'New search' &&
        conversation.name !== 'New conversation') {
      return conversation.name;
    }
    
    // Priority 2: Check for title in profile or messages
    if (conversation.title) {
      return conversation.title;
    }
    
    // Priority 3: Try to extract from first message
    if (conversation.messages && conversation.messages.length > 0) {
      const firstUserMessage = conversation.messages.find(m => m.sender === 'user');
      if (firstUserMessage && firstUserMessage.content) {
        const preview = firstUserMessage.content.substring(0, 50);
        return preview.length < firstUserMessage.content.length ? `${preview}...` : preview;
      }
    }
    
    // Priority 4: Create from profile data
    if (location || requirements.bedrooms || requirements.property_type) {
      const parts = [];
      if (location) parts.push(location);
      if (requirements.bedrooms) parts.push(`${requirements.bedrooms} BR`);
      if (requirements.property_type) parts.push(requirements.property_type);
      if (budget.min || budget.max) {
        if (budget.max) {
          parts.push(`CHF ${(budget.max / 1000).toFixed(0)}k`);
        } else if (budget.min) {
          parts.push(`CHF ${(budget.min / 1000).toFixed(0)}k+`);
        }
      }
      if (parts.length > 0) {
        return parts.join(' - ');
      }
    }
    
    // Priority 5: Use date-based name
    const date = new Date(conversation.created_at);
    return `Search from ${date.toLocaleDateString()}`;
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffMinutes < 60) return t('{{count}} min ago', { count: diffMinutes });
    if (diffHours < 24) return t('{{count}} hours ago', { count: diffHours });
    if (diffDays < 7) return t('{{count}} days ago', { count: diffDays });
    if (diffDays < 30) return t('{{count}} weeks ago', { count: Math.floor(diffDays / 7) });
    return date.toLocaleDateString();
  };

  // Format budget
  const formatBudget = (budget) => {
    if (!budget.min && !budget.max) return null;
    if (budget.min && budget.max) {
      return `CHF ${budget.min.toLocaleString()} - ${budget.max.toLocaleString()}`;
    }
    if (budget.max) return `Up to CHF ${budget.max.toLocaleString()}`;
    if (budget.min) return `From CHF ${budget.min.toLocaleString()}`;
    return null;
  };


  // Get requirement tags
  const getRequirementTags = () => {
    const tags = [];
    if (requirements.bedrooms) tags.push(`${requirements.bedrooms} BR`);
    if (requirements.bathrooms) tags.push(`${requirements.bathrooms} Bath`);
    if (requirements.rooms) tags.push(`${requirements.rooms} Rooms`);
    if (requirements.property_type) tags.push(requirements.property_type);
    if (requirements.furnished) tags.push(t('Furnished'));
    if (requirements.parking) tags.push(t('Parking'));
    if (requirements.pets_allowed) tags.push(t('Pets OK'));
    if (requirements.balcony) tags.push(t('Balcony'));
    if (requirements.garden) tags.push(t('Garden'));
    if (requirements.elevator) tags.push(t('Elevator'));
    return tags.slice(0, 5); // Limit to 5 tags
  };
  
  // Format area
  const formatArea = (area) => {
    if (!area.min && !area.max) return null;
    if (area.min && area.max) {
      return `${area.min}-${area.max} m²`;
    }
    if (area.max) return `Up to ${area.max} m²`;
    if (area.min) return `From ${area.min} m²`;
    return null;
  };

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (action) => (event) => {
    event.stopPropagation();
    handleMenuClose();
    action(conversation.id);
  };

  if (viewMode === 'list') {
    // List view layout
    return (
      <Card
        sx={{
          mb: 1,
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
          border: '1px solid',
          borderColor: isPinned ? theme.palette.primary.light : theme.palette.divider,
          backgroundColor: isArchived ? theme.palette.grey[50] : 'white',
          '&:hover': {
            boxShadow: 2,
            transform: 'translateX(4px)'
          }
        }}
        onClick={() => onSelect(conversation.id)}
      >
        <CardContent sx={{ py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>

            {/* Main content */}
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                {isPinned && <PinIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />}
                <Typography variant="h6" sx={{ fontSize: 16, fontWeight: 600 }}>
                  {getDisplayName()}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                {(location || canton) && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LocationIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {location}{canton && location ? `, ${canton}` : canton}
                    </Typography>
                  </Box>
                )}
                {formatBudget(budget) && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <MoneyIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">{formatBudget(budget)}</Typography>
                  </Box>
                )}
                {formatArea(area) && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <HomeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">{formatArea(area)}</Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {getRequirementTags().map((tag, index) => (
                    <Chip key={index} label={tag} size="small" variant="outlined" />
                  ))}
                </Box>
              </Box>
            </Box>

            {/* Metadata */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(conversation.updated_at || conversation.created_at)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ChatIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">{messageCount}</Typography>
              </Box>
              <IconButton size="small" onClick={handleMenuOpen}>
                <MoreVertIcon />
              </IconButton>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Grid view layout (default)
  return (
    <Card
      sx={{
        height: '100%',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        border: '1px solid',
        borderColor: isPinned ? theme.palette.primary.light : theme.palette.divider,
        backgroundColor: isArchived ? theme.palette.grey[50] : 'white',
        position: 'relative',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 3
        }
      }}
      onClick={() => onSelect(conversation.id)}
    >
      {/* Pin indicator */}
      {isPinned && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: theme.palette.primary.main,
            borderRadius: '50%',
            p: 0.5
          }}
        >
          <PinIcon sx={{ fontSize: 16, color: 'white' }} />
        </Box>
      )}

      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography
            variant="h6"
            sx={{
              fontSize: 16,
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
              mr: 1
            }}
          >
            {getDisplayName()}
          </Typography>
          <IconButton size="small" onClick={handleMenuOpen}>
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>


        {/* Location, Budget and Area */}
        <Stack spacing={1} sx={{ mb: 2 }}>
          {(location || canton) && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <LocationIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary" noWrap>
                {location}{canton && location ? `, ${canton}` : canton}
              </Typography>
            </Box>
          )}
          {formatBudget(budget) && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <MoneyIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary" noWrap>
                {formatBudget(budget)}
              </Typography>
            </Box>
          )}
          {formatArea(area) && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <HomeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary" noWrap>
                {formatArea(area)}
              </Typography>
            </Box>
          )}
        </Stack>

        {/* Tags */}
        {getRequirementTags().length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
            {getRequirementTags().map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                size="small"
                variant="outlined"
                sx={{ fontSize: 11 }}
              />
            ))}
          </Box>
        )}

        {/* Footer */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ScheduleIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {formatDate(conversation.updated_at || conversation.created_at)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ChatIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {messageCount}
            </Typography>
          </Box>
        </Box>
      </CardContent>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem onClick={handleAction(onRename)}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          {t('Rename')}
        </MenuItem>
        <MenuItem onClick={handleAction(onPin)}>
          <PinIcon fontSize="small" sx={{ mr: 1 }} />
          {isPinned ? t('Unpin') : t('Pin')}
        </MenuItem>
        <MenuItem onClick={handleAction(onDuplicate)}>
          <CopyIcon fontSize="small" sx={{ mr: 1 }} />
          {t('Duplicate')}
        </MenuItem>
        <MenuItem onClick={handleAction(onArchive)}>
          <ArchiveIcon fontSize="small" sx={{ mr: 1 }} />
          {isArchived ? t('Unarchive') : t('Archive')}
        </MenuItem>
        <MenuItem onClick={handleAction(onDelete)} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          {t('Delete')}
        </MenuItem>
      </Menu>
    </Card>
  );
};

export default ConversationCard;