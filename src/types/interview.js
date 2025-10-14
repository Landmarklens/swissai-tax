/**
 * Interview Question Types and Interfaces
 * Type definitions for the document-upload-based interview system
 */

/**
 * @typedef {'TEXT' | 'NUMBER' | 'CURRENCY' | 'YES_NO' | 'SINGLE_CHOICE' | 'DROPDOWN' | 'AHV_NUMBER' | 'DOCUMENT_UPLOAD' | 'POSTAL_CODE' | 'GROUP' | 'DATE'} QuestionType
 */

/**
 * @typedef {Object} BaseQuestion
 * @property {string} id - Question ID (e.g., 'Q01', 'Q08_upload')
 * @property {QuestionType} type - Question type
 * @property {string | Object<string, string>} text - Question text (multilingual)
 * @property {boolean} required - Whether the question is required
 * @property {Array<{value: string, label: Object<string, string>}>} [options] - Options for choice questions
 * @property {Object} [validation] - Validation rules
 * @property {Array<Object>} [fields] - Fields for GROUP type questions
 * @property {boolean} [auto_lookup] - Whether to perform auto lookup (for POSTAL_CODE)
 */

/**
 * @typedef {BaseQuestion & {
 *   type: 'DOCUMENT_UPLOAD',
 *   document_type: string,
 *   accepted_formats: string[],
 *   max_size_mb: number,
 *   allow_bring_later: boolean,
 *   help_text: string,
 *   sample_url?: string,
 *   document_label?: string
 * }} DocumentUploadQuestion
 */

/**
 * @typedef {'pending' | 'uploaded' | 'verified' | 'failed'} DocumentStatus
 */

/**
 * @typedef {Object} PendingDocument
 * @property {string} id - UUID of the pending document
 * @property {string} question_id - Associated question ID
 * @property {string} document_type - Type of document (e.g., 'pillar_3a_certificate')
 * @property {DocumentStatus} status - Current status
 * @property {string} document_label - Human-readable label
 * @property {string} help_text - Help text for the document
 * @property {string} [document_id] - ID of uploaded document
 * @property {string} created_at - ISO timestamp
 * @property {string} [uploaded_at] - ISO timestamp
 * @property {string} [verified_at] - ISO timestamp
 */

/**
 * @typedef {Object} ExtractedData
 * @property {number} [amount] - Extracted amount
 * @property {number} [year] - Extracted year
 * @property {string} [ahv_number] - Extracted AHV number
 * @property {string} [employer_name] - Extracted employer name
 * @property {number} [confidence] - Confidence score (0-1)
 * @property {Object<string, any>} [metadata] - Additional extracted data
 */

/**
 * @typedef {Object} InterviewSession
 * @property {string} session_id - Session UUID
 * @property {string} user_id - User UUID
 * @property {number} tax_year - Tax year
 * @property {string} language - Language code (en, de, fr, it)
 * @property {string} status - Session status ('in_progress', 'completed')
 * @property {BaseQuestion} current_question - Current question
 * @property {number} progress - Progress percentage (0-100)
 * @property {boolean} complete - Whether interview is complete
 * @property {Object<string, any>} answers - Answered questions
 * @property {Object} [profile] - Generated profile (when complete)
 * @property {Array<Object>} [document_requirements] - Required documents (when complete)
 * @property {PendingUpload} [pending_upload] - Pending document upload info
 * @property {PendingDocumentsInfo} [pending_documents] - Pending documents summary
 */

/**
 * @typedef {Object} PendingUpload
 * @property {string} question_id - Question ID for upload
 * @property {string} document_type - Document type
 * @property {boolean} required - Whether upload is required
 * @property {boolean} allow_later - Whether "bring later" is allowed
 * @property {string} help_text - Help text
 */

/**
 * @typedef {Object} PendingDocumentsInfo
 * @property {number} count - Number of pending documents
 * @property {Array<PendingDocument>} documents - List of pending documents
 */

/**
 * @typedef {Object} UploadResponse
 * @property {boolean} success - Whether upload succeeded
 * @property {string} document_id - Uploaded document ID
 * @property {ExtractedData} extracted_data - AI-extracted data
 * @property {DocumentStatus} status - Document status
 * @property {string} message - Response message
 */

/**
 * @typedef {Object} CalculateRequest
 * @property {string} session_id - Interview session ID
 * @property {boolean} [ignore_pending_documents] - Whether to ignore pending docs
 */

/**
 * @typedef {Object} CalculateErrorResponse
 * @property {string} error - Error code ('pending_documents_exist')
 * @property {string} message - Error message
 * @property {Array<PendingDocument>} pending_documents - List of pending docs
 * @property {boolean} can_proceed - Whether calculation can proceed
 */

// Export types for JSDoc usage
export const QuestionTypes = {
  TEXT: 'TEXT',
  NUMBER: 'NUMBER',
  CURRENCY: 'CURRENCY',
  YES_NO: 'YES_NO',
  SINGLE_CHOICE: 'SINGLE_CHOICE',
  DROPDOWN: 'DROPDOWN',
  AHV_NUMBER: 'AHV_NUMBER',
  DOCUMENT_UPLOAD: 'DOCUMENT_UPLOAD',
  POSTAL_CODE: 'POSTAL_CODE',
  GROUP: 'GROUP',
  DATE: 'DATE'
};

export const DocumentStatusTypes = {
  PENDING: 'pending',
  UPLOADED: 'uploaded',
  VERIFIED: 'verified',
  FAILED: 'failed'
};

export default {
  QuestionTypes,
  DocumentStatusTypes
};
