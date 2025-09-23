import React from 'react';
import { LoginSchema } from '../../validations/loginValidation';
import { Formik, Form } from 'formik';
import CustomInput from '../CustomInput';
import './index.css';
function Loginform(props) {
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
                <CustomInput type="email" name="email" label="pin" />
                <CustomInput type="password" name="password" label="password" />
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
