import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Divider,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  Folder as FolderIcon,
  CloudDownload as CloudDownloadIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const DocumentManagementSection = () => {
  const { t } = useTranslation();
  const [storageUsed] = useState(125); // MB
  const [storageLimit] = useState(500); // MB

  const handleDownloadAll = () => {
    // TODO: Implement download all logic
  };

  const handleDeleteOld = () => {
    // TODO: Implement delete old documents logic
  };

  const storagePercentage = (storageUsed / storageLimit) * 100;

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={3}>
          <FolderIcon sx={{ color: '#DC0018' }} />
          <Typography variant="h6" fontWeight={600}>
            {t('Document Management')}
          </Typography>
        </Box>

        {/* Storage Usage */}
        <Box mb={3}>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2" color="text.secondary">
              {t('Storage Used')}
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {storageUsed} MB / {storageLimit} MB
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={storagePercentage}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: '#E0E0E0',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                backgroundColor: storagePercentage > 80 ? '#DC0018' : '#4CAF50'
              }
            }}
          />
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Download All Documents */}
        <Box mb={3}>
          <Typography variant="subtitle1" fontWeight={600} mb={1}>
            {t('Download All Documents')}
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {t('Download all your uploaded documents and tax filings as a ZIP archive')}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<CloudDownloadIcon />}
            onClick={handleDownloadAll}
            fullWidth
          >
            {t('Download All Documents')}
          </Button>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Delete Old Documents */}
        <Box>
          <Typography variant="subtitle1" fontWeight={600} mb={1}>
            {t('Delete Old Documents')}
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {t('Delete documents older than 7 years (as per Swiss retention requirements)')}
          </Typography>
          <Alert severity="warning" sx={{ mb: 2 }}>
            {t('This action cannot be undone. Documents will be permanently deleted.')}
          </Alert>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDeleteOld}
            fullWidth
          >
            {t('Delete Old Documents')}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default DocumentManagementSection;
