import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import api from '../utils/api';
import { SweetAlert } from '../utils/SweetAlert';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

interface Patient {
  _id: string;
  patientId: string;
  name: string;
  age: number;
  phone: string;
  address: string;
  photo?: string;
}

interface Doctor {
  _id: string;
  name: string;
  specialization: string;
  licenseNumber?: string;
  clinicName: string;
  clinicAddress: string;
  phone: string;
}

interface Prescription {
  _id: string;
  prescriptionId: string;
  patientId: Patient;
  doctorId: Doctor;
  symptoms: string;
  prescription: string;
  nextFollowUp?: string;
  digitalSignature?: string;
  notes?: string;
  createdAt: string;
}

const PrescriptionView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { doctor } = useAuth();
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('prescription-content');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`prescription-${prescription?.prescriptionId}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      SweetAlert.error('PDF Generation Failed', 'Error generating PDF. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        
        <div className="flex justify-center items-center h-64">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error || !prescription) {
    return (
      <div className="min-h-screen bg-gray-50">
        
        <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-600">{error || 'Prescription not found'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Action Buttons */}
          <div className="flex justify-between items-center mb-6 no-print">
            <h1 className="text-3xl font-bold text-gray-900">Prescription Details</h1>
            <div className="flex space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="btn btn-outline"
              >
                Back to Dashboard
              </button>
              <button
                onClick={handlePrint}
                className="btn btn-secondary"
              >
                Print
              </button>
              <button
                onClick={handleDownloadPDF}
                className="btn btn-primary"
              >
                Download PDF
              </button>
            </div>
          </div>

          {/* Prescription Content */}
          <div id="prescription-content" className="prescription-print">
            {/* Header */}
            <div className="prescription-header">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-blue-600">
                    {prescription.doctorId.clinicName}
                  </h2>
                  <p className="text-gray-600">{prescription.doctorId.clinicAddress}</p>
                  <p className="text-gray-600">Phone: {prescription.doctorId.phone}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Date: {new Date(prescription.createdAt).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-500">Prescription ID: {prescription.prescriptionId}</p>
                </div>
              </div>
            </div>

            {/* Doctor Information */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Dr. {prescription.doctorId.name}</h3>
              <p className="text-gray-600">{prescription.doctorId.specialization}</p>
              {prescription.doctorId.licenseNumber && (
                <p className="text-gray-600">{prescription.doctorId.licenseNumber}</p>
              )}
            </div>

            {/* Patient Information */}
            <div className="prescription-content">
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-900 mb-2">Patient Information</h4>
                <hr />
                <br />
                <div className="grid grid-cols-2 gap-4 text-left">
                  <div>
                    <p><strong>Name:</strong> {prescription.patientId.name}</p>
                    <p><strong>Age:</strong> {prescription.patientId.age} years</p>
                    <p><strong>Patient ID:</strong> {prescription.patientId.patientId}</p>
                  </div>
                  <div>
                    <p><strong>Phone:</strong> {prescription.patientId.phone}</p>
                    <p><strong>Address:</strong> {prescription.patientId.address}</p>
                  </div>
                </div>
              </div>
      <hr />
              {/* Symptoms */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-900 mb-2">Symptoms</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="whitespace-pre-wrap">{prescription.symptoms}</p>
                </div>
              </div>

              {/* Prescription */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-900 mb-2">Prescription</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="whitespace-pre-wrap">{prescription.prescription}</p>
                </div>
              </div>

              {/* Next Follow-up */}
              {prescription.nextFollowUp && (
                <div className="mb-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-2">Next Follow-up</h4>
                  <p className="text-lg">{new Date(prescription.nextFollowUp).toLocaleDateString()}</p>
                </div>
              )}

              {/* Additional Notes */}
              {prescription.notes && (
                <div className="mb-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-2">Additional Notes</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="whitespace-pre-wrap">{prescription.notes}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Signature */}
            <div className="signature-area">
              <div className="text-center">
                {doctor?.digitalSignature && (
                  <div className="mb-4">
                    <img
                      src={`http://localhost:5000/${doctor.digitalSignature}`}
                      alt="Digital Signature"
                      className="h-16 mx-auto"
                    />
                  </div>
                )}
                <div className="border-t border-gray-400 w-48 mx-auto mb-2"></div>
                <p className="text-sm font-medium">Dr. {prescription.doctorId.name}</p>
                <p className="text-xs text-gray-600">{prescription.doctorId.specialization}</p>
                {prescription.doctorId.licenseNumber && (
                  <p className="text-xs text-gray-600">{prescription.doctorId.licenseNumber}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionView;
