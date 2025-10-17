-- Update existing tax insights with proper subcategories based on titles

-- Personal Information
UPDATE swisstax.tax_insights
SET subcategory = 'personal'
WHERE title = 'Personal Information';

-- Location
UPDATE swisstax.tax_insights
SET subcategory = 'location'
WHERE title = 'Location';

-- Family/Kids
UPDATE swisstax.tax_insights
SET subcategory = 'kids'
WHERE title IN ('Family', 'Complete Children Question', 'Maximize Child Tax Credits and Deductions');

-- Employment
UPDATE swisstax.tax_insights
SET subcategory = 'employment'
WHERE title IN ('Employment', 'Complete Employment Question', 'Multiple Employer Deductions Available');

-- Retirement & Savings
UPDATE swisstax.tax_insights
SET subcategory = 'retirement_savings'
WHERE title IN ('Retirement & Savings', 'Complete Pillar 3a Question', 'Maximize Pillar 3a Contributions');

-- Property & Assets
UPDATE swisstax.tax_insights
SET subcategory = 'property_assets'
WHERE title IN ('Property & Assets', 'Complete Property Question', 'Property Owner Tax Deductions');

-- Deductions
UPDATE swisstax.tax_insights
SET subcategory = 'deductions'
WHERE title IN (
    'Deductions',
    'Complete Donation Question',
    'Charitable Donation Deductions',
    'Document Your Charitable Donations',
    'Complete Medical Expenses Question',
    'Medical Expense Deductions'
);

-- Document uploads stay as general
UPDATE swisstax.tax_insights
SET subcategory = 'general'
WHERE title LIKE 'Upload%';

-- Show summary
SELECT
    subcategory,
    category,
    COUNT(*) as count
FROM swisstax.tax_insights
GROUP BY subcategory, category
ORDER BY category, subcategory;
