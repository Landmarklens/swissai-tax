import React, { useEffect, useRef, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

const LOADING_MESSAGES = [
  'We’re crunching 40+ data points—rent, commute, vibe, even noise levels—to surface homes that truly fit. Give us about 10‑15 minutes and we’ll ping your inbox the second your shortlist is ready.',
  'Our AI is touring every Swiss portal right now, filtering 120 000 listings in real‑time. That takes a moment—but saves you hours. We’ll send you an e‑mail once the magic is done.',
  'Grab a coffee! While you relax, HomeAI is cross‑checking tax zones, transit times and landlord ratings. In ~15 min we’ll e‑mail you a curated top 10 and bring you right back here.',
  'We’re on an apartment treasure hunt, map and magnifying glass in hand. X‑marks‑the‑spot results will land in your inbox in about 10 minutes—click the link to jump straight back.',
  'Great homes aren’t found in a rush. We’re taking these 15 minutes to weed out mismatches and spotlight winners. We’ll let you know by e‑mail the moment the list is ready—no need to keep this tab open.'
];

const LoadingModal = ({ open }) => {
  const [loadingIndex, setLoadingIndex] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (open) {
      intervalRef.current = setInterval(() => {
        setLoadingIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 15000);
    }
    return () => clearInterval(intervalRef.current);
  }, [open]);

  useEffect(() => {
    if (!open) setLoadingIndex(0);
  }, [open]);

  return (
    <Dialog open={open} maxWidth="xs" fullWidth>
      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          py: 6,
          textAlign: 'center'
        }}>
        <CircularProgress sx={{ mb: 3 }} />
        <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 16 }}>
          {LOADING_MESSAGES[loadingIndex]}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoadingModal;
