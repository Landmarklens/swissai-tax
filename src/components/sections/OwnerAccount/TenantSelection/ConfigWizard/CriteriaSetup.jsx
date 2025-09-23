import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Chip,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const criteriaTemplates = {
  family: {
    hard: [
      { field: 'min_income', operator: '>=', value: '3x_rent', label: 'Minimum income 3x rent' },
      { field: 'no_pets', operator: '==', value: 'false', label: 'Pets allowed' },
      { field: 'max_occupants', operator: '<=', value: '4', label: 'Maximum 4 occupants' }
    ],
    soft: [
      { field: 'employment_type', operator: '==', value: 'permanent', label: 'Permanent employment', weight: 20 },
      { field: 'has_children', operator: '==', value: 'true', label: 'Has children', weight: 15 },
      { field: 'local_residence', operator: '==', value: 'true', label: 'Local residence', weight: 10 }
    ]
  },
  professional: {
    hard: [
      { field: 'min_income', operator: '>=', value: '3x_rent', label: 'Minimum income 3x rent' },
      { field: 'credit_score', operator: '>=', value: '650', label: 'Credit score >= 650' },
      { field: 'employment_duration', operator: '>=', value: '6_months', label: 'Employment >= 6 months' }
    ],
    soft: [
      { field: 'employment_type', operator: '==', value: 'permanent', label: 'Permanent employment', weight: 25 },
      { field: 'professional_references', operator: '>=', value: '2', label: 'Professional references', weight: 20 },
      { field: 'no_smoker', operator: '==', value: 'true', label: 'Non-smoker', weight: 10 }
    ]
  },
  student: {
    hard: [
      { field: 'student_status', operator: '==', value: 'enrolled', label: 'Enrolled student' },
      { field: 'guarantor', operator: '==', value: 'true', label: 'Has guarantor' }
    ],
    soft: [
      { field: 'university_distance', operator: '<=', value: '30min', label: 'Close to university', weight: 20 },
      { field: 'previous_rental', operator: '==', value: 'true', label: 'Previous rental experience', weight: 15 }
    ]
  }
};

const CriteriaSetup = ({ hardCriteria, softCriteria, onHardCriteriaChange, onSoftCriteriaChange, errors }) => {
  const { t } = useTranslation();
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [newHardCriterion, setNewHardCriterion] = useState({ field: '', operator: '==', value: '', label: '' });
  const [newSoftCriterion, setNewSoftCriterion] = useState({ field: '', operator: '==', value: '', label: '', weight: 10 });

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    if (criteriaTemplates[template]) {
      onHardCriteriaChange(criteriaTemplates[template].hard);
      onSoftCriteriaChange(criteriaTemplates[template].soft);
    }
  };

  const handleAddHardCriterion = () => {
    if (newHardCriterion.field && newHardCriterion.value && newHardCriterion.label) {
      onHardCriteriaChange([...hardCriteria, { ...newHardCriterion, id: Date.now() }]);
      setNewHardCriterion({ field: '', operator: '==', value: '', label: '' });
    }
  };

  const handleAddSoftCriterion = () => {
    if (newSoftCriterion.field && newSoftCriterion.value && newSoftCriterion.label) {
      onSoftCriteriaChange([...softCriteria, { ...newSoftCriterion, id: Date.now() }]);
      setNewSoftCriterion({ field: '', operator: '==', value: '', label: '', weight: 10 });
    }
  };

  const handleRemoveHardCriterion = (index) => {
    onHardCriteriaChange(hardCriteria.filter((_, i) => i !== index));
  };

  const handleRemoveSoftCriterion = (index) => {
    onSoftCriteriaChange(softCriteria.filter((_, i) => i !== index));
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    const isHard = draggableId.startsWith('hard');
    
    if (isHard) {
      const items = Array.from(hardCriteria);
      const [reorderedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, reorderedItem);
      onHardCriteriaChange(items);
    } else {
      const items = Array.from(softCriteria);
      const [reorderedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, reorderedItem);
      onSoftCriteriaChange(items);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t('Selection Criteria')}
      </Typography>

      {errors.criteria && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errors.criteria}
        </Alert>
      )}

      <Box mb={3}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {t('Start with a template or create custom criteria')}
        </Typography>
        <Box display="flex" gap={1}>
          <Chip
            label={t('Family Housing')}
            onClick={() => handleTemplateSelect('family')}
            variant={selectedTemplate === 'family' ? 'filled' : 'outlined'}
            color={selectedTemplate === 'family' ? 'primary' : 'default'}
          />
          <Chip
            label={t('Professional')}
            onClick={() => handleTemplateSelect('professional')}
            variant={selectedTemplate === 'professional' ? 'filled' : 'outlined'}
            color={selectedTemplate === 'professional' ? 'primary' : 'default'}
          />
          <Chip
            label={t('Student Housing')}
            onClick={() => handleTemplateSelect('student')}
            variant={selectedTemplate === 'student' ? 'filled' : 'outlined'}
            color={selectedTemplate === 'student' ? 'primary' : 'default'}
          />
        </Box>
      </Box>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <WarningIcon sx={{ mr: 1, color: 'error.main' }} />
                <Typography variant="subtitle1" fontWeight="bold">
                  {t('Hard Criteria (Must Have)')}
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t('Applications not meeting these will be automatically rejected')}
              </Typography>

              <Droppable droppableId="hard-criteria">
                {(provided) => (
                  <List {...provided.droppableProps} ref={provided.innerRef}>
                    {hardCriteria.map((criterion, index) => (
                      <Draggable key={`hard-${index}`} draggableId={`hard-${index}`} index={index}>
                        {(provided) => (
                          <ListItem
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            sx={{ bgcolor: 'background.paper', mb: 1, borderRadius: 1 }}
                          >
                            <Box {...provided.dragHandleProps} sx={{ mr: 1 }}>
                              <DragIcon />
                            </Box>
                            <ListItemText
                              primary={criterion.label}
                              secondary={`${criterion.field} ${criterion.operator} ${criterion.value}`}
                            />
                            <ListItemSecondaryAction>
                              <IconButton onClick={() => handleRemoveHardCriterion(index)} size="small">
                                <DeleteIcon />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </List>
                )}
              </Droppable>

              <Divider sx={{ my: 2 }} />

              <Box>
                <Grid container spacing={1}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label={t('Description')}
                      value={newHardCriterion.label}
                      onChange={(e) => setNewHardCriterion({ ...newHardCriterion, label: e.target.value })}
                      placeholder={t('e.g., Minimum income requirement')}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label={t('Field')}
                      value={newHardCriterion.field}
                      onChange={(e) => setNewHardCriterion({ ...newHardCriterion, field: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>{t('Operator')}</InputLabel>
                      <Select
                        value={newHardCriterion.operator}
                        onChange={(e) => setNewHardCriterion({ ...newHardCriterion, operator: e.target.value })}
                        label={t('Operator')}
                      >
                        <MenuItem value="==">==</MenuItem>
                        <MenuItem value="!=">!=</MenuItem>
                        <MenuItem value=">=">&gt;=</MenuItem>
                        <MenuItem value="<=">&lt;=</MenuItem>
                        <MenuItem value=">">&gt;</MenuItem>
                        <MenuItem value="<">&lt;</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label={t('Value')}
                      value={newHardCriterion.value}
                      onChange={(e) => setNewHardCriterion({ ...newHardCriterion, value: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={handleAddHardCriterion}
                      startIcon={<AddIcon />}
                    >
                      {t('Add')}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <CheckIcon sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="subtitle1" fontWeight="bold">
                  {t('Soft Criteria (Nice to Have)')}
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t('These contribute to the overall score')}
              </Typography>

              <Droppable droppableId="soft-criteria">
                {(provided) => (
                  <List {...provided.droppableProps} ref={provided.innerRef}>
                    {softCriteria.map((criterion, index) => (
                      <Draggable key={`soft-${index}`} draggableId={`soft-${index}`} index={index}>
                        {(provided) => (
                          <ListItem
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            sx={{ bgcolor: 'background.paper', mb: 1, borderRadius: 1 }}
                          >
                            <Box {...provided.dragHandleProps} sx={{ mr: 1 }}>
                              <DragIcon />
                            </Box>
                            <ListItemText
                              primary={criterion.label}
                              secondary={`${criterion.field} ${criterion.operator} ${criterion.value} (Weight: ${criterion.weight}%)`}
                            />
                            <ListItemSecondaryAction>
                              <IconButton onClick={() => handleRemoveSoftCriterion(index)} size="small">
                                <DeleteIcon />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </List>
                )}
              </Droppable>

              <Divider sx={{ my: 2 }} />

              <Box>
                <Grid container spacing={1}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label={t('Description')}
                      value={newSoftCriterion.label}
                      onChange={(e) => setNewSoftCriterion({ ...newSoftCriterion, label: e.target.value })}
                      placeholder={t('e.g., Permanent employment')}
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label={t('Field')}
                      value={newSoftCriterion.field}
                      onChange={(e) => setNewSoftCriterion({ ...newSoftCriterion, field: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>{t('Op')}</InputLabel>
                      <Select
                        value={newSoftCriterion.operator}
                        onChange={(e) => setNewSoftCriterion({ ...newSoftCriterion, operator: e.target.value })}
                        label={t('Op')}
                      >
                        <MenuItem value="==">==</MenuItem>
                        <MenuItem value="!=">!=</MenuItem>
                        <MenuItem value=">=">&gt;=</MenuItem>
                        <MenuItem value="<=">&lt;=</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label={t('Value')}
                      value={newSoftCriterion.value}
                      onChange={(e) => setNewSoftCriterion({ ...newSoftCriterion, value: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label={t('Weight %')}
                      value={newSoftCriterion.weight}
                      onChange={(e) => setNewSoftCriterion({ ...newSoftCriterion, weight: parseInt(e.target.value) || 0 })}
                      inputProps={{ min: 0, max: 100 }}
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={handleAddSoftCriterion}
                      startIcon={<AddIcon />}
                    >
                      {t('Add')}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </DragDropContext>
    </Box>
  );
};

export default CriteriaSetup;