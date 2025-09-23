import React, { useRef, useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Icons
import DrawIcon from '@mui/icons-material/Draw';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ClearIcon from '@mui/icons-material/Clear';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import CheckIcon from '@mui/icons-material/Check';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import FormatSizeIcon from '@mui/icons-material/FormatSize';

const Canvas = styled('canvas')(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(1),
  cursor: 'crosshair',
  touchAction: 'none',
  backgroundColor: 'white',
}));

const SignaturePreview = styled(Box)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(1),
  padding: theme.spacing(2),
  backgroundColor: theme.palette.grey[50],
  minHeight: 100,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const SignaturePad = ({ onSave, onCancel, signatureType = 'draw' }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mode, setMode] = useState(signatureType);
  const [typedSignature, setTypedSignature] = useState('');
  const [selectedFont, setSelectedFont] = useState('Dancing Script');
  const [fontSize, setFontSize] = useState(48);
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(0);

  const fonts = [
    'Dancing Script',
    'Great Vibes',
    'Pacifico',
    'Satisfy',
    'Allura',
    'Sacramento',
    'Kaushan Script',
    'Permanent Marker'
  ];

  useEffect(() => {
    if (mode === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      // Set canvas size
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      
      // Set initial styles
      context.strokeStyle = strokeColor;
      context.lineWidth = strokeWidth;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      
      // Clear canvas
      context.fillStyle = 'white';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Save initial state
      saveToHistory();
    }
  }, [mode, strokeColor, strokeWidth]);

  // Load Google Fonts
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&family=Great+Vibes&family=Pacifico&family=Satisfy&family=Allura&family=Sacramento&family=Kaushan+Script&family=Permanent+Marker&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const startDrawing = (e) => {
    if (mode !== 'draw') return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const context = canvas.getContext('2d');
    
    setIsDrawing(true);
    
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    
    context.beginPath();
    context.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing || mode !== 'draw') return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const context = canvas.getContext('2d');
    
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    
    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveToHistory();
    }
  };

  const saveToHistory = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL();
    
    setHistory(prev => {
      const newHistory = prev.slice(0, historyStep + 1);
      return [...newHistory, dataUrl];
    });
    setHistoryStep(prev => prev + 1);
  };

  const undo = () => {
    if (historyStep > 0) {
      const newStep = historyStep - 1;
      setHistoryStep(newStep);
      
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(img, 0, 0);
      };
      img.src = history[newStep];
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1) {
      const newStep = historyStep + 1;
      setHistoryStep(newStep);
      
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(img, 0, 0);
      };
      img.src = history[newStep];
    }
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    saveToHistory();
  };

  const handleSave = () => {
    let signatureData = null;
    
    if (mode === 'draw' && canvasRef.current) {
      signatureData = {
        type: 'draw',
        data: canvasRef.current.toDataURL('image/png'),
      };
    } else if (mode === 'type') {
      signatureData = {
        type: 'type',
        text: typedSignature,
        font: selectedFont,
        fontSize: fontSize,
      };
    } else if (mode === 'upload') {
      // Handle upload
      signatureData = {
        type: 'upload',
        data: null, // Will be set when file is uploaded
      };
    }
    
    if (onSave) {
      onSave(signatureData);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        // Handle uploaded image
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          const context = canvas.getContext('2d');
          
          // Clear canvas
          context.fillStyle = 'white';
          context.fillRect(0, 0, canvas.width, canvas.height);
          
          // Draw image scaled to fit
          const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
          const x = (canvas.width - img.width * scale) / 2;
          const y = (canvas.height - img.height * scale) / 2;
          
          context.drawImage(img, x, y, img.width * scale, img.height * scale);
          saveToHistory();
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Box>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Add Your Signature</Typography>
          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={(e, newMode) => newMode && setMode(newMode)}
            size="small"
          >
            <ToggleButton value="draw">
              <DrawIcon sx={{ mr: 1 }} />
              Draw
            </ToggleButton>
            <ToggleButton value="type">
              <TextFieldsIcon sx={{ mr: 1 }} />
              Type
            </ToggleButton>
            <ToggleButton value="upload">
              <UploadFileIcon sx={{ mr: 1 }} />
              Upload
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {mode === 'draw' && (
          <Box>
            {/* Drawing Tools */}
            <Paper sx={{ p: 2, mb: 2 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <IconButton onClick={undo} disabled={historyStep <= 0}>
                  <UndoIcon />
                </IconButton>
                <IconButton onClick={redo} disabled={historyStep >= history.length - 1}>
                  <RedoIcon />
                </IconButton>
                <IconButton onClick={clearCanvas}>
                  <ClearIcon />
                </IconButton>
                
                <Divider orientation="vertical" flexItem />
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ColorLensIcon fontSize="small" />
                  <input
                    type="color"
                    value={strokeColor}
                    onChange={(e) => setStrokeColor(e.target.value)}
                    style={{ width: 40, height: 30, border: 'none', borderRadius: 4 }}
                  />
                </Box>
                
                <Box sx={{ width: 150 }}>
                  <Typography variant="caption">Stroke Width</Typography>
                  <Slider
                    value={strokeWidth}
                    onChange={(e, value) => setStrokeWidth(value)}
                    min={1}
                    max={10}
                    size="small"
                  />
                </Box>
              </Stack>
            </Paper>
            
            {/* Canvas */}
            <Canvas
              ref={canvasRef}
              width={600}
              height={200}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Draw your signature above using your mouse or touchpad
            </Typography>
          </Box>
        )}
        
        {mode === 'type' && (
          <Box>
            <TextField
              fullWidth
              label="Type your name"
              value={typedSignature}
              onChange={(e) => setTypedSignature(e.target.value)}
              sx={{ mb: 2 }}
            />
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Font Style</InputLabel>
              <Select
                value={selectedFont}
                onChange={(e) => setSelectedFont(e.target.value)}
                label="Font Style"
              >
                {fonts.map(font => (
                  <MenuItem key={font} value={font}>
                    <span style={{ fontFamily: font }}>{font}</span>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" gutterBottom>Font Size</Typography>
              <Slider
                value={fontSize}
                onChange={(e, value) => setFontSize(value)}
                min={24}
                max={72}
                valueLabelDisplay="auto"
              />
            </Box>
            
            <SignaturePreview>
              <Typography
                style={{
                  fontFamily: selectedFont,
                  fontSize: `${fontSize}px`,
                  color: strokeColor,
                }}
              >
                {typedSignature || 'Your signature will appear here'}
              </Typography>
            </SignaturePreview>
          </Box>
        )}
        
        {mode === 'upload' && (
          <Box>
            <Paper
              sx={{
                p: 4,
                textAlign: 'center',
                bgcolor: 'grey.50',
                border: '2px dashed',
                borderColor: 'divider',
                cursor: 'pointer',
              }}
              component="label"
            >
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleFileUpload}
              />
              <UploadFileIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Click to upload signature image
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Supported formats: PNG, JPG, GIF (Max 5MB)
              </Typography>
            </Paper>
            
            <Canvas
              ref={canvasRef}
              width={600}
              height={200}
              style={{ marginTop: 16, display: 'none' }}
            />
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          startIcon={<CheckIcon />}
          disabled={mode === 'type' && !typedSignature}
        >
          Apply Signature
        </Button>
      </DialogActions>
    </Box>
  );
};

export default SignaturePad;