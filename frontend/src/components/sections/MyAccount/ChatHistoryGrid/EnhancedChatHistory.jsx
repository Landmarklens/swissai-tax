import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  Button,
  Menu,
  MenuItem,
  Chip,
  Stack,
  Paper,
  Divider,
  Badge,
  Checkbox,
  FormControlLabel,
  Tooltip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  GridView as GridViewIcon,
  ViewList as ListViewIcon,
  Sort as SortIcon,
  Add as AddIcon,
  Archive as ArchiveIcon,
  Delete as DeleteIcon,
  Clear as ClearIcon,
  Download as DownloadIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxBlankIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import ConversationCard from './ConversationCard';
import { theme } from '../../../../theme/theme';
import {
  deleteConversation,
  archiveConversation,
  renameConversation,
  pinConversation,
  duplicateConversation,
  generateConversationName
} from '../../../../store/slices/conversationsSlice';

const EnhancedChatHistory = ({ conversations, loading, onNewChat, onChatSelect }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  
  // View and filter states
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [sortAnchorEl, setSortAnchorEl] = useState(null);
  const [selectedConversations, setSelectedConversations] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  // Removed attemptedNameGeneration - name generation now handled by backend
  
  // Filters
  const [filters, setFilters] = useState({
    dateRange: 'all', // all, today, week, month
    completionStatus: 'all', // all, complete, incomplete, inProgress
    showArchived: false,
    showPinned: true,
    locations: [],
    budgetRange: { min: null, max: null }
  });

  // Name generation is now handled by the backend when conversations are created
  // No need to generate names from the frontend anymore
  useEffect(() => {
    // This effect is disabled - names are generated on the backend
    // when the first meaningful message is sent
    // Keeping the effect for potential future use but disabled
  }, [conversations]);

  // Filter conversations
  const filteredConversations = useMemo(() => {
    if (!conversations) return [];
    
    let filtered = [...conversations];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(conv => {
        const name = (conv.name || '').toLowerCase();
        const location = (conv.profile?.insights?.location?.city || '').toLowerCase();
        const area = (conv.profile?.insights?.location?.area || '').toLowerCase();
        return name.includes(query) || location.includes(query) || area.includes(query);
      });
    }

    // Archive filter
    if (!filters.showArchived) {
      filtered = filtered.filter(conv => !conv.is_archived);
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          filterDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(conv => 
        new Date(conv.updated_at || conv.created_at) >= filterDate
      );
    }

    // Completion status filter
    if (filters.completionStatus !== 'all') {
      filtered = filtered.filter(conv => {
        const percentage = conv.profile?.completion_percentage || 0;
        switch (filters.completionStatus) {
          case 'complete':
            return percentage === 100;
          case 'incomplete':
            return percentage === 0;
          case 'inProgress':
            return percentage > 0 && percentage < 100;
          default:
            return true;
        }
      });
    }

    // Budget range filter
    if (filters.budgetRange.min || filters.budgetRange.max) {
      filtered = filtered.filter(conv => {
        const budget = conv.profile?.insights?.budget;
        if (!budget) return false;
        
        const min = budget.min || 0;
        const max = budget.max || Infinity;
        
        if (filters.budgetRange.min && min < filters.budgetRange.min) return false;
        if (filters.budgetRange.max && max > filters.budgetRange.max) return false;
        
        return true;
      });
    }

    return filtered;
  }, [conversations, searchQuery, filters]);

  // Sort conversations
  const sortedConversations = useMemo(() => {
    const sorted = [...filteredConversations];
    
    // Always put pinned items first
    sorted.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      
      switch (sortBy) {
        case 'recent':
          return new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at);
        case 'oldest':
          return new Date(a.updated_at || a.created_at) - new Date(b.updated_at || b.created_at);
        case 'completion':
          const aCompletion = a.profile?.completion_percentage || 0;
          const bCompletion = b.profile?.completion_percentage || 0;
          return bCompletion - aCompletion;
        case 'alphabetical':
          return (a.name || '').localeCompare(b.name || '');
        default:
          return 0;
      }
    });
    
    return sorted;
  }, [filteredConversations, sortBy]);

  // Group conversations by date
  const groupedConversations = useMemo(() => {
    const groups = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    sortedConversations.forEach(conv => {
      const date = new Date(conv.updated_at || conv.created_at);
      let groupKey;

      if (conv.is_pinned) {
        groupKey = 'pinned';
      } else if (date >= today) {
        groupKey = 'today';
      } else if (date >= yesterday) {
        groupKey = 'yesterday';
      } else if (date >= weekAgo) {
        groupKey = 'thisWeek';
      } else if (date >= monthAgo) {
        groupKey = 'thisMonth';
      } else {
        groupKey = 'older';
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(conv);
    });

    return groups;
  }, [sortedConversations]);

  // Handlers
  const handleDelete = async (id) => {
    if (window.confirm(t('Are you sure you want to delete this conversation?'))) {
      await dispatch(deleteConversation(id));
    }
  };

  const handleArchive = async (id) => {
    await dispatch(archiveConversation(id));
  };

  const handleRename = async (id) => {
    const newName = window.prompt(t('Enter new name:'));
    if (newName) {
      await dispatch(renameConversation({ id, name: newName }));
    }
  };

  const handlePin = async (id) => {
    await dispatch(pinConversation(id));
  };

  const handleDuplicate = async (id) => {
    await dispatch(duplicateConversation(id));
  };

  const handleBulkDelete = async () => {
    if (window.confirm(t('Delete {{count}} selected conversations?', { count: selectedConversations.length }))) {
      await Promise.all(selectedConversations.map(id => dispatch(deleteConversation(id))));
      setSelectedConversations([]);
      setIsSelectionMode(false);
    }
  };

  const handleBulkArchive = async () => {
    await Promise.all(selectedConversations.map(id => dispatch(archiveConversation(id))));
    setSelectedConversations([]);
    setIsSelectionMode(false);
  };

  const handleExport = () => {
    // Export conversations as JSON
    const dataToExport = selectedConversations.length > 0
      ? conversations.filter(c => selectedConversations.includes(c.id))
      : sortedConversations;
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversations_${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSelection = (id) => {
    setSelectedConversations(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedConversations.length === sortedConversations.length) {
      setSelectedConversations([]);
    } else {
      setSelectedConversations(sortedConversations.map(c => c.id));
    }
  };

  // Get group label
  const getGroupLabel = (key) => {
    switch (key) {
      case 'pinned': return t('Pinned');
      case 'today': return t('Today');
      case 'yesterday': return t('Yesterday');
      case 'thisWeek': return t('This Week');
      case 'thisMonth': return t('This Month');
      case 'older': return t('Older');
      default: return key;
    }
  };

  // Get active filter count
  const activeFilterCount = () => {
    let count = 0;
    if (filters.dateRange !== 'all') count++;
    if (filters.completionStatus !== 'all') count++;
    if (filters.showArchived) count++;
    if (filters.budgetRange.min || filters.budgetRange.max) count++;
    return count;
  };

  return (
    <Box>
      {/* Header with search and controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack spacing={2}>
          {/* Title and New Chat button */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" fontWeight={600}>
              {t('My Searches')}
              {sortedConversations.length > 0 && (
                <Typography component="span" variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
                  ({sortedConversations.length})
                </Typography>
              )}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onNewChat}
              sx={{ textTransform: 'none' }}
            >
              {t('New Search')}
            </Button>
          </Box>

          <Divider />

          {/* Search and filter bar */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {/* Search input */}
            <TextField
              placeholder={t('Search conversations...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              sx={{ flex: 1, minWidth: 250 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchQuery('')}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            {/* Filter button */}
            <Button
              variant="outlined"
              startIcon={
                <Badge badgeContent={activeFilterCount()} color="primary">
                  <FilterIcon />
                </Badge>
              }
              onClick={(e) => setFilterAnchorEl(e.currentTarget)}
            >
              {t('Filters')}
            </Button>

            {/* Sort button */}
            <Button
              variant="outlined"
              startIcon={<SortIcon />}
              onClick={(e) => setSortAnchorEl(e.currentTarget)}
            >
              {t('Sort')}
            </Button>

            {/* View toggle */}
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, value) => value && setViewMode(value)}
              size="small"
            >
              <ToggleButton value="grid">
                <Tooltip title={t('Grid view')}>
                  <GridViewIcon fontSize="small" />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="list">
                <Tooltip title={t('List view')}>
                  <ListViewIcon fontSize="small" />
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Selection mode toggle */}
            <Button
              variant="outlined"
              startIcon={isSelectionMode ? <CheckBoxIcon /> : <CheckBoxBlankIcon />}
              onClick={() => {
                setIsSelectionMode(!isSelectionMode);
                setSelectedConversations([]);
              }}
            >
              {t('Select')}
            </Button>
          </Box>

          {/* Bulk actions bar */}
          {isSelectionMode && selectedConversations.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Typography variant="body2" sx={{ mr: 2 }}>
                {t('{{count}} selected', { count: selectedConversations.length })}
              </Typography>
              <Button size="small" onClick={selectAll}>
                {selectedConversations.length === sortedConversations.length ? t('Deselect All') : t('Select All')}
              </Button>
              <Button size="small" startIcon={<ArchiveIcon />} onClick={handleBulkArchive}>
                {t('Archive')}
              </Button>
              <Button size="small" startIcon={<DeleteIcon />} onClick={handleBulkDelete} color="error">
                {t('Delete')}
              </Button>
              <Button size="small" startIcon={<DownloadIcon />} onClick={handleExport}>
                {t('Export')}
              </Button>
            </Box>
          )}

          {/* Active filters display */}
          {(searchQuery || activeFilterCount() > 0) && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {t('Active filters:')}
              </Typography>
              {searchQuery && (
                <Chip
                  label={`${t('Search')}: ${searchQuery}`}
                  size="small"
                  onDelete={() => setSearchQuery('')}
                />
              )}
              {filters.dateRange !== 'all' && (
                <Chip
                  label={`${t('Date')}: ${filters.dateRange}`}
                  size="small"
                  onDelete={() => setFilters(prev => ({ ...prev, dateRange: 'all' }))}
                />
              )}
              {filters.completionStatus !== 'all' && (
                <Chip
                  label={`${t('Status')}: ${filters.completionStatus}`}
                  size="small"
                  onDelete={() => setFilters(prev => ({ ...prev, completionStatus: 'all' }))}
                />
              )}
              {filters.showArchived && (
                <Chip
                  label={t('Show Archived')}
                  size="small"
                  onDelete={() => setFilters(prev => ({ ...prev, showArchived: false }))}
                />
              )}
              <Button
                size="small"
                onClick={() => {
                  setSearchQuery('');
                  setFilters({
                    dateRange: 'all',
                    completionStatus: 'all',
                    showArchived: false,
                    showPinned: true,
                    locations: [],
                    budgetRange: { min: null, max: null }
                  });
                }}
              >
                {t('Clear all')}
              </Button>
            </Box>
          )}
        </Stack>
      </Paper>

      {/* Loading state */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Empty state */}
      {!loading && sortedConversations.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          {searchQuery || activeFilterCount() > 0 ? (
            <>
              <Typography variant="h6" gutterBottom>
                {t('No conversations found')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('Try adjusting your search or filters')}
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="h6" gutterBottom>
                {t('No conversations yet')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {t('Start your property search to see your conversation history here')}
              </Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={onNewChat}>
                {t('Start New Search')}
              </Button>
            </>
          )}
        </Box>
      )}

      {/* Conversations grouped by date */}
      {!loading && sortedConversations.length > 0 && (
        <Stack spacing={3}>
          {Object.entries(groupedConversations).map(([groupKey, groupConversations]) => (
            <Box key={groupKey}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  color: 'text.secondary',
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                  letterSpacing: 0.5,
                  mb: 2
                }}
              >
                {getGroupLabel(groupKey)}
              </Typography>
              
              <Box
                sx={{
                  display: viewMode === 'grid' ? 'grid' : 'block',
                  gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(300px, 1fr))' : undefined,
                  gap: viewMode === 'grid' ? 2 : undefined
                }}
              >
                {groupConversations.map(conversation => (
                  <Box key={conversation.id} sx={{ position: 'relative' }}>
                    {isSelectionMode && (
                      <Checkbox
                        checked={selectedConversations.includes(conversation.id)}
                        onChange={() => toggleSelection(conversation.id)}
                        sx={{
                          position: 'absolute',
                          top: 8,
                          left: 8,
                          zIndex: 1,
                          backgroundColor: 'white',
                          borderRadius: 1
                        }}
                      />
                    )}
                    <ConversationCard
                      conversation={conversation}
                      onSelect={onChatSelect}
                      onDelete={handleDelete}
                      onArchive={handleArchive}
                      onRename={handleRename}
                      onPin={handlePin}
                      onDuplicate={handleDuplicate}
                      viewMode={viewMode}
                    />
                  </Box>
                ))}
              </Box>
            </Box>
          ))}
        </Stack>
      )}

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={() => setFilterAnchorEl(null)}
        PaperProps={{ sx: { width: 300, p: 2 } }}
      >
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
          {t('Filter Conversations')}
        </Typography>
        
        <Stack spacing={2}>
          {/* Date Range */}
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>{t('Date Range')}</Typography>
            <Stack spacing={1}>
              {['all', 'today', 'week', 'month'].map(range => (
                <FormControlLabel
                  key={range}
                  control={
                    <Checkbox
                      size="small"
                      checked={filters.dateRange === range}
                      onChange={() => setFilters(prev => ({ ...prev, dateRange: range }))}
                    />
                  }
                  label={t(range === 'all' ? 'All time' : range === 'today' ? 'Today' : range === 'week' ? 'This week' : 'This month')}
                />
              ))}
            </Stack>
          </Box>

          <Divider />

          {/* Completion Status */}
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>{t('Completion Status')}</Typography>
            <Stack spacing={1}>
              {['all', 'complete', 'inProgress', 'incomplete'].map(status => (
                <FormControlLabel
                  key={status}
                  control={
                    <Checkbox
                      size="small"
                      checked={filters.completionStatus === status}
                      onChange={() => setFilters(prev => ({ ...prev, completionStatus: status }))}
                    />
                  }
                  label={t(
                    status === 'all' ? 'All' :
                    status === 'complete' ? 'Complete' :
                    status === 'inProgress' ? 'In Progress' :
                    'Not Started'
                  )}
                />
              ))}
            </Stack>
          </Box>

          <Divider />

          {/* Other Options */}
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={filters.showArchived}
                onChange={(e) => setFilters(prev => ({ ...prev, showArchived: e.target.checked }))}
              />
            }
            label={t('Show Archived')}
          />
        </Stack>
      </Menu>

      {/* Sort Menu */}
      <Menu
        anchorEl={sortAnchorEl}
        open={Boolean(sortAnchorEl)}
        onClose={() => setSortAnchorEl(null)}
      >
        <MenuItem
          selected={sortBy === 'recent'}
          onClick={() => { setSortBy('recent'); setSortAnchorEl(null); }}
        >
          {t('Most Recent')}
        </MenuItem>
        <MenuItem
          selected={sortBy === 'oldest'}
          onClick={() => { setSortBy('oldest'); setSortAnchorEl(null); }}
        >
          {t('Oldest First')}
        </MenuItem>
        <MenuItem
          selected={sortBy === 'completion'}
          onClick={() => { setSortBy('completion'); setSortAnchorEl(null); }}
        >
          {t('Completion %')}
        </MenuItem>
        <MenuItem
          selected={sortBy === 'alphabetical'}
          onClick={() => { setSortBy('alphabetical'); setSortAnchorEl(null); }}
        >
          {t('Alphabetical')}
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default EnhancedChatHistory;