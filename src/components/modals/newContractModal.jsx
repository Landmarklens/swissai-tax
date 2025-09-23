import { Modal, Box, Typography, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';

const NewContractModal = ({ open, handleClose, handleConfirm }) => {
  const { t } = useTranslation();

  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        sx={{ '&>.MuiBox-root': { width: 800 } }}
        aria-labelledby="details-modal-title"
        aria-describedby="details-modal-description"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 560,
            minHeight: '200px',
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 0,
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '16px 40px',
              borderBottom: '1px solid rgba(0, 0, 0, 0.15)'
            }}
          >
            <Typography
              sx={{
                fontSize: '18px',
                fontWeight: '700',
                lineHeight: '26px',
                color: '#202020'
              }}
            >
              {t('New contract')}
            </Typography>
          </Box>
          <Box
            sx={{
              padding: '24px 40px',
              overflowY: 'auto',
              maxHeight: '600px',
              flexGrow: 1
            }}
          >
            <Box sx={{ display: 'grid', gap: '15px', color: '#202020' }}>
              <Typography sx={{ mb: 0, fontWeight: 700, fontSize: 18 }} variant="body2" paragraph>
                {t(
                  'This Residential Lease Agreement ("Agreement") is made and entered into on [Date] by and between:'
                )}
              </Typography>
              <Typography sx={{ mb: 0, fontWeight: 500, fontSize: 16 }} variant="body2" paragraph>
                <span style={{ fontWeight: 700, fontSize: 18 }}>Landlord:</span>
                <br />
                {t("Name: [Landlord's Name]")}
                <br />
                {t("Address: [Landlord's Address]")}
                <br />
                {t("Phone Number: [Landlord's Phone Number]")}
                <br />
                {t("Email: [Landlord's Email Address]")}
              </Typography>
              <Typography sx={{ mb: 0, fontWeight: 500, fontSize: 16 }} variant="body2" paragraph>
                <span style={{ fontWeight: 700, fontSize: 18 }}>Renter:</span>
                <br />
                {t("Name: [Renter's Name]")}
                <br />
                {t("Current Address: [Renter's Current Address]")}
                <br />
                {t("Phone Number: [Renter's Phone Number]")}
                <br />
                {t("Email: [Renter's Email Address]")}
              </Typography>
              <Typography sx={{ mb: 0, fontWeight: 500, fontSize: 16 }} variant="body2" paragraph>
                <span style={{ fontWeight: 700, fontSize: 18 }}>{t('Property Address:')}</span>
                <br />
                {t('[Full Address of the Rental Property]')}
              </Typography>
              <Typography sx={{ mb: 0, fontWeight: 500, fontSize: 16 }} variant="body2" paragraph>
                <span style={{ fontWeight: 700, fontSize: 18 }}>{t('1. Lease Term')}</span>
                <br />
                {t(
                  'The lease will commence on [Start Date] and end on [End Date], unless terminated in accordance with this Agreement.'
                )}
              </Typography>
              <Typography sx={{ mb: 0, fontWeight: 500, fontSize: 16 }} variant="body2" paragraph>
                <span style={{ fontWeight: 700, fontSize: 18 }}>{t('2. Rent')}</span>
                <br />
                {t(
                  'The total rent for the term of this lease will be [Total Rent Amount] payable in monthly installments of [Monthly Rent Amount]. Rent is due on the [Due Date] of each month.'
                )}
              </Typography>
              <Typography sx={{ mb: 0, fontWeight: 500, fontSize: 16 }} variant="body2" paragraph>
                <span style={{ fontWeight: 700, fontSize: 18 }}>{t('3. Security Deposit')}</span>
                <br />
                {t(
                  'The Renter shall pay a security deposit of [Security Deposit Amount] prior to moving in. This deposit will be refunded at the end of the lease term, subject to any deductions for damages or unpaid rent as allowed by law.'
                )}
              </Typography>
              <Typography sx={{ mb: 0, fontWeight: 500, fontSize: 16 }} variant="body2" paragraph>
                <span style={{ fontWeight: 700, fontSize: 18 }}>{t('4. Use of Property')}</span>
                <br />
                {t(
                  'The Renter agrees to use the property solely as a residential dwelling and to comply with all applicable laws and regulations.'
                )}
              </Typography>
              <Typography sx={{ mb: 0, fontWeight: 500, fontSize: 16 }} variant="body2" paragraph>
                <span style={{ fontWeight: 700, fontSize: 18 }}>
                  {t('5. Maintenance and Repairs')}
                </span>
                <br />
                {t(
                  'The Landlord will maintain the property in a habitable condition. The Renter is responsible for keeping the property clean and notifying the Landlord of any maintenance issues.'
                )}
              </Typography>
              <Typography sx={{ mb: 0, fontWeight: 500, fontSize: 16 }} variant="body2" paragraph>
                <span style={{ fontWeight: 700, fontSize: 18 }}>{t('6. Utilities')}</span>
                <br />
                {t(
                  'The Renter shall be responsible for the payment of all utilities, except for [Utilities Landlord Will Pay], which will be paid by the Landlord.'
                )}
              </Typography>
              <Typography sx={{ mb: 0, fontWeight: 500, fontSize: 16 }} variant="body2" paragraph>
                <span style={{ fontWeight: 700, fontSize: 18 }}>{t('7. Pets')}</span>
                <br />
                {t(
                  '[Select: Pets are allowed with a pet deposit of [Pet Deposit Amount] or No pets are allowed on the property.]'
                )}
              </Typography>
              <Typography sx={{ mb: 0, fontWeight: 500, fontSize: 16 }} variant="body2" paragraph>
                <span style={{ fontWeight: 700, fontSize: 18 }}>{t('8. Termination')}</span>
                <br />
                {t(
                  'Either party may terminate this Agreement according to local laws regarding eviction and lease termination. Written notice must be provided [Number of Days] in advance.'
                )}
              </Typography>
              <Typography sx={{ mb: 0, fontWeight: 500, fontSize: 16 }} variant="body2" paragraph>
                <span style={{ fontWeight: 700, fontSize: 18 }}>{t('9. Governing Law')}</span>
                <br />
                {t(
                  'This Agreement shall be governed by and construed in accordance with the laws of the state of [State].'
                )}
              </Typography>
              <Typography sx={{ mb: 0, fontWeight: 500, fontSize: 16 }} variant="body2" paragraph>
                <span style={{ fontWeight: 700, fontSize: 18 }}>{t('10. Signatures')}</span>
                <br />
                {t('By signing below, both parties agree to the terms outlined in this Agreement.')}
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between'
                }}
              >
                <Typography sx={{ mb: 0, fontWeight: 500, fontSize: 16 }} variant="body2" paragraph>
                  {t('Landlord Signature')}
                  <br />[{t('Date')}]
                </Typography>
                <Typography sx={{ mb: 0, fontWeight: 500, fontSize: 16 }} variant="body2" paragraph>
                  _____________________
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between'
                }}
              >
                <Typography sx={{ mb: 0, fontWeight: 500, fontSize: 16 }} variant="body2" paragraph>
                  {t('Renter Signature')}
                  <br />[{t('Date')}]
                </Typography>
                <Typography sx={{ mb: 0, fontWeight: 500, fontSize: 16 }} variant="body2" paragraph>
                  _____________________
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '16px 40px',
              borderTop: '1px solid rgba(0, 0, 0, 0.15)'
            }}
          >
            <Button
              variant="contained"
              onClick={handleClose}
              sx={{
                border: 'none',
                boxShadow: 'none',
                background: 'none',
                color: '#002BB7C5',
                fontWeight: 400,
                fontSize: '18px',
                '&:hover': {
                  backgroundColor: 'transparent',
                  boxShadow: 'none'
                }
              }}
            >
              {t('Cancel')}
            </Button>
            <Button variant="contained" color="primary" onClick={handleConfirm}>
              {t('Sign')}
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default NewContractModal;
