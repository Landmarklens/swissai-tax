import React from 'react';
import { useField } from 'formik';
import { FormGroup, FormControl, FormLabel } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
function CustomInput({ label, ...props }) {
  const { t } = useTranslation();
  const [field, meta, helpers] = useField(props);
  return (
    <>
      <FormGroup className="form-group">
        <FormLabel className={meta.error !== '' || meta.error ? 'form-label' : 'form-label-error'}>
          {label}
        </FormLabel>
        <div className="input-container">
          <FormControl
            className={`input-control ${meta.error ? 'error' : ''}`}
            {...field}
            {...props}
          />
          {meta.error && meta.touched ? <div className="text-danger">{meta.error}</div> : null}
        </div>
      </FormGroup>
    </>
  );
}

export default CustomInput;
