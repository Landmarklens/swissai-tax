import { Box, Button, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DocumentsTable from '../../aiCard/DocumentsTable';
import AddLeaseModal from '../../../modals/addLeaseModal';
import { useEffect, useState } from 'react';
import NewContractModal from '../../../modals/newContractModal';
import SignContractModal from '../../../modals/signContractModal';
import NewContractSuccess from '../../../modals/newContractSuccess';
import { useSelector, useDispatch } from 'react-redux';
import {
  createDocument,
  getDocuments,
  selectDocuments
} from '../../../../store/slices/documentsSlice';
import { fetchProperties } from '../../../../store/slices/propertiesSlice';
import { Files } from '../../../../assets/svg/Files';
import { useTranslation } from 'react-i18next';

const Document = () => {
  const { t } = useTranslation();
  const { documents } = useSelector(selectDocuments);
  const [addLeaseModal, setAddLeaseModal] = useState(false);
  const [newContractModal, setNewContractModal] = useState(false);
  const [signContractModal, setSignContractModal] = useState(false);
  const [newContractSuccessModal, setNewContractSuccessModal] = useState(false);
  const [newDocumentData, setNewDocumentData] = useState({
    documentType: 'termination',
    propertyId: '',
    fullName: '',
    legalName: '',
    signature: ''
  });
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getDocuments());
    dispatch(fetchProperties());
  }, [dispatch]);

  const addNewLease = () => {
    if (newDocumentData.propertyId && newDocumentData.fullName) {
      setAddLeaseModal(false);
      setNewContractModal(true);
    }
  };

  const submitDocument = () => {
    if (newDocumentData.legalName && newDocumentData.signature) {
      const body = {
        property_id: newDocumentData.propertyId,
        document_type: newDocumentData.documentType,
        status: 'in_progress',
        name: newDocumentData.fullName,
        renter_full_name: newDocumentData.fullName,
        legal_name: newDocumentData.legalName,
        signature: newDocumentData.signature,
        tenant_name: newDocumentData.fullName
      };
      dispatch(createDocument(body)).then(() => {
        dispatch(getDocuments());
        setSignContractModal(false);
        setNewContractSuccessModal(true);
      });
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: '32px',
        height: 'calc(100% - 48px)',
        px: 4,
        py: 3,
        backgroundColor: '#F7F9FF'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Typography sx={{ fontSize: '24px', fontWeight: '500' }} variant="h4">
          {t('Document Management System')}
        </Typography>
        <Button
          sx={{ width: '150px', height: '37px', boxShadow: 'none' }}
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setAddLeaseModal(true)}
        >
          {t('Add Lease')}
        </Button>
      </Box>
      <Box sx={{ height: '100%' }}>
        {documents.data ? (
          <DocumentsTable data={documents.data} />
        ) : (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              height: '100%',
              gap: '4px'
            }}
          >
            <Box
              sx={{
                width: '48px',
                height: '48px',
                borderRadius: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#EDF2FE'
              }}
            >
              <Files />
            </Box>
            <Typography
              sx={{ fontSize: 14, color: '#202020', fontWeight: 500, mb: 0 }}
              variant="body2"
            >
              {t('No documents')}
            </Typography>
            <Typography
              sx={{ fontSize: 12, color: '#646464', fontWeight: 400, mb: 0 }}
              variant="body2"
            >
              {t('All rental contracts will be displayed here')}
            </Typography>
          </Box>
        )}
      </Box>
      <AddLeaseModal
        open={addLeaseModal}
        handleClose={() => setAddLeaseModal(false)}
        data={newDocumentData}
        setData={setNewDocumentData}
        openNewContractModal={addNewLease}
      />
      <NewContractModal
        open={newContractModal}
        handleClose={() => setNewContractModal(false)}
        handleConfirm={() => {
          setNewContractModal(false);
          setSignContractModal(true);
        }}
      />
      <SignContractModal
        open={signContractModal}
        data={newDocumentData}
        setData={setNewDocumentData}
        handleClose={() => setSignContractModal(false)}
        handleConfirm={submitDocument}
      />
      <NewContractSuccess
        open={newContractSuccessModal}
        handleClose={() => setNewContractSuccessModal(false)}
      />
    </Box>
  );
};

export default Document;
