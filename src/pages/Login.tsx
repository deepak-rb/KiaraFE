import React, { useState } from 'react';
import { Formik, Form } from 'formik';
import { useAuth } from '../context/AuthContext';
import { loginSchema } from '../utils/validationSchemas';
import { FormInput, FormSubmitButton } from '../components/FormComponents';
import { SweetAlert } from '../utils/SweetAlert';

const Login: React.FC = () => {
  const { login } = useAuth();

  const handleSubmit = async (values: { username: string; password: string }) => {
    try {
      await login(values.username, values.password);
    } catch (err: any) {
      SweetAlert.error('Login Failed', err.message || 'Please check your credentials and try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-auto flex justify-center">
            <div className="bg-blue-600 text-white rounded-lg px-4 py-2 text-xl font-bold">
              Clinic Management
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Doctor Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your clinic management account
          </p>
        </div>
        
        <Formik
          initialValues={{ username: '', password: '' }}
          validationSchema={loginSchema}
          onSubmit={handleSubmit}
          validateOnChange={true}
          validateOnBlur={true}
        >
          {({ isSubmitting, isValid }) => (
            <Form className="mt-8 space-y-6">
              <div className="rounded-md shadow-sm -space-y-px">
                <div>
                  <FormInput
                    name="username"
                    label="Username"
                    type="text"
                    placeholder="Username"
                    required
                  />
                </div>
                <div>
                  <FormInput
                    name="password"
                    label="Password"
                    type="password"
                    placeholder="Password"
                    required
                  />
                </div>
              </div>

              <div>
                <FormSubmitButton
                  isSubmitting={isSubmitting}
                  isValid={isValid}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Sign in
                </FormSubmitButton>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default Login;
