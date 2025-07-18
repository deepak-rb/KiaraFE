import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { SweetAlert } from '../utils/SweetAlert';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import { prescriptionSchema } from '../utils/validationSchemas';
import { FormTextarea, FormSelect, FormSubmitButton, FormCancelButton } from '../components/FormComponents';

interface Patient {
  _id: string;
  patientId: string;
  name: string;
  age: number;
  sex: string;
  phone: string;
}

interface Template {
  _id: string;
  name: string;
  symptoms: string;
  prescription: string;
  followUpDays: number;
}

const NewPrescription: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const initialValues = {
    patientId: '',
    symptoms: '',
    prescription: '',
    nextFollowUp: null as Date | null,
    notes: ''
  };

  useEffect(() => {
    fetchPatients();
    fetchTemplates();
  }, []);

  useEffect(() => {
    setFilteredPatients(patients);
  }, [patients]);

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

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/doctors/templates');
      setTemplates(response.data.templates);
    } catch (err: any) {
      console.error('Error fetching templates:', err);
    }
  };

  const handleTemplateSelect = (templateId: string, setFieldValue: any) => {
    if (templateId) {
      const template = templates.find(t => t._id === templateId);
      if (template) {
        setFieldValue('symptoms', template.symptoms);
        setFieldValue('prescription', template.prescription);
        
        // Set follow-up date if template has followUpDays
        if (template.followUpDays > 0) {
          const followUpDate = new Date();
          followUpDate.setDate(followUpDate.getDate() + template.followUpDays);
          setFieldValue('nextFollowUp', followUpDate);
        }
      }
    }
  };

  const handleSubmit = async (values: any) => {
    setError('');

    try {
      const prescriptionData = {
        patientId: values.patientId,
        symptoms: values.symptoms,
        prescription: values.prescription,
        nextFollowUp: values.nextFollowUp ? values.nextFollowUp.toISOString() : null,
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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">New Prescription</h1>
          
          <Formik
            initialValues={initialValues}
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
                    
                    <div>
                      <label className="form-label">Use Template (optional)</label>
                      <select
                        onChange={(e) => handleTemplateSelect(e.target.value, setFieldValue)}
                        className="form-select"
                      >
                        <option value="">Select a template</option>
                        {templates.map((template) => (
                          <option key={template._id} value={template._id}>
                            {template.name}
                          </option>
                        ))}
                      </select>
                    </div>
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
                        <div>
                          <label className="form-label">Next Follow-Up Date</label>
                          <DatePicker
                            selected={field.value}
                            onChange={(date) => form.setFieldValue('nextFollowUp', date)}
                            className="form-input"
                            placeholderText="Select follow-up date"
                            dateFormat="dd/MM/yyyy"
                            minDate={new Date()}
                          />
                        </div>
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
