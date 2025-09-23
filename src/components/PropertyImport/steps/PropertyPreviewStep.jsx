import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Grid,
  Button,
  Chip,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions
} from '@mui/material';
import {
  Edit as EditIcon,
  LocationOn as LocationIcon,
  Home as HomeIcon,
  Square as SquareIcon,
  CalendarMonth as CalendarIcon,
  AttachMoney as MoneyIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

const PropertyPreviewStep = ({ propertyData, onEdit, importMethod }) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState(propertyData);

  const handleEditSave = () => {
    onEdit(editData);
    setEditDialogOpen(false);
  };

  const formatDate = (date) => {
    if (!date) return 'Immediately';
    try {
      return format(new Date(date), 'dd MMM yyyy');
    } catch {
      return 'Immediately';
    }
  };

  const PropertyDetail = ({ icon, label, value }) => (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
      <Box sx={{ color: 'text.secondary', mt: 0.5 }}>{icon}</Box>
      <Box>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body1" fontWeight="medium">
          {value || '-'}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Review Your Property
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Please review the property details before proceeding to email setup
      </Typography>

      <Card sx={{ mb: 3 }}>
        {propertyData.images && propertyData.images[0] && (
          <CardMedia
            component="img"
            height="300"
            image={propertyData.images[0]}
            alt={propertyData.title || propertyData.address}
            sx={{ objectFit: 'cover' }}
          />
        )}
        
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h5" gutterBottom>
                {propertyData.title || propertyData.address}
              </Typography>
              {propertyData.title && propertyData.address && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {propertyData.address}
                </Typography>
              )}
            </Box>
            <IconButton onClick={() => setEditDialogOpen(true)} color="primary">
              <EditIcon />
            </IconButton>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <PropertyDetail
                icon={<LocationIcon fontSize="small" />}
                label="Address"
                value={propertyData.address}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <PropertyDetail
                icon={<MoneyIcon fontSize="small" />}
                label="Monthly Rent"
                value={propertyData.price_chf ? `CHF ${propertyData.price_chf.toLocaleString()}` : null}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <PropertyDetail
                icon={<HomeIcon fontSize="small" />}
                label="Rooms"
                value={propertyData.bedrooms ? `${propertyData.bedrooms} rooms` : null}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <PropertyDetail
                icon={<SquareIcon fontSize="small" />}
                label="Size"
                value={propertyData.square_meters ? `${propertyData.square_meters} m²` : null}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <PropertyDetail
                icon={<CalendarIcon fontSize="small" />}
                label="Available From"
                value={formatDate(propertyData.available_from)}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Import Method
                </Typography>
                <Chip
                  label={importMethod === 'url' ? 'Imported from URL' : 'Manual Entry'}
                  size="small"
                  color={importMethod === 'url' ? 'primary' : 'secondary'}
                  sx={{ mt: 0.5 }}
                />
              </Box>
            </Grid>
          </Grid>

          {propertyData.description && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Description
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {propertyData.description}
              </Typography>
            </Box>
          )}

          {propertyData.url && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Source URL
              </Typography>
              <Typography 
                variant="body2" 
                color="primary"
                component="a"
                href={propertyData.url}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ 
                  wordBreak: 'break-all',
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                {propertyData.url}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckIcon />
          <Box>
            <Typography variant="subtitle2">
              Property Details Confirmed
            </Typography>
            <Typography variant="body2">
              Next, we'll set up email forwarding to automatically receive tenant applications
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Property Details</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Property Title"
                value={editData.title || ''}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={editData.address || ''}
                onChange={(e) => setEditData({ ...editData, address: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Monthly Rent (CHF)"
                value={editData.price_chf || ''}
                onChange={(e) => setEditData({ ...editData, price_chf: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Number of Rooms"
                value={editData.bedrooms || ''}
                onChange={(e) => setEditData({ ...editData, bedrooms: parseFloat(e.target.value) })}
                inputProps={{ step: 0.5 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Size (m²)"
                value={editData.square_meters || ''}
                onChange={(e) => setEditData({ ...editData, square_meters: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={editData.description || ''}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained">Save Changes</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PropertyPreviewStep;