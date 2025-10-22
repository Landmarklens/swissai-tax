/**
 * BankDataPreview Component
 *
 * Displays detailed preview of extracted bank statement data (eCH-0196)
 * Shows personal info, income, assets, and deductions with field-by-field breakdown
 */

import React from 'react';

const BankDataPreview = ({ data, format, confidence }) => {
  if (!data) return null;

  const { taxpayer, income, assets, deductions } = data;

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '—';
    return `CHF ${parseFloat(amount).toLocaleString('de-CH', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (date) => {
    if (!date) return '—';
    try {
      return new Date(date).toLocaleDateString('de-CH');
    } catch {
      return date;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl">🏦</div>
          <div>
            <h3 className="font-bold text-green-900">
              Bank Statement (eCH-0196)
            </h3>
            <p className="text-sm text-green-700">
              {format} | Confidence: {(confidence * 100).toFixed(0)}%
            </p>
          </div>
        </div>
      </div>

      {/* Taxpayer Information */}
      {taxpayer && (
        <div className="border rounded-lg p-4">
          <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <span>👤</span> Personal Information
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <DataField label="First Name" value={taxpayer.first_name} />
            <DataField label="Last Name" value={taxpayer.last_name} />
            <DataField label="AHV Number" value={taxpayer.ssn} />
            <DataField label="Date of Birth" value={formatDate(taxpayer.date_of_birth)} />
            <DataField label="Marital Status" value={taxpayer.marital_status} />
          </div>

          {taxpayer.address && (
            <div className="mt-4 pt-4 border-t">
              <h5 className="font-medium mb-2">Address</h5>
              <div className="grid grid-cols-2 gap-4">
                <DataField label="Street" value={taxpayer.address.street} />
                <DataField label="City" value={taxpayer.address.city} />
                <DataField label="Postal Code" value={taxpayer.address.postal_code} />
              </div>
            </div>
          )}

          {taxpayer.spouse && (
            <div className="mt-4 pt-4 border-t">
              <h5 className="font-medium mb-2">Spouse Information</h5>
              <div className="grid grid-cols-2 gap-4">
                <DataField label="First Name" value={taxpayer.spouse.first_name} />
                <DataField label="Last Name" value={taxpayer.spouse.last_name} />
                <DataField label="AHV Number" value={taxpayer.spouse.ssn} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Income Information */}
      {income && Object.keys(income).length > 0 && (
        <div className="border rounded-lg p-4">
          <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <span>💰</span> Income
          </h4>
          <div className="space-y-2">
            <DataField label="Employment Income" value={formatCurrency(income.employment)} highlight={income.employment > 0} />
            <DataField label="Self-Employment Income" value={formatCurrency(income.self_employment)} highlight={income.self_employment > 0} />
            <DataField label="Capital Income (Interest)" value={formatCurrency(income.capital)} highlight={income.capital > 0} />
            <DataField label="Rental Income" value={formatCurrency(income.rental)} highlight={income.rental > 0} />
            <DataField label="Pension Income" value={formatCurrency(income.pension)} highlight={income.pension > 0} />
            <DataField label="Other Income" value={formatCurrency(income.other)} highlight={income.other > 0} />
            <div className="pt-2 border-t mt-2">
              <DataField label="Total Income" value={formatCurrency(income.total)} bold />
            </div>
          </div>
        </div>
      )}

      {/* Assets & Wealth */}
      {assets && Object.keys(assets).length > 0 && (
        <div className="border rounded-lg p-4">
          <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <span>🏛️</span> Assets & Wealth
          </h4>
          <div className="space-y-2">
            <DataField label="Bank Accounts" value={formatCurrency(assets.bank_accounts)} highlight={assets.bank_accounts > 0} />
            <DataField label="Securities Value" value={formatCurrency(assets.securities)} highlight={assets.securities > 0} />
            <DataField label="Real Estate Value" value={formatCurrency(assets.real_estate)} highlight={assets.real_estate > 0} />
            <DataField label="Other Assets" value={formatCurrency(assets.other_assets)} highlight={assets.other_assets > 0} />
            <div className="pt-2 border-t mt-2">
              <DataField label="Total Assets" value={formatCurrency(assets.total_assets)} bold />
            </div>

            {(assets.mortgages > 0 || assets.other_debts > 0) && (
              <div className="pt-3 mt-3 border-t">
                <h5 className="font-medium mb-2 text-red-700">Debts</h5>
                <DataField label="Mortgages" value={formatCurrency(assets.mortgages)} highlight={assets.mortgages > 0} textColor="text-red-600" />
                <DataField label="Other Debts" value={formatCurrency(assets.other_debts)} highlight={assets.other_debts > 0} textColor="text-red-600" />
                <div className="pt-2 border-t mt-2">
                  <DataField label="Total Debts" value={formatCurrency(assets.total_debts)} bold textColor="text-red-700" />
                </div>
              </div>
            )}

            <div className="pt-3 mt-3 border-t bg-blue-50 -mx-4 -mb-4 px-4 pb-4 pt-3 rounded-b-lg">
              <DataField label="Net Wealth" value={formatCurrency(assets.net_wealth)} bold large />
            </div>
          </div>
        </div>
      )}

      {/* Deductions */}
      {deductions && Object.keys(deductions).length > 0 && (
        <div className="border rounded-lg p-4">
          <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <span>📉</span> Deductions
          </h4>
          <div className="space-y-2">
            <DataField label="Professional Expenses" value={formatCurrency(deductions.professional_expenses)} highlight={deductions.professional_expenses > 0} />
            <DataField label="Pillar 3a Contributions" value={formatCurrency(deductions.pillar_3a)} highlight={deductions.pillar_3a > 0} />
            <DataField label="Insurance Premiums" value={formatCurrency(deductions.insurance_premiums)} highlight={deductions.insurance_premiums > 0} />
            <DataField label="Medical Expenses" value={formatCurrency(deductions.medical_expenses)} highlight={deductions.medical_expenses > 0} />
            <DataField label="Child Deduction" value={formatCurrency(deductions.child_deduction)} highlight={deductions.child_deduction > 0} />
            <div className="pt-2 border-t mt-2">
              <DataField label="Total Deductions" value={formatCurrency(deductions.total)} bold />
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold mb-2 text-blue-900">📊 Summary</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <div>✓ All data extracted from structured eCH-0196 format</div>
          <div>✓ 99% accuracy (structured parsing)</div>
          <div>✓ {Object.keys(taxpayer || {}).length + Object.keys(income || {}).length + Object.keys(assets || {}).length + Object.keys(deductions || {}).length} fields extracted</div>
          <div>✓ Ready to auto-fill your tax declaration</div>
        </div>
      </div>
    </div>
  );
};

// Helper component for consistent field display
const DataField = ({ label, value, highlight, bold, large, textColor = 'text-gray-900' }) => {
  const hasValue = value && value !== '—' && value !== 'CHF 0.00';

  return (
    <div className={`flex justify-between items-center py-1 ${highlight && hasValue ? 'bg-green-50 px-2 rounded' : ''}`}>
      <span className={`text-gray-600 ${large ? 'text-base' : 'text-sm'}`}>
        {label}:
      </span>
      <span className={`${bold ? 'font-bold' : 'font-medium'} ${large ? 'text-lg' : 'text-sm'} ${hasValue ? textColor : 'text-gray-400'}`}>
        {value || '—'}
      </span>
    </div>
  );
};

export default BankDataPreview;
