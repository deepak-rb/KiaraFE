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
  
  // Danger Zone states
  const [isDangerZoneUnlocked, setIsDangerZoneUnlocked] = useState(false);
  const [dangerZoneAuth, setDangerZoneAuth] = useState({ username: '', password: '' });
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [newUser, setNewUser] = useState({ 
    username: '', 
    password: '', 
    name: '', 
    email: '', 
    specialization: '', 
    clinicName: '', 
    clinicAddress: '', 
    phone: '' 
  });
  const [passwordChange, setPasswordChange] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editUserData, setEditUserData] = useState({ name: '', email: '', specialization: '', clinicName: '', clinicAddress: '', phone: '' });

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
        await fetchAllUsers();
        SweetAlert.success('Access Granted', 'Welcome to the Danger Zone');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Authentication failed');
      SweetAlert.error('Access Denied', err.response?.data?.message || 'Invalid credentials');
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await api.get('/auth/all-users');
      setAllUsers(response.data.users);
    } catch (err: any) {
      console.error('Error fetching users:', err);
    }
  };

  const createNewUser = async () => {
    try {
      setError('');
      if (!newUser.username || !newUser.password || !newUser.name || !newUser.email) {
        setError('Please fill in all required fields');
        return;
      }

      await api.post('/auth/create-user', newUser);
      setNewUser({ 
        username: '', 
        password: '', 
        name: '', 
        email: '', 
        specialization: '', 
        clinicName: '', 
        clinicAddress: '', 
        phone: '' 
      });
      await fetchAllUsers();
      SweetAlert.success('User Created', 'New user has been created successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error creating user');
      SweetAlert.error('Creation Failed', err.response?.data?.message || 'Error creating user');
    }
  };

  const deleteUser = async (userId: string, username: string) => {
    try {
      const result = await SweetAlert.confirmDelete(`user "${username}"`);
      if (result.isConfirmed) {
        await api.delete(`/auth/delete-user/${userId}`);
        await fetchAllUsers();
        SweetAlert.success('User Deleted', 'User has been deleted successfully');
      }
    } catch (err: any) {
      SweetAlert.error('Deletion Failed', err.response?.data?.message || 'Error deleting user');
    }
  };

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

  const startEditUser = (user: any) => {
    setEditingUser(user);
    setEditUserData({
      name: user.name || '',
      email: user.email || '',
      specialization: user.specialization || '',
      clinicName: user.clinicName || '',
      clinicAddress: user.clinicAddress || '',
      phone: user.phone || ''
    });
  };

  const cancelEditUser = () => {
    setEditingUser(null);
    setEditUserData({ name: '', email: '', specialization: '', clinicName: '', clinicAddress: '', phone: '' });
  };

  const saveEditUser = async () => {
    try {
      setError('');
      if (!editUserData.name || !editUserData.email) {
        setError('Name and email are required');
        return;
      }

      await api.put(`/auth/edit-user/${editingUser._id}`, editUserData);
      
      await fetchAllUsers();
      setEditingUser(null);
      setEditUserData({ name: '', email: '', specialization: '', clinicName: '', clinicAddress: '', phone: '' });
      SweetAlert.success('User Updated', 'User details have been updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error updating user');
      SweetAlert.error('Update Failed', err.response?.data?.message || 'Error updating user');
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

                  {/* Create New User */}
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Create New User</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Username *
                        </label>
                        <input
                          type="text"
                          value={newUser.username}
                          onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter username"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Password *
                        </label>
                        <input
                          type="password"
                          value={newUser.password}
                          onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter password"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Name *
                        </label>
                        <input
                          type="text"
                          value={newUser.name}
                          onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter full name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter email"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Specialization
                        </label>
                        <input
                          type="text"
                          value={newUser.specialization}
                          onChange={(e) => setNewUser({...newUser, specialization: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter specialization"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Clinic Name
                        </label>
                        <input
                          type="text"
                          value={newUser.clinicName}
                          onChange={(e) => setNewUser({...newUser, clinicName: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter clinic name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Clinic Address
                        </label>
                        <input
                          type="text"
                          value={newUser.clinicAddress}
                          onChange={(e) => setNewUser({...newUser, clinicAddress: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter clinic address"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone
                        </label>
                        <input
                          type="text"
                          value={newUser.phone}
                          onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter phone number"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <button
                        onClick={createNewUser}
                        className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition duration-200"
                      >
                        Create User
                      </button>
                    </div>
                  </div>

                  {/* User Management */}
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">User Management</h3>
                    
                    {/* Warning when only one user exists */}
                    {allUsers.length <= 1 && (
                      <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-md p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">
                              System Protection Active
                            </h3>
                            <div className="mt-2 text-sm text-yellow-700">
                              <p>You are the last user in the system. User deletion is disabled to prevent system lockout.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {allUsers.length > 0 ? (
                      <div className="space-y-4">
                        {/* User Table */}
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Username
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Specialization
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {allUsers.map((user) => (
                                <tr key={user._id}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {user.username}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {user.name}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {user.email}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {user.specialization}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                    <button
                                      onClick={() => startEditUser(user)}
                                      className="text-blue-600 hover:text-blue-900 transition duration-200"
                                    >
                                      Edit
                                    </button>
                                    {allUsers.length > 1 && user._id !== doctor?.id ? (
                                      <button
                                        onClick={() => deleteUser(user._id, user.username)}
                                        className="text-red-600 hover:text-red-900 transition duration-200"
                                      >
                                        Delete
                                      </button>
                                    ) : (
                                      <span 
                                        className="text-gray-400 cursor-not-allowed"
                                        title={allUsers.length <= 1 ? "Cannot delete the last user" : "Cannot delete your own account"}
                                      >
                                        Delete
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Edit User Modal/Form */}
                        {editingUser && (
                          <div className="border-t pt-6 mt-6">
                            <h4 className="text-lg font-medium text-gray-900 mb-4">
                              Edit User: {editingUser.username}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Name *
                                </label>
                                <input
                                  type="text"
                                  value={editUserData.name}
                                  onChange={(e) => setEditUserData({...editUserData, name: e.target.value})}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Enter full name"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Email *
                                </label>
                                <input
                                  type="email"
                                  value={editUserData.email}
                                  onChange={(e) => setEditUserData({...editUserData, email: e.target.value})}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Enter email"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Specialization
                                </label>
                                <input
                                  type="text"
                                  value={editUserData.specialization}
                                  onChange={(e) => setEditUserData({...editUserData, specialization: e.target.value})}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Enter specialization"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Clinic Name
                                </label>
                                <input
                                  type="text"
                                  value={editUserData.clinicName}
                                  onChange={(e) => setEditUserData({...editUserData, clinicName: e.target.value})}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Enter clinic name"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Clinic Address
                                </label>
                                <input
                                  type="text"
                                  value={editUserData.clinicAddress}
                                  onChange={(e) => setEditUserData({...editUserData, clinicAddress: e.target.value})}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Enter clinic address"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Phone
                                </label>
                                <input
                                  type="text"
                                  value={editUserData.phone}
                                  onChange={(e) => setEditUserData({...editUserData, phone: e.target.value})}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Enter phone number"
                                />
                              </div>
                            </div>
                            <div className="mt-4 flex space-x-3">
                              <button
                                onClick={saveEditUser}
                                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200"
                              >
                                Save Changes
                              </button>
                              <button
                                onClick={cancelEditUser}
                                className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition duration-200"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500">No users found.</p>
                    )}
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
