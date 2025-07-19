import React, { useState, useEffect } from 'react';
import { Formik, Form } from 'formik';
import { useDropzone } from 'react-dropzone';
import api from '../utils/api';
import { SweetAlert } from '../utils/SweetAlert';
import { useAuth } from '../context/AuthContext';
import { doctorProfileSchema } from '../utils/validationSchemas';
import { FormInput, FormTextarea, FormSubmitButton } from '../components/FormComponents';

// Import Doctor type from AuthContext
type Doctor = {
  id: string;
  username: string;
  name: string;
  email: string;
  specialization: string;
  licenseNumber?: string;
  clinicName: string;
  clinicAddress?: string;
  phone?: string;
  digitalSignature?: string;
};

const Settings: React.FC = () => {
  const { doctor, updateDoctor, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [digitalSignature, setDigitalSignature] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [deletingSignature, setDeletingSignature] = useState(false);
  
  // Danger Zone states
  const [isDangerZoneUnlocked, setIsDangerZoneUnlocked] = useState(false);
  const [dangerZoneAuth, setDangerZoneAuth] = useState({ username: '', password: '' });
  const [passwordChange, setPasswordChange] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [dataCounts, setDataCounts] = useState({ doctors: 0, patients: 0, prescriptions: 0, total: 0 });
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  // Use useMemo to ensure profileInitialValues update when doctor data changes
  const profileInitialValues = React.useMemo(() => ({
    name: doctor?.name || '',
    email: doctor?.email || '',
    specialization: doctor?.specialization || '',
    licenseNumber: doctor?.licenseNumber || '',
    clinicName: doctor?.clinicName || '',
    clinicAddress: doctor?.clinicAddress || '',
    phone: doctor?.phone || ''
  }), [doctor]);

  useEffect(() => {
    // Debug logging to track doctor data loading
    console.log('Settings - Doctor data:', doctor);
    console.log('Settings - Loading state:', loading);
    console.log('Settings - License Number:', doctor?.licenseNumber);
  }, [doctor, loading]);

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

  const handleSignatureDelete = async () => {
    try {
      setDeletingSignature(true);
      await api.delete('/doctors/signature');
      
      // Update doctor context without signature
      updateDoctor({ ...doctor, digitalSignature: undefined } as Doctor);
      setSignaturePreview(null);
      SweetAlert.success('Signature Deleted', 'Digital signature has been removed successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error deleting signature');
      SweetAlert.error('Delete Failed', err.response?.data?.message || 'Error deleting signature');
    } finally {
      setDeletingSignature(false);
    }
  };

  // Danger Zone functions
  const authenticateDangerZone = async () => {
    try {
      setError('');
      const response = await api.post('/auth/danger-zone-auth', {
        username: dangerZoneAuth.username,
        password: dangerZoneAuth.password
      });
      
      if (response.data.success) {
        setIsDangerZoneUnlocked(true);
        await fetchDataCounts();
        SweetAlert.success('Access Granted', 'Welcome to the Danger Zone');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Authentication failed');
      SweetAlert.error('Access Denied', err.response?.data?.message || 'Invalid credentials');
    }
  };

  const fetchDataCounts = async () => {
    try {
      const response = await api.get('/auth/data-counts');
      setDataCounts(response.data);
    } catch (err: any) {
      console.error('Error fetching data counts:', err);
    }
  };

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      setError('');
      
      const response = await api.get('/auth/export-data', {
        responseType: 'blob'
      });
      
      // Create a blob URL and trigger download
      const blob = new Blob([response.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `clinic-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      SweetAlert.success('Export Successful', 'Data has been exported successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error exporting data');
      SweetAlert.error('Export Failed', err.response?.data?.message || 'Error exporting data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = async () => {
    if (!importFile) {
      setError('Please select a file to import');
      return;
    }

    try {
      setIsImporting(true);
      setError('');

      const fileContent = await importFile.text();
      const importData = JSON.parse(fileContent);

      if (!importData.data || !importData.data.doctors || !importData.data.patients || !importData.data.prescriptions) {
        throw new Error('Invalid file format');
      }

      const result = await SweetAlert.confirm(
        'Import Data',
        'This will completely replace all existing data. Are you sure you want to continue?',
        'Yes, import data',
        'Cancel'
      );

      if (result.isConfirmed) {
        // Show loading alert
        SweetAlert.loading('Importing Data', 'Please wait while we verify and import your data...');
        
        const response = await api.post('/auth/import-data', { data: importData.data });
        
        await fetchDataCounts();
        setImportFile(null);
        
        // Check if rollback occurred
        if (response.data.rollback) {
          SweetAlert.error('Import Failed with Rollback', 
            'The import failed but your original data has been restored successfully.');
        } else if (response.data.critical) {
          SweetAlert.error('Critical Import Error', 
            'Import failed and rollback also failed. Please check your database state.');
        } else {
          // Success message with verification details
          const verified = response.data.verified;
          const imported = response.data.imported;
          
          let successMessage = `Data has been imported successfully!\n\n` +
            `Imported: ${imported.doctors} doctors, ${imported.patients} patients, ${imported.prescriptions} prescriptions\n` +
            `Verified: ${verified.doctors} doctors, ${verified.patients} patients, ${verified.prescriptions} prescriptions in database\n\n` +
            `Please refresh to see changes.`;
          
          if (response.data.warning) {
            successMessage += `\n\n⚠️ IMPORTANT: ${response.data.warning}`;
          }
          
          SweetAlert.success('Import Successful', successMessage);
        }
      }
    } catch (err: any) {
      console.error('Import error:', err);
      
      let errorMessage = 'Error importing data';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      
      // Provide specific error messages based on error type
      if (errorMessage.includes('validation failed')) {
        SweetAlert.error('Data Validation Failed', 
          'The imported data does not match the expected format. Please check your backup file.');
      } else if (errorMessage.includes('rollback')) {
        SweetAlert.warning('Import Failed but Data Restored', 
          'The import failed but your original data has been safely restored.');
      } else {
        SweetAlert.error('Import Failed', errorMessage);
      }
    } finally {
      setIsImporting(false);
    }
  };

  const onImportFileDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.type === 'application/json') {
      setImportFile(file);
    } else {
      setError('Please select a valid JSON file');
    }
  };

  const { getRootProps: getImportProps, getInputProps: getImportInputProps, isDragActive: isImportDragActive } = useDropzone({
    onDrop: onImportFileDrop,
    accept: {
      'application/json': ['.json']
    },
    maxFiles: 1
  });

  const changePassword = async () => {
    try {
      setError('');
      if (passwordChange.newPassword !== passwordChange.confirmPassword) {
        setError('New passwords do not match');
        return;
      }

      await api.post('/auth/change-password', {
        currentPassword: passwordChange.currentPassword,
        newPassword: passwordChange.newPassword
      });

      setPasswordChange({ currentPassword: '', newPassword: '', confirmPassword: '' });
      SweetAlert.success('Password Changed', 'Your password has been updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error changing password');
      SweetAlert.error('Change Failed', err.response?.data?.message || 'Error changing password');
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
              <button
                onClick={() => {
                  setActiveTab('danger');
                  setIsDangerZoneUnlocked(false);
                  setDangerZoneAuth({ username: '', password: '' });
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'danger'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🔥 Danger Zone
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
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading profile...</span>
                </div>
              ) : (
                <Formik
                  key={`doctor-${doctor?.id}-${doctor?.licenseNumber || 'no-license'}`}
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
                          name="licenseNumber"
                          label="License Number"
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
              )}
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
                        onClick={handleSignatureDelete}
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

          {/* Danger Zone Tab */}
          {activeTab === 'danger' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-red-800 mb-2">⚠️ Danger Zone</h2>
                <p className="text-red-600">
                  This area contains sensitive administrative functions. Unauthorized access is prohibited.
                </p>
              </div>

              {!isDangerZoneUnlocked ? (
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Authentication Required</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Username
                      </label>
                      <input
                        type="text"
                        value={dangerZoneAuth.username}
                        onChange={(e) => setDangerZoneAuth({...dangerZoneAuth, username: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Enter your username"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password
                      </label>
                      <input
                        type="password"
                        value={dangerZoneAuth.password}
                        onChange={(e) => setDangerZoneAuth({...dangerZoneAuth, password: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Enter your password"
                      />
                    </div>
                    <button
                      onClick={authenticateDangerZone}
                      className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition duration-200"
                    >
                      Authenticate
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Current Admin Details */}
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Current Admin Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Username</label>
                        <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">{doctor?.username}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">{doctor?.name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">{doctor?.email}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Specialization</label>
                        <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">{doctor?.specialization}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">License Number</label>
                        <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">{doctor?.licenseNumber}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">{doctor?.phone}</p>
                      </div>
                    </div>
                  </div>

                  {/* Password Change */}
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Password
                        </label>
                        <input
                          type="password"
                          value={passwordChange.currentPassword}
                          onChange={(e) => setPasswordChange({...passwordChange, currentPassword: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={passwordChange.newPassword}
                          onChange={(e) => setPasswordChange({...passwordChange, newPassword: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          value={passwordChange.confirmPassword}
                          onChange={(e) => setPasswordChange({...passwordChange, confirmPassword: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <button
                        onClick={changePassword}
                        className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200"
                      >
                        Change Password
                      </button>
                    </div>
                  </div>

                  {/* Data Export/Import */}
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Data Management</h3>
                    
                    {/* Data Statistics */}
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-md font-medium text-gray-900">Current Data Statistics</h4>
                        <button
                          onClick={fetchDataCounts}
                          className="inline-flex items-center px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition duration-200"
                        >
                          <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Refresh
                        </button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 p-3 rounded-lg text-center">
                          <p className="text-2xl font-bold text-blue-600">{dataCounts.doctors}</p>
                          <p className="text-sm text-blue-700">Doctors</p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg text-center">
                          <p className="text-2xl font-bold text-green-600">{dataCounts.patients}</p>
                          <p className="text-sm text-green-700">Patients</p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg text-center">
                          <p className="text-2xl font-bold text-purple-600">{dataCounts.prescriptions}</p>
                          <p className="text-sm text-purple-700">Prescriptions</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg text-center">
                          <p className="text-2xl font-bold text-gray-600">{dataCounts.total}</p>
                          <p className="text-sm text-gray-700">Total Records</p>
                        </div>
                      </div>
                    </div>

                    {/* Export Section */}
                    <div className="mb-6">
                      <h4 className="text-md font-medium text-gray-900 mb-3">Export Data</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Download a complete backup of all clinic data including doctors, patients, and prescriptions.
                      </p>
                      <button
                        onClick={handleExportData}
                        disabled={isExporting}
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition duration-200"
                      >
                        {isExporting ? (
                          <>
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                            Exporting...
                          </>
                        ) : (
                          <>
                            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Export Data
                          </>
                        )}
                      </button>
                    </div>

                    {/* Import Section */}
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">Import Data</h4>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">
                              Warning: Data will be completely replaced
                            </h3>
                            <div className="mt-2 text-sm text-yellow-700">
                              <p>Importing data will permanently delete all existing records and replace them with the imported data.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div
                        {...getImportProps()}
                        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                          isImportDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <input {...getImportInputProps()} />
                        {importFile ? (
                          <div className="space-y-3">
                            <svg className="mx-auto h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm font-medium text-gray-900">{importFile.name}</p>
                            <p className="text-xs text-gray-500">Click or drag to replace file</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <svg className="mx-auto h-8 w-8 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <p className="text-sm text-gray-600">
                              {isImportDragActive ? 'Drop the JSON file here' : 'Click to upload or drag and drop a backup JSON file'}
                            </p>
                            <p className="text-xs text-gray-500">
                              Only JSON backup files are supported
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {importFile && (
                        <div className="mt-4 flex justify-end space-x-3">
                          <button
                            onClick={() => setImportFile(null)}
                            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition duration-200"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleImportData}
                            disabled={isImporting}
                            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition duration-200"
                          >
                            {isImporting ? (
                              <>
                                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                                Importing...
                              </>
                            ) : (
                              <>
                                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                </svg>
                                Import Data
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6">
                    <button
                      onClick={() => {
                        setIsDangerZoneUnlocked(false);
                        setDangerZoneAuth({ username: '', password: '' });
                      }}
                      className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition duration-200"
                    >
                      Lock Danger Zone
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
