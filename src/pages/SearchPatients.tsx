import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { SweetAlert } from '../utils/SweetAlert';
import Navbar from '../components/Navbar';

interface Patient {
  _id: string;
  patientId: string;
  name: string;
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
    allergies?: string;
    chronicIllnesses?: string;
    pastSurgeries?: string;
    medications?: string;
    additionalNotes?: string;
  };
  createdAt: string;
}

interface Prescription {
  _id: string;
  prescriptionId: string;
  symptoms: string;
  prescription: string;
  nextFollowUp?: string;
  createdAt: string;
}

const SearchPatients: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [allPatients, setAllPatients] = useState<Patient[]>([]); // Store all patients for local filtering
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Helper function to get patient photo URL
  const getPatientPhotoUrl = (patient: Patient): string => {
    console.log('Patient data:', {
      name: patient.name,
      photo: patient.photo,
      hasPhoto: !!patient.photo
    }); // Debug log
    
    if (!patient.photo) {
      console.log('No photo, using fallback avatar for:', patient.name);
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.name)}&background=0d6efd&color=fff&size=80`;
    }
    
    // Try both approaches - first the direct uploads path, then the custom endpoint
    const directUrl = `http://localhost:5000/${patient.photo}`;
    console.log('Generated direct URL:', directUrl);
    
    return directUrl;
  };

  // Load all patients on component mount
  useEffect(() => {
    handleViewAllPatients();
  }, []);

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Real-time search effect
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setPatients(allPatients);
      setIsSearching(false);
      return;
    }

    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for debounced search
    setIsSearching(true);
    const timeout = setTimeout(() => {
      performSearch(searchQuery);
    }, 300); // 300ms debounce

    setSearchTimeout(timeout);
  }, [searchQuery, allPatients]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.getElementById('patient-search') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
      
      if (e.key === 'Escape') {
        const searchInput = document.getElementById('patient-search') as HTMLInputElement;
        if (selectedPatient && searchInput !== document.activeElement) {
          // Close patient details if open and search input is not focused
          handleClosePatientDetails();
        } else if (searchInput === document.activeElement) {
          searchInput.blur();
          if (searchQuery) {
            setSearchQuery('');
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [searchQuery, selectedPatient]);

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setPatients(allPatients);
      setIsSearching(false);
      return;
    }

    setError('');
    
    try {
      const response = await api.get(`/patients/search?query=${encodeURIComponent(query)}`);
      setPatients(response.data.patients);
      
      if (response.data.patients.length === 0) {
        SweetAlert.noSearchResults(query);
      }
    } catch (err: any) {
      console.error('Search error:', err);
      // Fallback to local search if API fails
      const localFiltered = allPatients.filter(patient => 
        patient.name.toLowerCase().includes(query.toLowerCase()) ||
        patient.patientId.toLowerCase().includes(query.toLowerCase()) ||
        patient.phone.toLowerCase().includes(query.toLowerCase())
      );
      setPatients(localFiltered);
      
      if (localFiltered.length === 0) {
        SweetAlert.noSearchResults(query);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a search term');
      return;
    }

    setIsSearching(true);
    await performSearch(searchQuery);
  };

  const handleViewAllPatients = async () => {
    setLoading(true);
    setError('');
    setSearchQuery('');
    
    try {
      const response = await api.get('/patients');
      setAllPatients(response.data.patients);
      setPatients(response.data.patients);
      
      if (response.data.patients.length === 0) {
        setError('No patients found');
      }
    } catch (err: any) {
      setError('No Patients Found');
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = async (patient: Patient) => {
    setSelectedPatient(patient);
    setLoading(true);
    
    try {
      const response = await api.get(`/prescriptions/patient/${patient._id}`);
      setPrescriptions(response.data.prescriptions);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error fetching patient history');
    } finally {
      setLoading(false);
    }
  };

  const handleClosePatientDetails = () => {
    setSelectedPatient(null);
    setPrescriptions([]);
  };

  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => {
      if (part.toLowerCase() === searchTerm.toLowerCase()) {
        return <mark key={index} className="bg-yellow-200 font-semibold">{part}</mark>;
      }
      return part;
    });
  };

  const handleDeletePatient = async (patientId: string, patientName: string) => {
    const result = await SweetAlert.confirmDelete(patientName);
    if (!result.isConfirmed) {
      return;
    }

    setDeleting(patientId);
    setError('');

    try {
      await api.delete(`/patients/${patientId}`);
      
      // Remove patient from both lists
      setPatients(patients.filter(p => p._id !== patientId));
      setAllPatients(allPatients.filter(p => p._id !== patientId));
      
      // Clear selected patient if it was deleted
      if (selectedPatient?._id === patientId) {
        setSelectedPatient(null);
        setPrescriptions([]);
      }
      
      // Show success message
      SweetAlert.success('Patient Deleted', `Patient "${patientName}" has been deleted successfully.`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error deleting patient');
      SweetAlert.error('Delete Failed', err.response?.data?.message || 'Error deleting patient');
    } finally {
      setDeleting(null);
    }
  };

  const handleEditPatient = (patientId: string) => {
    navigate(`/patients/edit/${patientId}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Search Patient History</h1>
          
          {/* Search Bar */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <div className="flex space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    id="patient-search"
                    type="text"
                    placeholder="Search by patient name, ID, or phone number... (Ctrl+F to focus, Esc to clear)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    autoComplete="off"
                  />
                  {isSearching && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {searchQuery ? (
                      <>
                        <span className="font-medium">{patients.length}</span> patient{patients.length !== 1 ? 's' : ''} found
                        <span> for "<span className="font-medium">{searchQuery}</span>"</span>
                      </>
                    ) : (
                      <>
                        Showing <span className="font-medium">{patients.length}</span> of <span className="font-medium">{allPatients.length}</span> total patients
                      </>
                    )}
                  </div>
                  <div className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    Total: {allPatients.length} patients
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  Search by patient name, ID, or phone number • Real-time search enabled
                </div>
              </div>
              <button
                onClick={handleSearch}
                disabled={loading || isSearching}
                className="btn btn-primary"
              >
                Search
              </button>
              <button
                onClick={handleViewAllPatients}
                disabled={loading || isSearching}
                className="btn btn-secondary"
              >
                {loading ? 'Loading...' : 'View All Patients'}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-8">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <div className={`grid grid-cols-1 gap-8 ${selectedPatient ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
            {/* Search Results */}
            <div className={`bg-white shadow rounded-lg ${selectedPatient ? 'lg:col-span-1' : 'lg:col-span-1'}`}>
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Search Results</h3>
                
                {patients.length > 0 ? (
                  <div className="space-y-4">
                    {patients.map((patient) => (
                      <div
                        key={patient._id}
                        className={`${selectedPatient ? 'p-2' : 'p-4'} rounded-lg border transition-colors ${
                          selectedPatient?._id === patient._id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div 
                            className={`flex items-center ${selectedPatient ? 'space-x-2' : 'space-x-4'} flex-1 cursor-pointer`}
                            onClick={() => handlePatientSelect(patient)}
                          >
                            <div className="flex-shrink-0">
                              {patient.photo ? (
                                <img
                                  className={`${selectedPatient ? 'h-8 w-8' : 'h-12 w-12'} rounded-full object-cover`}
                                  src={getPatientPhotoUrl(patient)}
                                  alt={patient.name}
                                  onLoad={() => console.log('✅ Image rendered successfully for:', patient.name)}
                                  onError={(e) => {
                                    console.error('❌ Image failed to render for:', patient.name, 'URL:', e.currentTarget.src);
                                    // Fallback to avatar if image fails to load
                                    const target = e.target as HTMLImageElement;
                                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.name)}&background=0d6efd&color=fff&size=80`;
                                  }}
                                />
                              ) : (
                                <div className={`${selectedPatient ? 'h-8 w-8' : 'h-12 w-12'} rounded-full bg-gray-300 flex items-center justify-center`}>
                                  <span className={`${selectedPatient ? 'text-sm' : 'text-lg'} font-medium text-gray-600`}>
                                    {patient.name.charAt(0)}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className={`${selectedPatient ? 'text-sm' : 'text-lg'} font-medium text-gray-900 truncate`}>
                                {highlightSearchTerm(patient.name, searchQuery)}
                              </h4>
                              {!selectedPatient && (
                                <>
                                  <p className="text-sm text-gray-500">
                                    ID: {highlightSearchTerm(patient.patientId, searchQuery)} • Age: {patient.age} • {patient.sex}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    Phone: {highlightSearchTerm(patient.phone, searchQuery)}
                                  </p>
                                </>
                              )}
                              {selectedPatient && (
                                <p className="text-xs text-gray-500 truncate">
                                  ID: {highlightSearchTerm(patient.patientId, searchQuery)}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          {!selectedPatient && (
                            <div className="flex items-center space-x-2 ml-4">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditPatient(patient._id);
                                }}
                                className="btn btn-sm btn-secondary"
                                title="Edit Patient"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePatient(patient._id, patient.name);
                                }}
                                disabled={deleting === patient._id}
                                className="btn btn-sm bg-red-600 hover:bg-red-700 text-white disabled:bg-red-400"
                                title="Delete Patient"
                              >
                                {deleting === patient._id ? (
                                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          )}
                          {selectedPatient && selectedPatient._id === patient._id && (
                            <div className="flex items-center ml-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Selected
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-500">
                      {searchQuery 
                        ? `No patients found matching "${searchQuery}"`
                        : loading 
                          ? 'Loading patients...'
                          : 'Start typing to search for patients'
                      }
                    </p>
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Patient Details & History */}
            <div className={`bg-white shadow rounded-lg ${selectedPatient ? 'lg:col-span-2' : 'lg:col-span-1'}`}>
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Patient Details & History</h3>
                  {selectedPatient && (
                    <button
                      onClick={handleClosePatientDetails}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      title="Close patient details"
                    >
                      <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Close
                    </button>
                  )}
                </div>
                
                {selectedPatient ? (
                  <div className="space-y-6">
                    {/* Patient Info */}
                    <div className="border-b border-gray-200 pb-6">
                      <div className="flex items-center space-x-4 mb-4">
                        {selectedPatient.photo ? (
                          <img
                            className="h-16 w-16 rounded-full object-cover"
                            src={getPatientPhotoUrl(selectedPatient)}
                            alt={selectedPatient.name}
                            onLoad={() => console.log('✅ Large image rendered successfully for:', selectedPatient.name)}
                            onError={(e) => {
                              console.error('❌ Large image failed to render for:', selectedPatient.name, 'URL:', e.currentTarget.src);
                              // Fallback to avatar if image fails to load
                              const target = e.target as HTMLImageElement;
                              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedPatient.name)}&background=0d6efd&color=fff&size=80`;
                            }}
                          />
                        ) : (
                          <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-xl font-medium text-gray-600">
                              {selectedPatient.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div>
                          <h4 className="text-xl font-medium text-gray-900">{selectedPatient.name}</h4>
                          <p className="text-sm text-gray-500">
                            ID: {selectedPatient.patientId} • Age: {selectedPatient.age} • {selectedPatient.sex}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-900">Phone:</p>
                          <p className="text-gray-600">{selectedPatient.phone}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Emergency Contact:</p>
                          <p className="text-gray-600">
                            {selectedPatient.emergencyContact.name} ({selectedPatient.emergencyContact.relation})
                          </p>
                          <p className="text-gray-600">{selectedPatient.emergencyContact.phone}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <p className="font-medium text-gray-900">Address:</p>
                        <p className="text-gray-600">{selectedPatient.address}</p>
                      </div>
                    </div>

                    {/* Medical History */}
                    <div className="border-b border-gray-200 pb-6">
                      <h5 className="font-medium text-gray-900 mb-3">Medical History</h5>
                      <div className="space-y-2 text-sm">
                        {selectedPatient.medicalHistory.allergies && (
                          <div>
                            <p className="font-medium text-gray-900">Allergies:</p>
                            <p className="text-gray-600">{selectedPatient.medicalHistory.allergies}</p>
                          </div>
                        )}
                        {selectedPatient.medicalHistory.chronicIllnesses && (
                          <div>
                            <p className="font-medium text-gray-900">Chronic Illnesses:</p>
                            <p className="text-gray-600">{selectedPatient.medicalHistory.chronicIllnesses}</p>
                          </div>
                        )}
                        {selectedPatient.medicalHistory.pastSurgeries && (
                          <div>
                            <p className="font-medium text-gray-900">Past Surgeries:</p>
                            <p className="text-gray-600">{selectedPatient.medicalHistory.pastSurgeries}</p>
                          </div>
                        )}
                        {selectedPatient.medicalHistory.medications && (
                          <div>
                            <p className="font-medium text-gray-900">Medications:</p>
                            <p className="text-gray-600">{selectedPatient.medicalHistory.medications}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Prescription History */}
                    <div>
                      <h5 className="font-medium text-gray-900 mb-3">Prescription History</h5>
                      {prescriptions.length > 0 ? (
                        <div className="space-y-4">
                          {prescriptions.map((prescription) => (
                            <div key={prescription._id} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex justify-between items-start mb-2">
                                <h6 className="font-medium text-gray-900">{prescription.prescriptionId}</h6>
                                <span className="text-sm text-gray-500">
                                  {new Date(prescription.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="text-sm space-y-2">
                                <div>
                                  <p className="font-medium text-gray-900">Symptoms:</p>
                                  <p className="text-gray-600">{prescription.symptoms}</p>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">Prescription:</p>
                                  <p className="text-gray-600">{prescription.prescription}</p>
                                </div>
                                {prescription.nextFollowUp && (
                                  <div>
                                    <p className="font-medium text-gray-900">Next Follow-up:</p>
                                    <p className="text-gray-600">
                                      {new Date(prescription.nextFollowUp).toLocaleDateString()}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No prescriptions found for this patient.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-500">
                      Select a patient to view their details and history
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPatients;
