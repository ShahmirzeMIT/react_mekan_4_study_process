/**
 * Template JSON structures for all canvas types
 * These templates define the expected structure for each canvas type
 */

export interface UITemplate {
  id: string;
  description: string;
  input: {
    [canvasId: string]: {
      [componentId: string]: {
        id: string;
        componentType: 'txt' | 'txa' | 'cmb' | 'btn' | 'lbl' | 'cbox' | 'rbtn' | 'date' | 'time' | 'file' | 'img' | 'hlink' | 'tbl' | 'grp' | 'hdn' | 'irbtn';
        content: string;
        inputName: string;
        cellNo: string; // "1" to "12"
        order: number;
        inputType: 'IN' | 'GRP' | 'TBL';
        isViewOnly: '0' | '1';
        fkUserStoryId: string;
        fkGroupId: string;
        fkTableId: string;
        apiCall: Record<string, any>;
        databaseRelation: Record<string, any>;
        description: Record<string, any>;
      };
    };
  };
  css: string;
}

export interface APITemplate {
  id: string;
  name: string;
  config: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    localUrl: string;
    localHeader: string;
    filePath: string;
  };
  input: Array<{
    name: string;
    description: string;
  }>;
  output: Array<{
    name: string;
    description: string;
  }>;
  operation: Array<{
    type: 'selectdata' | 'insertdata' | 'updatedata' | 'deletedata' | 'json' | 'common';
    description: string;
  }>;
  requestBody: Record<string, any> | string;
  responseBody: Record<string, any> | string;
}

export interface DBTemplate {
  List: {
    [tableId: string]: string; // tableId -> tableName
  };
  Field: {
    [tableId: string]: {
      [fieldId: string]: {
        fieldName: string;
        type: 'text' | 'number' | 'boolean' | 'date' | 'json' | 'timestamp' | 'reference';
        tableId: string;
        fieldRelation?: string;
      };
    };
  };
  FieldOrder?: {
    [tableId: string]: string[]; // Array of field IDs in order
  };
}

export interface CollectionTemplate {
  id: string;
  label: string;
  description?: string;
  structure: Record<string, unknown>;
  fieldDescriptions?: Record<string, string>;
  createdAt?: any;
  updatedAt?: any;
  // Firebase/Firestore specific
  collectionName?: string;
  subcollections?: Array<{
    name: string;
    structure: Record<string, unknown>;
  }>;
  indexes?: Array<{
    fields: string[];
    queryScope?: 'COLLECTION' | 'COLLECTION_GROUP';
  }>;
  securityRulesHints?: string;
}

/**
 * Get UI Canvas Template
 */
export function getUITemplate(): UITemplate {
  return {
    id: '',
    description: '',
    input: {},
    css: '',
  };
}

/**
 * Get API Canvas Template
 */
export function getAPITemplate(): APITemplate {
  return {
    id: '',
    name: '',
    config: {
      method: 'POST',
      localUrl: '',
      localHeader: '',
      filePath: '',
    },
    input: [],
    output: [],
    operation: [],
    requestBody: {},
    responseBody: {},
  };
}

/**
 * Get Database Canvas Template
 */
export function getDBTemplate(): DBTemplate {
  return {
    List: {},
    Field: {},
    FieldOrder: {},
  };
}

/**
 * Get Collection Canvas Template
 */
export function getCollectionTemplate(): CollectionTemplate {
  return {
    id: '',
    label: '',
    description: '',
    structure: {},
    fieldDescriptions: {},
  };
}

/**
 * Validate template structure
 */
export function validateUITemplate(data: any): data is UITemplate {
  return (
    typeof data === 'object' &&
    typeof data.id === 'string' &&
    typeof data.description === 'string' &&
    typeof data.input === 'object' &&
    typeof data.css === 'string'
  );
}

export function validateAPITemplate(data: any): data is APITemplate {
  return (
    typeof data === 'object' &&
    typeof data.id === 'string' &&
    typeof data.name === 'string' &&
    typeof data.config === 'object' &&
    Array.isArray(data.input) &&
    Array.isArray(data.output) &&
    Array.isArray(data.operation)
  );
}

export function validateDBTemplate(data: any): data is DBTemplate {
  return (
    typeof data === 'object' &&
    typeof data.List === 'object' &&
    typeof data.Field === 'object'
  );
}

export function validateCollectionTemplate(data: any): data is CollectionTemplate {
  return (
    typeof data === 'object' &&
    typeof data.id === 'string' &&
    typeof data.label === 'string' &&
    typeof data.structure === 'object'
  );
}

