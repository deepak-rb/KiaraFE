import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import { useDropzone } from 'react-dropzone';
import api from '../utils/api';
import { SweetAlert } from '../utils/SweetAlert';
import { patientSchema } from '../utils/validationSchemas';
import { FormInput, FormTextarea, FormSelect, FormSubmitButton, FormCancelButton } from '../components/FormComponents';

interface Patient {
  _id: string;
  patientId: string;
  name: string;
  dateOfBirth: string;
  age: number;
  sex: string;
  phone: string;
  address: string;
  photo?: string;
  emergencyContact: {
    name: string;
    relation: string;
    phone: string;
  };
  medicalHistory: {
    allergies: string;
    chronicIllnesses: string;
    pastSurgeries: string;
    medications: string;
    additionalNotes: string;
  };
}

const EditPatient: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const sexOptions = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Other', label: 'Other' }
  ];

  useEffect(() => {
    if (id) {
      fetchPatient();
    }
  }, [id]);

  const fetchPatient = async () => {
    try {
      const response = await api.get(`/patients/${id}`);
      setPatient(response.data.patient);
      if (response.data.patient.photo) {
        // Extract just the filename and use the new patient-image endpoint
        const filename = response.data.patient.photo.split('/').pop();
        setPhotoPreview(`http://localhost:5000/patient-image/${filename}`);
      } else {
        // Set fallback avatar if no photo
        setPhotoPreview(`https://ui-avatars.com/api/?name=${encodeURIComponent(response.data.patient.name)}&background=0d6efd&color=fff&size=128`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error fetching patient');
    } finally {
      setLoading(false);
    }
  };

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false
  });

  const handleSubmit = async (values: any) => {
    setError('');

    try {
      const formData = new FormData();
      
      // Add all patient fields
      Object.entries(values).forEach(([key, value]) => {
        if (key.includes('.')) {
          // Handle nested fields
          const [parent, child] = key.split('.');
          formData.append(key, value as string);
        } else {
          formData.append(key, value as string);
        }
      });
      
      // Photo if selected
      if (photoFile) {
        formData.append('photo', photoFile);
      }

      await api.put(`/patients/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      SweetAlert.patientUpdated(values.name);
      navigate('/patients/search');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error updating patient');
      SweetAlert.error('Update Failed', err.response?.data?.message || 'Error updating patient');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        
        <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-50">
        
        <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-red-600">Patient not found</p>
          </div>
        </div>
      </div>
    );
  }

  const initialValues = {
    name: patient.name,
    dateOfBirth: patient.dateOfBirth,
    age: patient.age.toString(),
    sex: patient.sex,
    phone: patient.phone,
    address: patient.address,
    emergencyContactName: patient.emergencyContact.name,
    emergencyContactRelation: patient.emergencyContact.relation,
    emergencyContactPhone: patient.emergencyContact.phone,
    allergies: patient.medicalHistory.allergies,
    chronicIllnesses: patient.medicalHistory.chronicIllnesses,
    pastSurgeries: patient.medicalHistory.pastSurgeries,
    medications: patient.medicalHistory.medications,
    additionalNotes: patient.medicalHistory.additionalNotes
  };

  return (
    <div className="min-h-screen bg-gray-50">
      
      
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Edit Patient</h1>
            <p className="mt-1 text-sm text-gray-500">
              Update patient information for {patient.name}
            </p>
          </div>

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
                    {photoPreview ? (
                      <div className="space-y-4">
                        <img
                          src={photoPreview}
                          alt="Patient preview"
                          className="mx-auto h-32 w-32 object-cover rounded-full"
                          onError={(e) => {
                            // If image fails to load, show fallback avatar
                            const target = e.target as HTMLImageElement;
                            if (patient) {
                              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.name)}&background=0d6efd&color=fff&size=128`;
                            }
                          }}
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
                    <div>
                      <label className="form-label">Patient ID</label>
                      <input
                        type="text"
                        value={patient.patientId}
                        className="form-input bg-gray-50"
                        readOnly
                      />
                    </div>
                    <FormInput
                      name="name"
                      label="Full Name"
                      required
                    />
                    <Field name="dateOfBirth">
                      {({ field, form }: any) => (
                        <div>
                          <label className="form-label">Date of Birth <span className="text-red-500">*</span></label>
                          <input
                            {...field}
                            type="date"
                            className="form-input"
                            onChange={(e) => {
                              field.onChange(e);
                              handleDateOfBirthChange(e.target.value, form.setFieldValue);
                            }}
                          />
                          {form.errors.dateOfBirth && form.touched.dateOfBirth && (
                            <div className="text-red-500 text-sm">{form.errors.dateOfBirth}</div>
                          )}
                        </div>
                      )}
                    </Field>
                    <Field name="age">
                      {({ field }: any) => (
                        <div>
                          <label className="form-label">Age</label>
                          <input
                            {...field}
                            type="number"
                            className="form-input bg-gray-50"
                            readOnly
                          />
                        </div>
                      )}
                    </Field>
                    <FormSelect
                      name="sex"
                      label="Sex"
                      options={sexOptions}
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
                  <FormCancelButton onClick={() => navigate('/patients/search')}>
                    Cancel
                  </FormCancelButton>
                  <FormSubmitButton
                    isSubmitting={isSubmitting}
                    isValid={isValid}
                  >
                    Save Changes
                  </FormSubmitButton>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default EditPatient;
