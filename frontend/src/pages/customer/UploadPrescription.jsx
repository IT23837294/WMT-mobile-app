import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import AdminPageHeader from '../../components/AdminPageHeader';

const UploadPrescription = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    if (!selectedFile) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Please upload a valid image (JPEG, JPG, PNG) or PDF file');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setFile(selectedFile);
    setError('');

    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('prescription', file);

    try {
      await axios.post('/api/prescriptions/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/customer/prescriptions');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload prescription');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Prescription Uploaded Successfully!
          </h2>
          <p className="text-gray-600 mb-6">
            Our pharmacists will review your prescription shortly. You will be notified once it is ready.
          </p>
          <button
            onClick={() => navigate('/customer/prescriptions')}
            className="btn-primary"
          >
            View My Prescriptions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <AdminPageHeader
        title="Upload Prescription"
        subtitle="Submit a clear prescription image or PDF so the PharmaCare pharmacist team can validate and prepare your order safely."
        eyebrow="PharmaCare Customer"
        icon={Upload}
      />

      <div className="card">
        {error && (
          <div className="mb-6 flex items-center rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            <AlertCircle className="mr-2 h-5 w-5" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center transition-colors hover:border-medical-500">
            <input
              type="file"
              id="prescription"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {preview ? (
              <div className="mb-4">
                <img
                  src={preview}
                  alt="Prescription preview"
                  className="mx-auto max-h-64 rounded-lg shadow-md"
                />
              </div>
            ) : file ? (
              <div className="mb-4">
                <div className="inline-flex items-center space-x-2 rounded-lg bg-gray-100 p-4">
                  <FileText className="h-8 w-8 text-gray-600" />
                  <span className="text-gray-700">{file.name}</span>
                </div>
              </div>
            ) : (
              <label htmlFor="prescription" className="block cursor-pointer">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-medical-50">
                  <Upload className="h-8 w-8 text-medical-600" />
                </div>
                <p className="mb-2 text-lg font-medium text-gray-900">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-gray-500">
                  JPEG, JPG, PNG or PDF (max 5MB)
                </p>
              </label>
            )}

            {file && (
              <div className="mt-4">
                <label
                  htmlFor="prescription"
                  className="cursor-pointer text-sm font-medium text-medical-600 hover:text-medical-700"
                >
                  Choose a different file
                </label>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h4 className="mb-2 font-medium text-blue-900">Important Guidelines:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
              <li>Ensure the prescription is clear and readable.</li>
              <li>Include all pages if the prescription has multiple pages.</li>
              <li>Make sure the doctor&apos;s signature and stamp are visible.</li>
              <li>Prescription should not be expired.</li>
            </ul>
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => navigate('/customer/dashboard')}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !file}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {loading ? 'Uploading...' : 'Upload Prescription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadPrescription;
