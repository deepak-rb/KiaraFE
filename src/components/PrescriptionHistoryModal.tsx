import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
  status?: string;
  updatedAt?: string;
}

interface PrescriptionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  prescriptions: Prescription[];
}

const PrescriptionHistoryModal: React.FC<PrescriptionHistoryModalProps> = ({
  isOpen,
  onClose,
  patient,
  prescriptions
}) => {
  const navigate = useNavigate();
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);

  // Format status for display
  const getStatusDisplay = (prescription: Prescription) => {
    if (prescription.status === 'follow_up_completed') {
      return { label: 'Review Completed', color: 'bg-blue-100 text-blue-800' };
    } else if (prescription.nextFollowUp) {
      return { label: 'Review Pending', color: 'bg-orange-100 text-orange-800' };
    } else if (prescription.status === 'active') {
      return { label: 'Resolved', color: 'bg-green-100 text-green-800' };
    } else {
      return { label: 'Active', color: 'bg-gray-100 text-gray-800' };
    }
  };

  // Format date to DD-MMM-YYYY format
  const formatCompletedDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleEditPrescription = (prescriptionId: string) => {
    navigate(`/prescriptions/edit/${prescriptionId}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* Modal Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-lg">
          <h3 className="text-xl font-semibold text-gray-900">
            Prescription History - {patient?.name}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 flex overflow-hidden">
          {prescriptions.length > 0 ? (
            <>
              {/* Left Side - Prescription List */}
              <div className="w-1/3 border-r border-gray-200 bg-gray-50 overflow-y-auto">
                <div className="p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-4">
                    All Prescriptions ({prescriptions.length})
                  </h4>
                  <div className="space-y-2">
                    {prescriptions
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((prescription) => (
                      <div
                        key={prescription._id}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedPrescription?._id === prescription._id
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                        }`}
                        onClick={() => setSelectedPrescription(prescription)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <h6 className={`font-semibold text-sm truncate ${
                              selectedPrescription?._id === prescription._id
                                ? 'text-blue-900'
                                : 'text-gray-900'
                            }`}>
                              {prescription.prescriptionId}
                            </h6>
                            <p className={`text-xs mt-1 ${
                              selectedPrescription?._id === prescription._id
                                ? 'text-blue-600'
                                : 'text-gray-500'
                            }`}>
                              {new Date(prescription.createdAt).toLocaleDateString('en-GB')}
                            </p>
                            <div className="mt-2">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusDisplay(prescription).color}`}>
                                {prescription.status === 'follow_up_completed' 
                                  ? `Review Completed${prescription.updatedAt ? ` (${formatCompletedDate(prescription.updatedAt)})` : ''}`
                                  : getStatusDisplay(prescription).label}
                              </span>
                            </div>
                          </div>
                          {selectedPrescription?._id === prescription._id && (
                            <div className="flex-shrink-0 ml-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Side - Prescription Details */}
              <div className="flex-1 bg-white overflow-y-auto">
                {selectedPrescription ? (
                  <div className="h-full flex flex-col">
                    {/* Clean Header */}
                    <div className="border-b border-gray-100 p-8 pb-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          {/* Left Side - Hospital Information */}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              Kiara Clinic
                            </h3>
                            <p className="text-sm text-gray-500">Medical Center & Healthcare Services</p>
                          </div>
                        </div>
                        
                        <div className="flex-1 text-right">
                          {/* Right Side - RX and Date/Time */}
                          <div>
                            <h4 className="text-xl font-light text-gray-900 mb-2">
                              {selectedPrescription.prescriptionId}
                            </h4>
                            <p className="text-sm text-gray-400">
                              {new Date(selectedPrescription.createdAt).toLocaleDateString('en-GB')} • {' '}
                              {new Date(selectedPrescription.createdAt).toLocaleTimeString('en-GB', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          </div>
                        </div>
                        
                        <div className="ml-6">
                          <button
                            onClick={() => handleEditPrescription(selectedPrescription._id)}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
                          >
                            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 p-8 space-y-8">
                      {/* Main Content */}
                      <div className="space-y-6">
                        {/* Symptoms */}
                        <div>
                          <h5 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                            Chief Complaints
                          </h5>
                          <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-red-200">
                            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                              {selectedPrescription.symptoms}
                            </p>
                          </div>
                        </div>

                        {/* Prescription */}
                        <div>
                          <h5 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                            Treatment Plan
                          </h5>
                          <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-green-200">
                            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                              {selectedPrescription.prescription}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Meta Information */}
                      <div className="pt-6 border-t border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h6 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                              Patient
                            </h6>
                            <p className="text-gray-900 font-medium">{patient?.name}</p>
                            <p className="text-sm text-gray-500">{patient?.phone}</p>
                          </div>

                          <div>
                            <h6 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                              Created
                            </h6>
                            <p className="text-gray-900 font-medium">
                              {new Date(selectedPrescription.createdAt).toLocaleDateString('en-GB')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer - Next Follow-up */}
                    {selectedPrescription.nextFollowUp && (
                      <div className="border-t border-gray-100 px-8 py-4 bg-blue-50">
                        <div className="flex items-center justify-center">
                          <div className="text-center">
                            <h6 className="text-sm font-medium text-blue-900 mb-1">
                              Next Follow-up
                            </h6>
                            <p className="text-lg font-semibold text-blue-800">
                              {new Date(selectedPrescription.nextFollowUp).toLocaleDateString('en-GB')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h3 className="mt-4 text-lg font-medium text-gray-900">Select a Prescription</h3>
                      <p className="mt-2 text-gray-500">Choose a prescription from the left to view details</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No Prescriptions</h3>
                <p className="mt-2 text-gray-500">No prescription history found for this patient.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrescriptionHistoryModal;
