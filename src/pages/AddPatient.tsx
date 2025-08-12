import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import { useDropzone } from 'react-dropzone';
import api from '../utils/api';
import { SweetAlert } from '../utils/SweetAlert';
import { patientSchema } from '../utils/validationSchemas';
import { FormInput, FormTextarea, FormSelect, FormSubmitButton, FormCancelButton } from '../components/FormComponents';
import MaterialDatePicker from '../components/MaterialDatePicker';
import dayjs from 'dayjs';

const AddPatient: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const initialValues = {
    patientId: '',
    name: '',
    dateOfBirth: '',
    age: '',
    sex: '',
    address: '',
    phone: '',
    emergencyContactName: '',
    emergencyContactRelation: '',
    emergencyContactPhone: '',
    allergies: '',
    chronicIllnesses: '',
    pastSurgeries: '',
    medications: '',
    additionalNotes: ''
  };

  const sexOptions = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Other', label: 'Other' }
  ];

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxFiles: 1
  });

  const handleSubmit = async (values: any) => {
    setError('');

    try {
      const formDataToSend = new FormData();
      
      // Append all form fields
      Object.entries(values).forEach(([key, value]) => {
        formDataToSend.append(key, value as string);
      });
      
      // Append photo if selected
      if (photo) {
        formDataToSend.append('photo', photo);
      }

      await api.post('/patients', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      SweetAlert.patientAdded(values.name);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add patient');
      SweetAlert.error('Failed to Add Patient', err.response?.data?.message || 'Failed to add patient');
    }
  };

  const handleDateOfBirthChange = (value: string, setFieldValue: any) => {
    setFieldValue('dateOfBirth', value);
    
    // Auto-calculate age from date of birth
    if (value) {
      const today = new Date();
      const birthDate = new Date(value);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      setFieldValue('age', age.toString());
    }
  };

  const handleAgeChange = (value: string, setFieldValue: any) => {
    setFieldValue('age', value);
    
    // Auto-calculate date of birth from age (January 1st of the calculated birth year)
    if (value && !isNaN(parseInt(value))) {
      const age = parseInt(value);
      const currentYear = new Date().getFullYear();
      const birthYear = currentYear - age;
      const calculatedDateOfBirth = `${birthYear}-01-01`;
      setFieldValue('dateOfBirth', calculatedDateOfBirth);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Add New Patient</h1>
          
          <Formik
            initialValues={initialValues}
            validationSchema={patientSchema}
            onSubmit={handleSubmit}
            validateOnChange={true}
            validateOnBlur={true}
          >
            {({ isSubmitting, isValid, setFieldValue }) => (
              <Form className="space-y-8">
                {/* Patient Photo */}
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Patient Photo</h3>
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                      isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input {...getInputProps()} />
                    {previewUrl ? (
                      <div className="space-y-4">
                        <img
                          src={previewUrl}
                          alt="Patient preview"
                          className="mx-auto h-32 w-32 object-cover rounded-full"
                        />
                        <p className="text-sm text-gray-600">Click or drag to replace photo</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p className="text-sm text-gray-600">
                          {isDragActive ? 'Drop the photo here' : 'Click to upload or drag and drop patient photo'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Basic Information */}
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormInput
                      name="patientId"
                      label="Patient ID (optional)"
                      placeholder="Leave empty for auto-generation (starts from P1000)"
                    />
                    <FormInput
                      name="name"
                      label="Full Name"
                      required
                    />
                    <Field name="dateOfBirth">
                      {({ field, form }: any) => (
                        <MaterialDatePicker
                          label="Date of Birth"
                          value={field.value}
                          onChange={(date) => {
                            form.setFieldValue('dateOfBirth', date);
                            handleDateOfBirthChange(date, form.setFieldValue);
                          }}
                          onBlur={() => form.setFieldTouched('dateOfBirth', true)}
                          error={form.errors.dateOfBirth && form.touched.dateOfBirth ? form.errors.dateOfBirth : ''}
                          required
                          maxDate={dayjs()}
                          minDate={dayjs('1900-01-01')}
                          placeholder="Select date of birth"
                        />
                      )}
                    </Field>
                    <Field name="age">
                      {({ field, form }: any) => (
                        <div>
                          <label className="form-label">Age</label>
                          <input
                            {...field}
                            type="number"
                            className="form-input"
                            min="0"
                            max="150"
                            placeholder="Enter age"
                            onChange={(e) => {
                              field.onChange(e);
                              handleAgeChange(e.target.value, form.setFieldValue);
                            }}
                          />
                        </div>
                      )}
                    </Field>
                    <FormSelect
                      name="sex"
                      label="Sex"
                      options={sexOptions}
                      placeholder="Select Sex"
                      required
                    />
                    <FormInput
                      name="phone"
                      label="Phone Number"
                      type="tel"
                      required
                    />
                  </div>
                  <div className="mt-6">
                    <FormTextarea
                      name="address"
                      label="Address"
                      rows={3}
                      required
                    />
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormInput
                      name="emergencyContactName"
                      label="Contact Name"
                      required
                    />
                    <FormInput
                      name="emergencyContactRelation"
                      label="Relation"
                      placeholder="e.g., Father, Mother, Spouse"
                      required
                    />
                    <FormInput
                      name="emergencyContactPhone"
                      label="Phone Number"
                      type="tel"
                      required
                    />
                  </div>
                </div>

                {/* Medical History */}
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Medical History</h3>
                  <div className="space-y-6">
                    <FormTextarea
                      name="allergies"
                      label="Allergies"
                      rows={3}
                      placeholder="List any known allergies..."
                    />
                    <FormTextarea
                      name="chronicIllnesses"
                      label="Chronic Illnesses"
                      rows={3}
                      placeholder="List any chronic conditions..."
                    />
                    <FormTextarea
                      name="pastSurgeries"
                      label="Past Surgeries"
                      rows={3}
                      placeholder="List any past surgeries with dates..."
                    />
                    <FormTextarea
                      name="medications"
                      label="Current Medications"
                      rows={3}
                      placeholder="List current medications..."
                    />
                    <FormTextarea
                      name="additionalNotes"
                      label="Additional Notes"
                      rows={3}
                      placeholder="Any additional medical information..."
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-red-600">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end space-x-4">
                  <FormCancelButton onClick={() => navigate('/dashboard')}>
                    Cancel
                  </FormCancelButton>
                  <FormSubmitButton
                    isSubmitting={isSubmitting}
                    isValid={isValid}
                  >
                    Add Patient
                  </FormSubmitButton>
                </div>
              </Form>
            )}
          </Formik>
        </div>
    </div>
  );
};

export default AddPatient;
