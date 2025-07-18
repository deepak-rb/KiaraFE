import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import api from '../utils/api';
import { SweetAlert } from '../utils/SweetAlert';
import Navbar from '../components/Navbar';
import { prescriptionSchema } from '../utils/validationSchemas';
import { FormTextarea, FormSubmitButton, FormCancelButton } from '../components/FormComponents';

interface Patient {
  _id: string;
  patientId: string;
  name: string;
  age: number;
  phone: string;
  address: string;
}

interface Doctor {
  _id: string;
  name: string;
  specialization: string;
  clinicName: string;
  clinicAddress: string;
}

interface Prescription {
  _id: string;
  prescriptionId: string;
  patientId: Patient;
  doctorId: Doctor;
  patientName: string;
  patientAge: number;
  symptoms: string;
  prescription: string;
  nextFollowUp?: string;
  digitalSignature?: string;
  notes?: string;
  createdAt: string;
}

const EditPrescription: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [prescription, setPrescription] = useState<Prescription | null>(null);

  useEffect(() => {
    if (id) {
      fetchPrescription();
    }
  }, [id]);

  const fetchPrescription = async () => {
    try {
      const response = await api.get(`/prescriptions/${id}`);
      setPrescription(response.data.prescription);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error fetching prescription');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    setError('');

    try {
      await api.put(`/prescriptions/${id}`, {
        symptoms: values.symptoms,
        prescription: values.prescription,
        nextFollowUp: values.nextFollowUp,
        notes: values.notes
      });

      SweetAlert.prescriptionUpdated();
      navigate('/prescriptions/all');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error updating prescription');
      SweetAlert.error('Update Failed', err.response?.data?.message || 'Error updating prescription');
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

  if (!prescription) {
    return (
      <div className="min-h-screen bg-gray-50">
        
        <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-red-600">Prescription not found</p>
          </div>
        </div>
      </div>
    );
  }

  const initialValues = {
    symptoms: prescription.symptoms,
    prescription: prescription.prescription,
    nextFollowUp: prescription.nextFollowUp || '',
    notes: prescription.notes || ''
  };

  return (
    <div className="min-h-screen bg-gray-50">
      
      
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Edit Prescription</h1>
            <p className="mt-1 text-sm text-gray-500">
              Update prescription details for {prescription.patientId.name}
            </p>
          </div>

          {error && (
            <div className="mb-8 bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <Formik
            initialValues={initialValues}
            validationSchema={prescriptionSchema.omit(['patientId'])}
            onSubmit={handleSubmit}
            validateOnChange={true}
            validateOnBlur={true}
          >
            {({ isSubmitting, isValid }) => (
              <Form className="space-y-8">
                {/* Patient Information (Read-only) */}
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Patient Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="form-label">Prescription ID</label>
                      <input
                        type="text"
                        value={prescription.prescriptionId}
                        className="form-input bg-gray-50"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="form-label">Patient ID</label>
                      <input
                        type="text"
                        value={prescription.patientId.patientId}
                        className="form-input bg-gray-50"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="form-label">Patient Name</label>
                      <input
                        type="text"
                        value={prescription.patientId.name}
                        className="form-input bg-gray-50"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="form-label">Age</label>
                      <input
                        type="text"
                        value={prescription.patientId.age}
                        className="form-input bg-gray-50"
                        readOnly
                      />
                    </div>
                  </div>
                  <div className="mt-6">
                    <label className="form-label">Patient Address</label>
                    <textarea
                      value={prescription.patientId.address}
                      className="form-textarea bg-gray-50"
                      rows={2}
                      readOnly
                    />
                  </div>
                </div>

                {/* Prescription Details */}
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Prescription Details</h3>
                  <div className="space-y-6">
                    <FormTextarea
                      name="symptoms"
                      label="Symptoms"
                      rows={4}
                      required
                    />
                    
                    <FormTextarea
                      name="prescription"
                      label="Prescription"
                      rows={6}
                      required
                    />
                    
                    <Field name="nextFollowUp">
                      {({ field, form }: any) => (
                        <div>
                          <label className="form-label">Next Follow-Up Date</label>
                          <input
                            {...field}
                            type="date"
                            className="form-input"
                          />
                          {form.errors.nextFollowUp && form.touched.nextFollowUp && (
                            <div className="text-red-500 text-sm">{form.errors.nextFollowUp}</div>
                          )}
                        </div>
                      )}
                    </Field>
                    
                    <FormTextarea
                      name="notes"
                      label="Additional Notes"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4">
                  <FormCancelButton onClick={() => navigate('/prescriptions/all')}>
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

export default EditPrescription;
