/**
 * AI Agent for Canvas Generation
 * Handles template collection, prompt interpretation, and multi-canvas generation
 */

import {
  UITemplate,
  APITemplate,
  DBTemplate,
  CollectionTemplate,
  getUITemplate,
  getAPITemplate,
  getDBTemplate,
  getCollectionTemplate,
  validateUITemplate,
  validateAPITemplate,
  validateDBTemplate,
  validateCollectionTemplate,
} from './templates';

export interface CanvasPreview {
  uiCanvas?: UITemplate;
  apiCanvas?: APITemplate;
  dbCanvas?: DBTemplate;
  collectionCanvas?: CollectionTemplate;
  warnings: string[];
  errors: string[];
}

export interface PromptInterpretation {
  requirements: {
    ui?: {
      components?: string[];
      layout?: string;
      interactions?: string[];
      states?: string[];
      events?: string[];
      uxLogic?: string;
    };
    api?: {
      endpoints?: string[];
      methods?: string[];
      requestBodies?: Record<string, any>[];
      responseBodies?: Record<string, any>[];
      validation?: string[];
      errors?: string[];
    };
    database?: {
      tables?: string[];
      fields?: Record<string, any>[];
      relations?: string[];
      indexes?: string[];
      constraints?: string[];
    };
    collections?: {
      collectionNames?: string[];
      documentShapes?: Record<string, any>[];
      subcollections?: string[];
      indexes?: string[];
      securityRules?: string[];
    };
  };
  expandedSpecs: string;
  inferredFields: Record<string, any>;
}

/**
 * Step 1: Collect Template JSON Samples
 */
export function collectTemplates(): {
  uiTemplate: UITemplate;
  apiTemplate: APITemplate;
  dbTemplate: DBTemplate;
  collectionTemplate: CollectionTemplate;
} {
  return {
    uiTemplate: getUITemplate(),
    apiTemplate: getAPITemplate(),
    dbTemplate: getDBTemplate(),
    collectionTemplate: getCollectionTemplate(),
  };
}

/**
 * Step 2: Interpret User Prompt
 */
export function interpretPrompt(prompt: string): PromptInterpretation {
  const interpretation: PromptInterpretation = {
    requirements: {},
    expandedSpecs: '',
    inferredFields: {},
  };

  // Basic prompt analysis
  const lowerPrompt = prompt.toLowerCase();

  // Detect UI requirements
  if (
    lowerPrompt.includes('ui') ||
    lowerPrompt.includes('form') ||
    lowerPrompt.includes('button') ||
    lowerPrompt.includes('input') ||
    lowerPrompt.includes('component') ||
    lowerPrompt.includes('interface') ||
    lowerPrompt.includes('screen') ||
    lowerPrompt.includes('page')
  ) {
    interpretation.requirements.ui = {
      components: extractComponents(prompt),
      layout: extractLayout(prompt),
      interactions: extractInteractions(prompt),
      states: extractStates(prompt),
      events: extractEvents(prompt),
      uxLogic: extractUXLogic(prompt),
    };
  }

  // Detect API requirements
  if (
    lowerPrompt.includes('api') ||
    lowerPrompt.includes('endpoint') ||
    lowerPrompt.includes('request') ||
    lowerPrompt.includes('response') ||
    lowerPrompt.includes('http') ||
    lowerPrompt.includes('rest')
  ) {
    interpretation.requirements.api = {
      endpoints: extractEndpoints(prompt),
      methods: extractMethods(prompt),
      requestBodies: extractRequestBodies(prompt),
      responseBodies: extractResponseBodies(prompt),
      validation: extractValidation(prompt),
      errors: extractErrors(prompt),
    };
  }

  // Detect Database requirements
  if (
    lowerPrompt.includes('database') ||
    lowerPrompt.includes('db') ||
    lowerPrompt.includes('table') ||
    lowerPrompt.includes('schema') ||
    lowerPrompt.includes('relation') ||
    lowerPrompt.includes('foreign key')
  ) {
    interpretation.requirements.database = {
      tables: extractTables(prompt),
      fields: extractFields(prompt),
      relations: extractRelations(prompt),
      indexes: extractIndexes(prompt),
      constraints: extractConstraints(prompt),
    };
  }

  // Detect Collection requirements
  if (
    lowerPrompt.includes('collection') ||
    lowerPrompt.includes('firestore') ||
    lowerPrompt.includes('firebase') ||
    lowerPrompt.includes('document')
  ) {
    interpretation.requirements.collections = {
      collectionNames: extractCollectionNames(prompt),
      documentShapes: extractDocumentShapes(prompt),
      subcollections: extractSubcollections(prompt),
      indexes: extractCollectionIndexes(prompt),
      securityRules: extractSecurityRules(prompt),
    };
  }

  // Expand specifications
  interpretation.expandedSpecs = expandSpecifications(prompt, interpretation.requirements);

  // Infer missing fields
  interpretation.inferredFields = inferFields(interpretation.requirements);

  return interpretation;
}

// Helper functions for extraction
function extractComponents(prompt: string): string[] {
  const components: string[] = [];
  const componentKeywords = ['button', 'input', 'form', 'table', 'select', 'checkbox', 'radio', 'label'];
  componentKeywords.forEach((keyword) => {
    if (prompt.toLowerCase().includes(keyword)) {
      components.push(keyword);
    }
  });
  return components;
}

function extractLayout(prompt: string): string {
  if (prompt.toLowerCase().includes('grid')) return 'grid';
  if (prompt.toLowerCase().includes('flex')) return 'flex';
  if (prompt.toLowerCase().includes('column')) return 'column';
  if (prompt.toLowerCase().includes('row')) return 'row';
  return 'default';
}

function extractInteractions(prompt: string): string[] {
  const interactions: string[] = [];
  if (prompt.toLowerCase().includes('click')) interactions.push('click');
  if (prompt.toLowerCase().includes('submit')) interactions.push('submit');
  if (prompt.toLowerCase().includes('change')) interactions.push('change');
  if (prompt.toLowerCase().includes('hover')) interactions.push('hover');
  return interactions;
}

function extractStates(prompt: string): string[] {
  const states: string[] = [];
  if (prompt.toLowerCase().includes('loading')) states.push('loading');
  if (prompt.toLowerCase().includes('error')) states.push('error');
  if (prompt.toLowerCase().includes('success')) states.push('success');
  return states;
}

function extractEvents(prompt: string): string[] {
  const events: string[] = [];
  if (prompt.toLowerCase().includes('onclick')) events.push('onClick');
  if (prompt.toLowerCase().includes('onsubmit')) events.push('onSubmit');
  if (prompt.toLowerCase().includes('onchange')) events.push('onChange');
  return events;
}

function extractUXLogic(prompt: string): string {
  return prompt;
}

function extractEndpoints(prompt: string): string[] {
  const endpoints: string[] = [];
  const endpointRegex = /\/api\/[\w\/-]+/gi;
  const matches = prompt.match(endpointRegex);
  if (matches) {
    endpoints.push(...matches);
  }
  return endpoints;
}

function extractMethods(prompt: string): string[] {
  const methods: string[] = [];
  const methodKeywords = ['get', 'post', 'put', 'delete', 'patch'];
  methodKeywords.forEach((method) => {
    if (prompt.toLowerCase().includes(method)) {
      methods.push(method.toUpperCase());
    }
  });
  return methods;
}

function extractRequestBodies(prompt: string): Record<string, any>[] {
  // Try to extract JSON-like structures
  const bodies: Record<string, any>[] = [];
  const jsonRegex = /\{[\s\S]*?\}/g;
  const matches = prompt.match(jsonRegex);
  if (matches) {
    matches.forEach((match) => {
      try {
        const parsed = JSON.parse(match);
        if (typeof parsed === 'object') {
          bodies.push(parsed);
        }
      } catch {
        // Not valid JSON, skip
      }
    });
  }
  return bodies;
}

function extractResponseBodies(prompt: string): Record<string, any>[] {
  return extractRequestBodies(prompt); // Same logic
}

function extractValidation(prompt: string): string[] {
  const validations: string[] = [];
  if (prompt.toLowerCase().includes('required')) validations.push('required');
  if (prompt.toLowerCase().includes('email')) validations.push('email');
  if (prompt.toLowerCase().includes('min')) validations.push('minLength');
  if (prompt.toLowerCase().includes('max')) validations.push('maxLength');
  return validations;
}

function extractErrors(prompt: string): string[] {
  const errors: string[] = [];
  if (prompt.toLowerCase().includes('error')) errors.push('generic');
  if (prompt.toLowerCase().includes('not found')) errors.push('notFound');
  if (prompt.toLowerCase().includes('unauthorized')) errors.push('unauthorized');
  return errors;
}

function extractTables(prompt: string): string[] {
  const tables: string[] = [];
  const tableRegex = /table[s]?\s+[\w]+/gi;
  const matches = prompt.match(tableRegex);
  if (matches) {
    matches.forEach((match) => {
      const tableName = match.replace(/table[s]?\s+/i, '').trim();
      if (tableName) tables.push(tableName);
    });
  }
  return tables;
}

function extractFields(prompt: string): Record<string, any>[] {
  // Basic field extraction
  return [];
}

function extractRelations(prompt: string): string[] {
  const relations: string[] = [];
  if (prompt.toLowerCase().includes('foreign key')) relations.push('foreignKey');
  if (prompt.toLowerCase().includes('one to many')) relations.push('oneToMany');
  if (prompt.toLowerCase().includes('many to many')) relations.push('manyToMany');
  return relations;
}

function extractIndexes(prompt: string): string[] {
  const indexes: string[] = [];
  if (prompt.toLowerCase().includes('index')) indexes.push('index');
  return indexes;
}

function extractConstraints(prompt: string): string[] {
  const constraints: string[] = [];
  if (prompt.toLowerCase().includes('primary key')) constraints.push('primaryKey');
  if (prompt.toLowerCase().includes('unique')) constraints.push('unique');
  if (prompt.toLowerCase().includes('not null')) constraints.push('notNull');
  return constraints;
}

function extractCollectionNames(prompt: string): string[] {
  const collections: string[] = [];
  const collectionRegex = /collection[s]?\s+[\w]+/gi;
  const matches = prompt.match(collectionRegex);
  if (matches) {
    matches.forEach((match) => {
      const collectionName = match.replace(/collection[s]?\s+/i, '').trim();
      if (collectionName) collections.push(collectionName);
    });
  }
  return collections;
}

function extractDocumentShapes(prompt: string): Record<string, any>[] {
  return extractRequestBodies(prompt); // Similar logic
}

function extractSubcollections(prompt: string): string[] {
  const subcollections: string[] = [];
  if (prompt.toLowerCase().includes('subcollection')) {
    subcollections.push('subcollection');
  }
  return subcollections;
}

function extractCollectionIndexes(prompt: string): string[] {
  return extractIndexes(prompt); // Same logic
}

function extractSecurityRules(prompt: string): string[] {
  const rules: string[] = [];
  if (prompt.toLowerCase().includes('security')) rules.push('security');
  if (prompt.toLowerCase().includes('auth')) rules.push('auth');
  return rules;
}

function expandSpecifications(prompt: string, requirements: PromptInterpretation['requirements']): string {
  let expanded = `Original Prompt: ${prompt}\n\n`;
  expanded += `Expanded Specifications:\n`;

  if (requirements.ui) {
    expanded += `\nUI Requirements:\n`;
    expanded += `- Components: ${requirements.ui.components?.join(', ') || 'Not specified'}\n`;
    expanded += `- Layout: ${requirements.ui.layout || 'Not specified'}\n`;
    expanded += `- Interactions: ${requirements.ui.interactions?.join(', ') || 'Not specified'}\n`;
  }

  if (requirements.api) {
    expanded += `\nAPI Requirements:\n`;
    expanded += `- Endpoints: ${requirements.api.endpoints?.join(', ') || 'Not specified'}\n`;
    expanded += `- Methods: ${requirements.api.methods?.join(', ') || 'Not specified'}\n`;
  }

  if (requirements.database) {
    expanded += `\nDatabase Requirements:\n`;
    expanded += `- Tables: ${requirements.database.tables?.join(', ') || 'Not specified'}\n`;
  }

  if (requirements.collections) {
    expanded += `\nCollection Requirements:\n`;
    expanded += `- Collections: ${requirements.collections.collectionNames?.join(', ') || 'Not specified'}\n`;
  }

  return expanded;
}

function inferFields(requirements: PromptInterpretation['requirements']): Record<string, any> {
  const inferred: Record<string, any> = {};

  // Infer UI fields
  if (requirements.ui?.components) {
    inferred.uiComponents = requirements.ui.components;
  }

  // Infer API fields
  if (requirements.api?.endpoints) {
    inferred.apiEndpoints = requirements.api.endpoints;
  }

  // Infer DB fields
  if (requirements.database?.tables) {
    inferred.dbTables = requirements.database.tables;
  }

  return inferred;
}

/**
 * Step 3: Generate All Canvas Outputs
 * This will be implemented with actual AI generation logic
 */
export async function generateCanvases(
  interpretation: PromptInterpretation,
  templates: ReturnType<typeof collectTemplates>,
  useMCP: boolean = false
): Promise<CanvasPreview> {
  const preview: CanvasPreview = {
    warnings: [],
    errors: [],
  };

  try {
    // Generate UI Canvas if needed
    if (interpretation.requirements.ui) {
      preview.uiCanvas = await generateUICanvas(interpretation, templates.uiTemplate);
    }

    // Generate API Canvas if needed
    if (interpretation.requirements.api) {
      preview.apiCanvas = await generateAPICanvas(interpretation, templates.apiTemplate);
    }

    // Generate DB Canvas if needed
    if (interpretation.requirements.database) {
      preview.dbCanvas = await generateDBCanvas(interpretation, templates.dbTemplate);
    }

    // Generate Collection Canvas if needed
    if (interpretation.requirements.collections) {
      preview.collectionCanvas = await generateCollectionCanvas(interpretation, templates.collectionTemplate);
    }

    // Validate generated canvases
    if (preview.uiCanvas && !validateUITemplate(preview.uiCanvas)) {
      preview.errors.push('Generated UI Canvas does not match template structure');
    }
    if (preview.apiCanvas && !validateAPITemplate(preview.apiCanvas)) {
      preview.errors.push('Generated API Canvas does not match template structure');
    }
    if (preview.dbCanvas && !validateDBTemplate(preview.dbCanvas)) {
      preview.errors.push('Generated DB Canvas does not match template structure');
    }
    if (preview.collectionCanvas && !validateCollectionTemplate(preview.collectionCanvas)) {
      preview.errors.push('Generated Collection Canvas does not match template structure');
    }
  } catch (error: any) {
    preview.errors.push(error.message || 'Generation failed');
  }

  return preview;
}

// Placeholder generation functions - these will be replaced with actual AI calls
async function generateUICanvas(
  interpretation: PromptInterpretation,
  template: UITemplate
): Promise<UITemplate> {
  // This will be implemented with actual AI generation
  return template;
}

async function generateAPICanvas(
  interpretation: PromptInterpretation,
  template: APITemplate
): Promise<APITemplate> {
  // This will be implemented with actual AI generation
  return template;
}

async function generateDBCanvas(
  interpretation: PromptInterpretation,
  template: DBTemplate
): Promise<DBTemplate> {
  // This will be implemented with actual AI generation
  return template;
}

async function generateCollectionCanvas(
  interpretation: PromptInterpretation,
  template: CollectionTemplate
): Promise<CollectionTemplate> {
  // This will be implemented with actual AI generation
  return template;
}

