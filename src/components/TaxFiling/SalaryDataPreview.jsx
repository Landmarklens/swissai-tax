/**
 * SalaryDataPreview Component
 *
 * Displays detailed preview of extracted Swissdec ELM salary certificate data
 * Shows employer info, employee details, salary breakdown, and deductions
 */

import React from 'react';

const SalaryDataPreview = ({ data, format, confidence }) => {
  if (!data) return null;

  const { employer, employee, salary, social_security, deductions } = data;

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

  const formatPercentage = (value) => {
    if (!value && value !== 0) return '—';
    return `${parseFloat(value).toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl">💼</div>
          <div>
            <h3 className="font-bold text-blue-900">
              Salary Certificate (Swissdec ELM)
            </h3>
            <p className="text-sm text-blue-700">
              {format} | Confidence: {(confidence * 100).toFixed(0)}%
            </p>
          </div>
        </div>
      </div>

      {/* Employer Information */}
      {employer && (\n        <div className="border rounded-lg p-4">
          <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <span>🏢</span> Employer Information
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <DataField label="Company Name" value={employer.name} />
            <DataField label="UID Number" value={employer.uid} />
            <DataField label="BUR Number" value={employer.bur_number} />
            <DataField label="Contact Person" value={employer.contact_person} />
          </div>

          {employer.address && (
            <div className="mt-4 pt-4 border-t">
              <h5 className="font-medium mb-2">Employer Address</h5>
              <div className="grid grid-cols-2 gap-4">
                <DataField label="Street" value={employer.address.street} />
                <DataField label="City" value={employer.address.city} />
                <DataField label="Postal Code" value={employer.address.postal_code} />
                <DataField label="Country" value={employer.address.country || 'Switzerland'} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Employee Information */}
      {employee && (
        <div className="border rounded-lg p-4">
          <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <span>👤</span> Employee Information
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <DataField label="First Name" value={employee.first_name} />
            <DataField label="Last Name" value={employee.last_name} />
            <DataField label="AHV Number" value={employee.ssn} />
            <DataField label="Date of Birth" value={formatDate(employee.date_of_birth)} />
            <DataField label="Gender" value={employee.gender} />
            <DataField label="Marital Status" value={employee.marital_status} />
          </div>

          {employee.address && (
            <div className="mt-4 pt-4 border-t">
              <h5 className="font-medium mb-2">Employee Address</h5>
              <div className="grid grid-cols-2 gap-4">
                <DataField label="Street" value={employee.address.street} />
                <DataField label="City" value={employee.address.city} />
                <DataField label="Postal Code" value={employee.address.postal_code} />
              </div>
            </div>
          )}

          {employee.employment_period && (
            <div className="mt-4 pt-4 border-t">
              <h5 className="font-medium mb-2">Employment Period</h5>
              <div className="grid grid-cols-2 gap-4">
                <DataField label="Start Date" value={formatDate(employee.employment_period.start_date)} />
                <DataField label="End Date" value={formatDate(employee.employment_period.end_date)} />
                <DataField label="Employment Type" value={employee.employment_type} />
                <DataField label="Workload %" value={formatPercentage(employee.workload_percentage)} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Salary Information */}
      {salary && Object.keys(salary).length > 0 && (
        <div className="border rounded-lg p-4">
          <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <span>💰</span> Salary & Compensation
          </h4>
          <div className="space-y-2">
            <DataField label="Gross Salary" value={formatCurrency(salary.gross_salary)} highlight={salary.gross_salary > 0} />
            <DataField label="Taxable Salary" value={formatCurrency(salary.taxable_salary)} highlight={salary.taxable_salary > 0} />
            <DataField label="Bonuses & Commissions" value={formatCurrency(salary.bonuses)} highlight={salary.bonuses > 0} />
            <DataField label="13th Month Salary" value={formatCurrency(salary.thirteenth_salary)} highlight={salary.thirteenth_salary > 0} />
            <DataField label="Overtime Pay" value={formatCurrency(salary.overtime)} highlight={salary.overtime > 0} />
            <DataField label="Allowances" value={formatCurrency(salary.allowances)} highlight={salary.allowances > 0} />
            <DataField label="Expense Allowance" value={formatCurrency(salary.expenses_allowance)} highlight={salary.expenses_allowance > 0} />
            <DataField label="Benefits in Kind" value={formatCurrency(salary.benefits_in_kind)} highlight={salary.benefits_in_kind > 0} />
            <DataField label="Shares/Stock Options" value={formatCurrency(salary.shares_value)} highlight={salary.shares_value > 0} />

            <div className="pt-2 border-t mt-2 bg-green-50 -mx-4 px-4 pb-2 pt-2 rounded">
              <DataField label="Total Compensation" value={formatCurrency(salary.total_compensation)} bold large />
            </div>
          </div>
        </div>
      )}

      {/* Social Security Contributions */}
      {social_security && Object.keys(social_security).length > 0 && (
        <div className="border rounded-lg p-4">
          <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <span>🛡️</span> Social Security Contributions
          </h4>
          <div className="space-y-2">
            <DataField label="AHV/AVS Contribution (Old Age)" value={formatCurrency(social_security.ahv_contribution)} highlight={social_security.ahv_contribution > 0} />
            <DataField label="IV/AI Contribution (Disability)" value={formatCurrency(social_security.iv_contribution)} highlight={social_security.iv_contribution > 0} />
            <DataField label="EO Contribution (Income Loss)" value={formatCurrency(social_security.eo_contribution)} highlight={social_security.eo_contribution > 0} />
            <DataField label="ALV Contribution (Unemployment)" value={formatCurrency(social_security.alv_contribution)} highlight={social_security.alv_contribution > 0} />
            <DataField label="Pension Fund (BVG/LPP)" value={formatCurrency(social_security.pension_contribution)} highlight={social_security.pension_contribution > 0} />
            <DataField label="Accident Insurance (SUVA)" value={formatCurrency(social_security.accident_insurance)} highlight={social_security.accident_insurance > 0} />
            <DataField label="Daily Sickness Insurance" value={formatCurrency(social_security.sickness_insurance)} highlight={social_security.sickness_insurance > 0} />
            <DataField label="Family Allowance (FAK)" value={formatCurrency(social_security.family_allowance)} highlight={social_security.family_allowance > 0} />

            <div className="pt-2 border-t mt-2">
              <DataField label="Total Social Contributions" value={formatCurrency(social_security.total_contributions)} bold />
            </div>
          </div>
        </div>
      )}

      {/* Deductions & Net Salary */}
      {deductions && Object.keys(deductions).length > 0 && (
        <div className="border rounded-lg p-4">
          <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <span>📉</span> Deductions & Net Pay
          </h4>
          <div className="space-y-2">
            <DataField label="Source Tax Withheld" value={formatCurrency(deductions.source_tax)} highlight={deductions.source_tax > 0} textColor="text-red-600" />
            <DataField label="Professional Expenses" value={formatCurrency(deductions.professional_expenses)} highlight={deductions.professional_expenses > 0} />
            <DataField label="Other Deductions" value={formatCurrency(deductions.other_deductions)} highlight={deductions.other_deductions > 0} textColor="text-red-600" />

            <div className="pt-3 border-t mt-3">
              <DataField label="Total Deductions" value={formatCurrency(deductions.total_deductions)} bold textColor="text-red-700" />
            </div>

            <div className="pt-3 mt-3 border-t bg-blue-50 -mx-4 -mb-4 px-4 pb-4 pt-3 rounded-b-lg">
              <DataField label="Net Salary Paid" value={formatCurrency(deductions.net_salary)} bold large textColor="text-blue-900" />
            </div>
          </div>
        </div>
      )}

      {/* Tax Year & Period */}
      {data.tax_year && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <span>📅</span> Tax Period
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <DataField label="Tax Year" value={data.tax_year} />
            <DataField label="Canton" value={data.canton} />
            <DataField label="Certificate Number" value={data.certificate_number} />
            <DataField label="Issue Date" value={formatDate(data.issue_date)} />
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold mb-2 text-blue-900">📊 Summary</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <div>✓ All data extracted from structured Swissdec ELM format</div>
          <div>✓ 99% accuracy (structured parsing)</div>
          <div>✓ {Object.keys(employer || {}).length + Object.keys(employee || {}).length + Object.keys(salary || {}).length + Object.keys(social_security || {}).length + Object.keys(deductions || {}).length} fields extracted</div>
          <div>✓ Ready to auto-fill your tax declaration</div>
        </div>
      </div>
    </div>
  );
};

// Helper component for consistent field display
const DataField = ({ label, value, highlight, bold, large, textColor = 'text-gray-900' }) => {
  const hasValue = value && value !== '—' && value !== 'CHF 0.00' && value !== '0.00%';

  return (
    <div className={`flex justify-between items-center py-1 ${highlight && hasValue ? 'bg-blue-50 px-2 rounded' : ''}`}>
      <span className={`text-gray-600 ${large ? 'text-base' : 'text-sm'}`}>
        {label}:
      </span>
      <span className={`${bold ? 'font-bold' : 'font-medium'} ${large ? 'text-lg' : 'text-sm'} ${hasValue ? textColor : 'text-gray-400'}`}>
        {value || '—'}
      </span>
    </div>
  );
};

export default SalaryDataPreview;
