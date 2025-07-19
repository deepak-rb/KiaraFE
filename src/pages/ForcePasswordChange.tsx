import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import api from '../utils/api';
import { SweetAlert } from '../utils/SweetAlert';
import { FormInput, FormSubmitButton } from '../components/FormComponents';
import { useAuth } from '../context/AuthContext';

const passwordSchema = Yup.object({
  currentPassword: Yup.string().required('Current password is required'),
  newPassword: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character')
    .required('New password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords must match')
    .required('Please confirm your password')
});

const ForcePasswordChange: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [error, setError] = useState('');

  const initialValues = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  const handleSubmit = async (values: any) => {
    setError('');

    try {
      const response = await api.post('/auth/force-change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      });

      // Show success message
      await SweetAlert.success(
        'Password Changed Successfully!', 
        'Your password has been updated. You will now be redirected to login with your new password.'
      );

      // Logout the user and redirect to login
      logout();
      navigate('/login');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error changing password';
      setError(errorMessage);
      SweetAlert.error('Password Change Failed', errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="h-10 w-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m9-6V9a3 3 0 00-3-3H8a3 3 0 00-3 3v6m14 0v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2m14 0H5" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Password Change Required</h2>
          <p className="mt-2 text-sm text-gray-600">
            For security reasons, you must change your password before accessing the system.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Default Password Detected
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>Your current password is: <strong>Hello@123</strong></p>
                  <p>Please change it to a secure password of your choice.</p>
                </div>
              </div>
            </div>
          </div>

          <Formik
            initialValues={initialValues}
            validationSchema={passwordSchema}
            onSubmit={handleSubmit}
            validateOnChange={true}
            validateOnBlur={true}
          >
            {({ isSubmitting, isValid }) => (
              <Form className="space-y-6">
                <FormInput
                  name="currentPassword"
                  label="Current Password"
                  type="password"
                  placeholder="Enter Hello@123"
                  required
                />

                <FormInput
                  name="newPassword"
                  label="New Password"
                  type="password"
                  placeholder="Enter your new secure password"
                  required
                />

                <FormInput
                  name="confirmPassword"
                  label="Confirm New Password"
                  type="password"
                  placeholder="Confirm your new password"
                  required
                />

                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Password Requirements:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• At least 8 characters long</li>
                    <li>• Contains uppercase and lowercase letters</li>
                    <li>• Contains at least one number</li>
                    <li>• Contains at least one special character (!@#$%^&*)</li>
                  </ul>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                <FormSubmitButton
                  isSubmitting={isSubmitting}
                  isValid={isValid}
                  className="w-full"
                >
                  {isSubmitting ? 'Changing Password...' : 'Change Password'}
                </FormSubmitButton>
              </Form>
            )}
          </Formik>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              After changing your password, you will be redirected to the login page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForcePasswordChange;
