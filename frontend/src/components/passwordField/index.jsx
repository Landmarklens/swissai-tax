import { styled } from '@mui/system';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { TextField } from '@mui/material';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const InputField = styled(TextField)({
  marginBottom: '20px',
  '.MuiFormHelperText-root': {
    marginLeft: '8px'
  }
});

export const PasswordField = (props) => {
  const { t } = useTranslation();

  const [showPassword, setShowPassword] = React.useState(false);

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  return (
    <InputField
      size="small"
      fullWidth
      name="password"
      type={showPassword ? 'text' : 'password'}
      placeholder={t('Enter your Password')}
      variant="outlined"
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              aria-label="toggle password visibility"
              onClick={handleClickShowPassword}
              onMouseDown={handleMouseDownPassword}
              edge="end">
              {showPassword ? <Visibility /> : <VisibilityOff />}
            </IconButton>
          </InputAdornment>
        )
      }}
      {...props}
    />
  );
};
