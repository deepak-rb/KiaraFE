import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import { SweetAlert } from '../utils/SweetAlert';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import { prescriptionSchema } from '../utils/validationSchemas';
import { FormTextarea, FormSelect, FormSubmitButton, FormCancelButton } from '../components/FormComponents';
import MaterialDatePicker from '../components/MaterialDatePicker';
import dayjs from 'dayjs';

interface Patient {
  _id: string;
  patientId: string;
  name: string;
  age: number;
  sex: string;
  phone: string;
}

const NewPrescription: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isFollowUp, setIsFollowUp] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const getInitialValues = () => {
    const followUp = searchParams.get('followUp') === 'true';
    const originalPrescriptionCode = searchParams.get('originalPrescriptionCode');
    const originalPrescriptionId = searchParams.get('originalPrescriptionId');
    
    return {
      patientId: selectedPatient?._id || '',
      symptoms: '',
      prescription: '',
      nextFollowUp: '',
      notes: followUp ? `Follow-up prescription${originalPrescriptionCode ? ` (Original: ${originalPrescriptionCode})` : originalPrescriptionId ? ` (Original: ${originalPrescriptionId})` : ''}` : ''
    };
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    setFilteredPatients(patients);
  }, [patients]);

  // Handle URL parameters for follow-up prescriptions
  useEffect(() => {
    const patientObjectId = searchParams.get('patientObjectId'); // MongoDB object ID for API calls
    const patientId = searchParams.get('patientId'); // Human-readable patient ID
    const patientName = searchParams.get('patientName');
    const patientAge = searchParams.get('patientAge');
    const patientPhone = searchParams.get('patientPhone');
    const followUp = searchParams.get('followUp');
    const originalPrescriptionId = searchParams.get('originalPrescriptionId');

    if (followUp === 'true' && patientObjectId && patientName) {
      setIsFollowUp(true);
      
      // Create a patient object from URL params
      const preSelectedPatient: Patient = {
        _id: patientObjectId, // Use object ID for API calls
        patientId: patientId || patientObjectId, // Use human-readable ID if available
        name: patientName,
        age: parseInt(patientAge || '0'),
        sex: 'Unknown', // We don't have this in URL params
        phone: patientPhone || ''
      };
      
      setSelectedPatient(preSelectedPatient);
      setSearchTerm(patientName);
      setShowDropdown(false);
    }
  }, [searchParams, patients]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setShowDropdown(true);
    setHighlightedIndex(-1);
    
    if (!value.trim()) {
      setFilteredPatients(patients);
      return;
    }

    const filtered = patients.filter(patient => 
      patient.name.toLowerCase().includes(value.toLowerCase()) ||
      patient.patientId.toLowerCase().includes(value.toLowerCase()) ||
      patient.phone.includes(value)
    );
    setFilteredPatients(filtered);
  };

  const handleKeyDown = (e: React.KeyboardEvent, setFieldValue: any) => {
    if (!showDropdown || filteredPatients.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredPatients.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredPatients.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handlePatientSelect(filteredPatients[highlightedIndex], setFieldValue);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handlePatientSelect = (patient: Patient, setFieldValue: any) => {
    setSelectedPatient(patient);
    setSearchTerm(`${patient.name} (${patient.patientId})`);
    setShowDropdown(false);
    setFieldValue('patientId', patient._id);
  };

  const handleClearSelection = (setFieldValue: any) => {
    setSelectedPatient(null);
    setSearchTerm('');
    setFieldValue('patientId', '');
    setShowDropdown(false);
    setHighlightedIndex(-1);
  };

  const fetchPatients = async () => {
    try {
      const response = await api.get('/patients');
      setPatients(response.data.patients);
    } catch (err: any) {
      setError('No Patients Found');
    }
  };

  const handleSubmit = async (values: any) => {
    setError('');

    try {
      const prescriptionData = {
        patientId: values.patientId,
        symptoms: values.symptoms,
        prescription: values.prescription,
        nextFollowUp: values.nextFollowUp ? new Date(values.nextFollowUp).toISOString() : null,
        notes: values.notes
      };

      const response = await api.post('/prescriptions', prescriptionData);
      
      // Show success message
      SweetAlert.prescriptionCreated(response.data.prescription.prescriptionId);
      
      // Navigate to prescription view
      navigate(`/prescriptions/${response.data.prescription._id}`);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to create prescription';
      setError(errorMsg);
      SweetAlert.error('Failed to Create Prescription', errorMsg);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      
      
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center gap-4 mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {searchParams.get('followUp') === 'true' ? 'New Follow-up Prescription' : 'New Prescription'}
            </h1>
            {searchParams.get('followUp') === 'true' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                Follow-up
              </span>
            )}
          </div>
          
          {searchParams.get('followUp') === 'true' && searchParams.get('originalPrescriptionId') && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-blue-800">
                  Follow-up Prescription
                </span>
              </div>
              <div className="text-xs text-blue-700 space-y-1">
                <div>Patient: {searchParams.get('patientName')} (ID: {searchParams.get('patientId')})</div>
                <div>Original Prescription: {searchParams.get('originalPrescriptionCode') || searchParams.get('originalPrescriptionId')}</div>
              </div>
            </div>
          )}
          
          <Formik
            initialValues={getInitialValues()}
            validationSchema={prescriptionSchema}
            onSubmit={handleSubmit}
            validateOnChange={true}
            validateOnBlur={true}
          >
            {({ isSubmitting, isValid, setFieldValue, values }) => (
              <Form className="space-y-8">
                {/* Patient Selection */}
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Patient Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="relative" ref={dropdownRef}>
                      <label className="form-label">
                        Select Patient <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => handleSearchChange(e.target.value)}
                          onFocus={() => setShowDropdown(true)}
                          onKeyDown={(e) => handleKeyDown(e, setFieldValue)}
                          placeholder="Search by name, patient ID, or mobile number..."
                          className="form-input pr-10"
                        />
                        {searchTerm && (
                          <button
                            type="button"
                            onClick={() => handleClearSelection(setFieldValue)}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                      
                      {/* Selected patient info */}
                      {selectedPatient && !showDropdown && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                          <div className="text-sm text-green-800">
                            Selected: <span className="font-medium">{selectedPatient.name}</span> (ID: {selectedPatient.patientId})
                          </div>
                        </div>
                      )}
                      
                      {showDropdown && filteredPatients.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                          {filteredPatients.map((patient, index) => (
                            <div
                              key={patient._id}
                              onClick={() => handlePatientSelect(patient, setFieldValue)}
                              className={`px-4 py-2 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                                index === highlightedIndex ? 'bg-blue-50' : 'hover:bg-gray-100'
                              }`}
                            >
                              <div className="font-medium text-gray-900">{patient.name}</div>
                              <div className="text-sm text-gray-500">
                                ID: {patient.patientId} | {patient.age} years, {patient.sex} | {patient.phone}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {showDropdown && filteredPatients.length === 0 && searchTerm && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-4">
                          <div className="text-gray-500 text-center">No patients found</div>
                        </div>
                      )}
                    </div>
                    
                    {/* Hidden field for Formik validation */}
                    <Field name="patientId">
                      {({ field, form }: any) => (
                        <>
                          <input type="hidden" {...field} />
                          {form.errors.patientId && form.touched.patientId && (
                            <div className="text-red-500 text-sm mt-1">{form.errors.patientId}</div>
                          )}
                        </>
                      )}
                    </Field>
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
                      placeholder="Describe the patient's symptoms..."
                      required
                    />
                    
                    <FormTextarea
                      name="prescription"
                      label="Prescription"
                      rows={6}
                      placeholder="Enter medicines and instructions..."
                      required
                    />
                    
                    <Field name="nextFollowUp">
                      {({ field, form }: any) => (
                        <MaterialDatePicker
                          label="Next Follow-Up Date"
                          value={field.value}
                          onChange={(date) => form.setFieldValue('nextFollowUp', date)}
                          onBlur={() => form.setFieldTouched('nextFollowUp', true)}
                          error={form.errors.nextFollowUp && form.touched.nextFollowUp ? form.errors.nextFollowUp : ''}
                          minDate={dayjs()}
                          maxDate={dayjs().add(1, 'year')}
                          placeholder="Select follow-up date"
                        />
                      )}
                    </Field>
                    
                    <FormTextarea
                      name="notes"
                      label="Additional Notes"
                      rows={3}
                      placeholder="Any additional notes..."
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
                    Create Prescription
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

export default NewPrescription;
