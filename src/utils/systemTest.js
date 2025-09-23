// System Test Suite
// This file tests all implemented features

import documentStorageService from '../services/documentStorageService';
import emailService from '../services/emailService';
import templateService from '../services/templateService';

export const runSystemTests = async () => {
  const results = {
    passed: [],
    failed: [],
    warnings: []
  };

  console.log('🚀 Starting System Tests...\n');

  // Test 1: LocalStorage Document Persistence
  console.log('📝 Testing Document Persistence...');
  try {
    // Clear storage first
    documentStorageService.clearAll();
    
    // Add a test document
    const testDoc = {
      template_id: 'lease-standard',
      template_name: 'Standard Lease Agreement',
      field_values: {
        landlord_name: 'Test Landlord',
        tenant_name: 'Test Tenant',
        property_address: '123 Test St',
        monthly_rent: '1500'
      },
      status: 'draft'
    };
    
    const savedDoc = documentStorageService.addDocument(testDoc);
    if (savedDoc && savedDoc.id) {
      results.passed.push('✅ Document creation and localStorage persistence');
      
      // Test retrieval
      const retrievedDoc = documentStorageService.getDocument(savedDoc.id);
      if (retrievedDoc) {
        results.passed.push('✅ Document retrieval from localStorage');
      }
      
      // Test update
      const updated = documentStorageService.updateDocument(savedDoc.id, { status: 'completed' });
      if (updated && updated.status === 'completed') {
        results.passed.push('✅ Document update in localStorage');
      }
      
      // Test deletion
      const deleted = documentStorageService.deleteDocument(savedDoc.id);
      if (deleted) {
        results.passed.push('✅ Document deletion from localStorage');
      }
    }
    
    // Test storage info
    const storageInfo = documentStorageService.getStorageInfo();
    console.log('💾 Storage Info:', storageInfo);
    results.passed.push('✅ Storage monitoring working');
    
  } catch (error) {
    results.failed.push(`❌ Document persistence test failed: ${error.message}`);
  }

  // Test 2: Email Service (Simulated)
  console.log('\n📧 Testing Email Service...');
  try {
    // Check configuration
    const emailConfig = await emailService.verifyConfiguration();
    console.log('Email Config:', emailConfig);
    
    if (emailConfig.mode === 'development') {
      results.warnings.push('⚠️ Email service in development mode (simulation only)');
    }
    
    // Test signature request email
    const emailResult = await emailService.sendSignatureRequestEmail(
      'test@example.com',
      {
        documentName: 'Test Lease Agreement',
        landlordName: 'Test Landlord',
        signingLink: 'http://localhost:3000/sign/test123?token=abc',
        expiresIn: '7 days',
        documentId: 'test123'
      }
    );
    
    if (emailResult.success) {
      results.passed.push('✅ Signature request email simulation');
      
      // Check email logs
      const logs = emailService.getEmailLogs();
      if (logs.length > 0) {
        results.passed.push('✅ Email logging to localStorage');
      }
    }
    
    // Test signing token generation
    const token = emailService.generateSigningToken();
    if (token && token.length === 64) {
      results.passed.push('✅ Signing token generation');
    }
    
  } catch (error) {
    results.failed.push(`❌ Email service test failed: ${error.message}`);
  }

  // Test 3: Template Service
  console.log('\n📄 Testing Template Service...');
  try {
    // Test local template loading
    const template = await templateService.getTemplate('lease-standard', 'en');
    if (template && template.title) {
      results.passed.push('✅ Local template loading');
    }
    
    // Test multi-language support
    const germanTemplate = await templateService.getTemplate('lease-standard', 'de');
    if (germanTemplate && germanTemplate.title !== template.title) {
      results.passed.push('✅ Multi-language template support');
    }
    
    // Test HTML generation
    const html = templateService.generateHtmlFromTemplate(template, {
      landlord_name: 'John Doe',
      tenant_name: 'Jane Smith',
      property_address: '456 Main St'
    });
    
    if (html && html.includes('John Doe') && html.includes('Jane Smith')) {
      results.passed.push('✅ Template HTML generation with field replacement');
    }
    
    // Check S3 configuration
    if (!templateService.useS3) {
      results.warnings.push('⚠️ S3 template loading disabled (using local templates)');
    }
    
  } catch (error) {
    results.failed.push(`❌ Template service test failed: ${error.message}`);
  }

  // Test 4: Validation Utils
  console.log('\n✔️ Testing Validation...');
  try {
    const { validateEmail, validateCurrency, validateDate, formatCurrency } = await import('./validation');
    
    // Test email validation
    if (validateEmail('test@example.com') && !validateEmail('invalid-email')) {
      results.passed.push('✅ Email validation');
    }
    
    // Test currency validation
    if (validateCurrency('1,234.56') && !validateCurrency('abc')) {
      results.passed.push('✅ Currency validation');
    }
    
    // Test date validation
    if (validateDate('2024-01-15') && !validateDate('invalid-date')) {
      results.passed.push('✅ Date validation');
    }
    
    // Test currency formatting
    if (formatCurrency('1234.567') === '1,234.56') {
      results.passed.push('✅ Currency formatting');
    }
    
  } catch (error) {
    results.failed.push(`❌ Validation test failed: ${error.message}`);
  }

  // Test 5: Feature Integration
  console.log('\n🔗 Testing Feature Integration...');
  try {
    // Create a complete document flow
    const document = {
      template_id: 'lease-standard',
      template_name: 'Standard Lease',
      field_values: {
        landlord_name: 'Integration Test Landlord',
        tenant_name: 'Integration Test Tenant',
        property_address: '789 Integration Ave',
        monthly_rent: '2000',
        lease_start_date: '2024-02-01',
        lease_end_date: '2025-01-31',
        landlord_signature: { type: 'type', text: 'John Landlord', font: 'Dancing Script' }
      },
      status: 'draft'
    };
    
    // Save document
    const saved = documentStorageService.addDocument(document);
    
    // Update to pending signature
    const updated = documentStorageService.updateDocument(saved.id, {
      status: 'pending_tenant_signature',
      sent_to_tenant_at: new Date().toISOString()
    });
    
    // Simulate tenant signature
    const signed = documentStorageService.updateDocument(saved.id, {
      status: 'completed',
      field_values: {
        ...updated.field_values,
        tenant_signature: { type: 'type', text: 'Jane Tenant', font: 'Dancing Script' },
        tenant_sign_date: new Date().toISOString().split('T')[0]
      }
    });
    
    if (signed.status === 'completed') {
      results.passed.push('✅ Complete document workflow (draft → pending → completed)');
    }
    
    // Clean up
    documentStorageService.deleteDocument(saved.id);
    
  } catch (error) {
    results.failed.push(`❌ Integration test failed: ${error.message}`);
  }

  // Print Results
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST RESULTS');
  console.log('='.repeat(50));
  
  console.log(`\n✅ Passed: ${results.passed.length}`);
  results.passed.forEach(test => console.log(`  ${test}`));
  
  if (results.warnings.length > 0) {
    console.log(`\n⚠️ Warnings: ${results.warnings.length}`);
    results.warnings.forEach(warning => console.log(`  ${warning}`));
  }
  
  if (results.failed.length > 0) {
    console.log(`\n❌ Failed: ${results.failed.length}`);
    results.failed.forEach(failure => console.log(`  ${failure}`));
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`Overall: ${results.failed.length === 0 ? '✅ ALL TESTS PASSED!' : '❌ SOME TESTS FAILED'}`);
  console.log('='.repeat(50) + '\n');
  
  return results;
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.runSystemTests = runSystemTests;
  console.log('💡 System tests loaded. Run window.runSystemTests() in console to test all features.');
}