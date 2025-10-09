import React from 'react';
import { LoginSchema } from '../../validations/loginValidation';
import { Formik, Form } from 'formik';
import CustomInput from '../CustomInput';
import './index.css';
import { useTranslation } from 'react-i18next';
function Loginform(props) {
  const { t } = useTranslation();
  return (
    <div>
      <Formik
        initialValues={{
          email: '',
          password: ''
        }}
        validationSchema={LoginSchema}
        onSubmit={props.onSumbitHandler}
      >
        {({ errors }) => (
          <div>
            <Form className="form-container">
              <div className="form-container row">
                <CustomInput type="email" name="email" label={t("filing.pin")} />
                <CustomInput type="password" name="password" label={t("filing.password")} />
                <button
                  className={`form-button ${errors.password || errors.email ? 'error' : ''}`}
                  type="submit"
                >
                  Submit
                </button>
              </div>
            </Form>
          </div>
        )}
      </Formik>
    </div>
  );
}

export default Loginform;
