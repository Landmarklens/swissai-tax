/**
 * ImportDialog Component
 *
 * Modal dialog for uploading structured import documents (eCH-0196, Swissdec ELM).
 * Provides 4-step flow: Choose → Upload → Review → Confirm
 */

import React, { useState } from 'react';
import axios from 'axios';

const ImportDialog = ({ isOpen, onClose, onImportComplete, sessionId }) => {
  const [step, setStep] = useState(1); // 1=Choose, 2=Upload, 3=Review, 4=Confirm
  const [selectedType, setSelectedType] = useState(null); // 'bank' or 'salary'
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUploadAndPreview = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Call preview endpoint
      const response = await axios.post(
        '/api/documents/structured-import/preview',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setPreviewData(response.data);
      setStep(3); // Move to review step
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to process document');
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmImport = async () => {
    setProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (sessionId) {
        formData.append('session_id', sessionId);
      }

      // Call actual import endpoint
      const response = await axios.post(
        '/api/documents/structured-import',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Success! Close dialog and notify parent
      onImportComplete(response.data);
      handleClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to import document');
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setSelectedType(null);
    setFile(null);
    setPreviewData(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {step === 1 && 'Choose Document Type'}
            {step === 2 && 'Upload Document'}
            {step === 3 && 'Review Extracted Data'}
            {step === 4 && 'Import Complete'}
          </h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Choose Type */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-gray-600 mb-6">
                Select the type of document you want to import. Structured imports save up to 35 minutes by auto-filling your tax data.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {/* Bank Statement */}
                <button
                  onClick={() => {
                    setSelectedType('bank');
                    setStep(2);
                  }}
                  className="border-2 border-gray-300 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 transition text-left"
                >
                  <div className="text-3xl mb-2">🏦</div>
                  <h3 className="font-bold text-lg mb-2">Bank Statement</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    eCH-0196 electronic tax statement from your bank
                  </p>
                  <div className="text-xs text-gray-500">
                    <div>✓ Auto-fills 17 questions</div>
                    <div>✓ 99% accuracy</div>
                    <div>✓ Saves ~20 minutes</div>
                  </div>
                </button>

                {/* Salary Certificate */}
                <button
                  onClick={() => {
                    setSelectedType('salary');
                    setStep(2);
                  }}
                  className="border-2 border-gray-300 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 transition text-left"
                >
                  <div className="text-3xl mb-2">💼</div>
                  <h3 className="font-bold text-lg mb-2">Salary Certificate</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Swissdec ELM electronic salary certificate (Lohnausweis)
                  </p>
                  <div className="text-xs text-gray-500">
                    <div>✓ Auto-fills 15 questions</div>
                    <div>✓ 99% accuracy</div>
                    <div>✓ Saves ~15 minutes</div>
                  </div>
                </button>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>💡 Tip:</strong> Don't have these documents? You can still use regular PDF uploads with AI extraction (85% accuracy).
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Upload */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">
                  {selectedType === 'bank' ? '🏦 Bank Statement' : '💼 Salary Certificate'}
                </h4>
                <p className="text-sm text-gray-600">
                  {selectedType === 'bank'
                    ? 'Upload your eCH-0196 bank statement (PDF with barcode or XML)'
                    : 'Upload your Swissdec salary certificate (PDF or XML)'}
                </p>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept={selectedType === 'bank' ? '.pdf,.xml' : '.pdf,.xml'}
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer inline-block bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition"
                >
                  Choose File
                </label>
                {file && (
                  <div className="mt-4 text-sm text-gray-600">
                    Selected: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleUploadAndPreview}
                  disabled={!file || processing}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'Processing...' : 'Next'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && previewData && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">✓</span>
                  <div>
                    <h4 className="font-semibold text-green-800">
                      Successfully extracted {previewData.fields_count} fields
                    </h4>
                    <p className="text-sm text-green-700">
                      Format: {previewData.format} | Confidence: {(previewData.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
                <h4 className="font-semibold mb-3">Extracted Data:</h4>
                <div className="space-y-2 text-sm">
                  {Object.entries(previewData.tax_profile_mappings || {}).map(([key, value]) => (
                    <div key={key} className="flex justify-between border-b pb-2">
                      <span className="text-gray-600">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  ⏱️ Estimated time saved: <strong>{previewData.estimated_time_saved}</strong>
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Upload Different File
                </button>
                <button
                  onClick={handleConfirmImport}
                  disabled={processing}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                >
                  {processing ? 'Importing...' : 'Confirm Import'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportDialog;
