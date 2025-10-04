// Local storage service for document persistence
// This provides temporary persistence until backend is ready
import logger from './loggingService';

class DocumentStorageService {
  constructor() {
    this.STORAGE_KEY = 'swissai_documents';
    this.STORAGE_VERSION = '1.0';
  }

  // Initialize storage with version check
  initialize() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) {
      this.setDocuments([]);
      return [];
    }

    try {
      const data = JSON.parse(stored);
      if (data.version !== this.STORAGE_VERSION) {
        console.log('Storage version mismatch, clearing storage');
        this.setDocuments([]);
        return [];
      }
      return data.documents || [];
    } catch (error) {
      console.error('Error parsing stored documents:', error);
      this.setDocuments([]);
      return [];
    }
  }

  // Get all documents
  getDocuments() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const data = JSON.parse(stored);
      return data.documents || [];
    } catch (error) {
      console.error('Error getting documents:', error);
      return [];
    }
  }

  // Set all documents
  setDocuments(documents) {
    try {
      const data = {
        version: this.STORAGE_VERSION,
        documents: documents,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error storing documents:', error);
      // Handle quota exceeded error
      if (error.name === 'QuotaExceededError') {
        console.error('localStorage quota exceeded');
        // Could implement cleanup of old documents here
      }
      return false;
    }
  }

  // Add a new document
  addDocument(document) {
    logger.debug('DOC_STORAGE', 'Adding new document', { 
      templateId: document.template_id,
      status: document.status 
    });
    
    const documents = this.getDocuments();
    const newDoc = {
      ...document,
      id: document.id || this.generateId(),
      created_at: document.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    documents.push(newDoc);
    const success = this.setDocuments(documents);
    
    if (success) {
      logger.info('DOC_STORAGE', `Document created: ${newDoc.id}`, {
        id: newDoc.id,
        template: newDoc.template_name,
        status: newDoc.status
      });
    } else {
      logger.error('DOC_STORAGE', 'Failed to save document', { id: newDoc.id });
    }
    
    return newDoc;
  }

  // Update an existing document
  updateDocument(documentId, updates) {
    const documents = this.getDocuments();
    const index = documents.findIndex(doc => doc.id === documentId);
    
    if (index === -1) {
      console.error('Document not found:', documentId);
      return null;
    }

    documents[index] = {
      ...documents[index],
      ...updates,
      updated_at: new Date().toISOString()
    };

    this.setDocuments(documents);
    return documents[index];
  }

  // Delete a document
  deleteDocument(documentId) {
    const documents = this.getDocuments();
    const filtered = documents.filter(doc => doc.id !== documentId);
    this.setDocuments(filtered);
    return filtered.length < documents.length;
  }

  // Get a single document by ID
  getDocument(documentId) {
    const documents = this.getDocuments();
    return documents.find(doc => doc.id === documentId) || null;
  }

  // Get documents by status
  getDocumentsByStatus(status) {
    const documents = this.getDocuments();
    return documents.filter(doc => doc.status === status);
  }

  // Get documents for a specific tenant
  getDocumentsByTenant(tenantId) {
    const documents = this.getDocuments();
    return documents.filter(doc => doc.tenant_id === tenantId);
  }

  // Generate a unique ID
  generateId() {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Clear all documents (for testing/reset)
  clearAll() {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Export documents (for backup)
  exportDocuments() {
    const documents = this.getDocuments();
    const dataStr = JSON.stringify(documents, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `documents_backup_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

  // Import documents (from backup)
  importDocuments(jsonString) {
    try {
      const documents = JSON.parse(jsonString);
      if (Array.isArray(documents)) {
        this.setDocuments(documents);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing documents:', error);
      return false;
    }
  }

  // Get storage size info
  getStorageInfo() {
    const stored = localStorage.getItem(this.STORAGE_KEY) || '';
    const sizeInBytes = new Blob([stored]).size;
    const sizeInKB = (sizeInBytes / 1024).toFixed(2);
    const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
    
    // Estimate available space (localStorage typically has 5-10MB limit)
    const estimatedLimit = 5 * 1024 * 1024; // 5MB
    const percentUsed = ((sizeInBytes / estimatedLimit) * 100).toFixed(2);
    
    return {
      sizeInBytes,
      sizeInKB: `${sizeInKB} KB`,
      sizeInMB: `${sizeInMB} MB`,
      percentUsed: `${percentUsed}%`,
      documentsCount: this.getDocuments().length
    };
  }
}

export default new DocumentStorageService();