import React, { useState, useEffect } from 'react';
import { Formik, Form } from 'formik';
import { useDropzone } from 'react-dropzone';
import api from '../utils/api';
import { SweetAlert } from '../utils/SweetAlert';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { doctorProfileSchema } from '../utils/validationSchemas';
import { FormInput, FormTextarea, FormSubmitButton, FormCancelButton } from '../components/FormComponents';

// Import Doctor type from AuthContext
type Doctor = {
  id: string;
  username: string;
  name: string;
  email: string;
  specialization: string;
  clinicName: string;
  clinicAddress?: string;
  phone?: string;
  digitalSignature?: string;
};

const Settings: React.FC = () => {
  const { doctor, updateDoctor } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [digitalSignature, setDigitalSignature] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [deletingSignature, setDeletingSignature] = useState(false);

  const profileInitialValues = {
    name: doctor?.name || '',
    email: doctor?.email || '',
    specialization: doctor?.specialization || '',
    clinicName: doctor?.clinicName || '',
    clinicAddress: doctor?.clinicAddress || '',
    phone: doctor?.phone || ''
  };

  useEffect(() => {
    // Any initialization code can go here
  }, []);

  // Helper function to get signature URL
  const getSignatureUrl = (): string | null => {
    if (!doctor?.digitalSignature) return null;
    return `http://localhost:5000/${doctor.digitalSignature}`;
  };

  const onSignatureDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setDigitalSignature(file);
      const reader = new FileReader();
      reader.onload = () => {
        setSignaturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const { getRootProps: getSignatureProps, getInputProps: getSignatureInputProps, isDragActive: isSignatureDragActive } = useDropzone({
    onDrop: onSignatureDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxFiles: 1
  });

  const handleProfileSubmit = async (values: any) => {
    setError('');
    setSuccess('');

    try {
      const response = await api.put('/doctors/profile', values);
      updateDoctor(response.data.doctor);
      SweetAlert.profileUpdated();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error updating profile');
      SweetAlert.error('Update Failed', err.response?.data?.message || 'Error updating profile');
    }
  };

  const handleSignatureUpload = async () => {
    if (!digitalSignature) {
      setError('Please select a signature image');
      return;
    }

    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('signature', digitalSignature);

      const response = await api.post('/doctors/signature', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Update doctor data with new signature
      if (doctor) {
        const updatedDoctor: Doctor = { 
          ...doctor, 
          digitalSignature: response.data.signaturePath 
        } as Doctor;
        updateDoctor(updatedDoctor);
      }

      SweetAlert.uploadSuccess('Digital signature uploaded successfully');
      setDigitalSignature(null);
      setSignaturePreview(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error uploading signature');
      SweetAlert.error('Upload Failed', err.response?.data?.message || 'Error uploading signature');
    }
  };

  const handleDeleteSignature = async () => {
    const result = await SweetAlert.confirmDelete('digital signature');
    if (!result.isConfirmed) {
      return;
    }

    setDeletingSignature(true);
    setError('');

    try {
      await api.delete('/doctors/signature');
      
      // Update doctor data to remove signature
      if (doctor) {
        const updatedDoctor: Doctor = { 
          ...doctor, 
          digitalSignature: undefined 
        } as Doctor;
        updateDoctor(updatedDoctor);
      }

      SweetAlert.success('Signature Deleted', 'Digital signature has been deleted successfully.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error deleting signature');
      SweetAlert.error('Delete Failed', err.response?.data?.message || 'Error deleting signature');
    } finally {
      setDeletingSignature(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      
      
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>
          
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab('signature')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'signature'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Digital Signature
              </button>
            </nav>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-green-600">{success}</p>
            </div>
          )}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-6">Doctor Profile</h2>
              <Formik
                key={doctor?.id || 'no-doctor'}
                initialValues={profileInitialValues}
                validationSchema={doctorProfileSchema}
                onSubmit={handleProfileSubmit}
                enableReinitialize
                validateOnChange={true}
                validateOnBlur={true}
              >
                {({ isSubmitting, isValid }) => (
                  <Form className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormInput
                        name="name"
                        label="Full Name"
                        required
                      />
                      <FormInput
                        name="email"
                        label="Email Address"
                        type="email"
                        required
                      />
                      <FormInput
                        name="specialization"
                        label="Specialization"
                        required
                      />
                      <FormInput
                        name="phone"
                        label="Phone Number"
                        type="tel"
                        required
                      />
                      <FormInput
                        name="clinicName"
                        label="Clinic Name"
                        required
                      />
                    </div>
                    <FormTextarea
                      name="clinicAddress"
                      label="Clinic Address"
                      rows={3}
                      required
                    />
                    <div className="flex justify-end">
                      <FormSubmitButton
                        isSubmitting={isSubmitting}
                        isValid={isValid}
                      >
                        Update Profile
                      </FormSubmitButton>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          )}

          {/* Digital Signature Tab */}
          {activeTab === 'signature' && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-6">Digital Signature</h2>
              
              {/* Show existing signature if available */}
              {doctor?.digitalSignature && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Current Digital Signature</h3>
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <img
                          src={getSignatureUrl()!}
                          alt="Current digital signature"
                          className="max-h-20 max-w-40 object-contain border border-gray-300 rounded bg-white p-2"
                          onError={(e) => {
                            console.error('Failed to load signature image');
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Digital signature uploaded</p>
                          <p className="text-sm text-gray-500">Click "Delete Signature" to remove and upload a new one</p>
                        </div>
                      </div>
                      <button
                        onClick={handleDeleteSignature}
                        disabled={deletingSignature}
                        className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                      >
                        {deletingSignature ? (
                          <>
                            <div className="animate-spin h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full mr-2"></div>
                            Deleting...
                          </>
                        ) : (
                          <>
                            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete Signature
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload new signature section */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {doctor?.digitalSignature ? 'Upload New Signature' : 'Upload Digital Signature'}
                </h3>
                <div
                  {...getSignatureProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isSignatureDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input {...getSignatureInputProps()} />
                  {signaturePreview ? (
                    <div className="space-y-4">
                      <img
                        src={signaturePreview}
                        alt="Signature preview"
                        className="mx-auto max-h-32 object-contain"
                      />
                      <p className="text-sm text-gray-600">Click or drag to replace signature</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p className="text-sm text-gray-600">
                        {isSignatureDragActive ? 'Drop the signature here' : 'Click to upload or drag and drop your digital signature'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Supported formats: JPG, PNG, GIF
                      </p>
                    </div>
                  )}
                </div>
                {digitalSignature && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={handleSignatureUpload}
                      className="btn btn-primary"
                    >
                      {doctor?.digitalSignature ? 'Replace Signature' : 'Upload Signature'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
