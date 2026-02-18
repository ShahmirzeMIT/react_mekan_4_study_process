import React, { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Drawer,
  Input,
  Space,
  Spin,
  Alert,
  Collapse,
  Tabs,
  Typography,
  Card,
  Checkbox,
  message,
} from 'antd';
import { SaveOutlined, CheckOutlined, CloseOutlined, WarningOutlined } from '@ant-design/icons';
import UIPrototype from '@/hooks/ui-canvas/ui-prototype/UIPrototype.tsx';
import useUICanvasUpdate from '@/hooks/ui-canvas/useUICanvasUpdate.tsx';
import {
  collectTemplates,
  interpretPrompt,
  generateCanvases,
  type CanvasPreview,
  type PromptInterpretation,
} from './aiAgent';
import { callApi } from '@/utils/callApi.ts';
import { useAppSelector } from '@/store';
import { db } from '@/config/firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import UICanvasPreview from '@/ui-canvas/ui-canvas/UICanvasPreview';

const { TextArea } = Input;
const { Panel } = Collapse;
const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

interface UICanvasAIDrawerProps {
  open: boolean;
  onClose: () => void;
  canvasId: string;
}

type WorkflowStep = 'prompt' | 'preview' | 'confirm' | 'saving';

const UICanvasAIDrawer: React.FC<UICanvasAIDrawerProps> = ({ open, onClose, canvasId }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<WorkflowStep>('prompt');
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  
  // Template and interpretation state
  const [templates, setTemplates] = useState<ReturnType<typeof collectTemplates> | null>(null);
  const [interpretation, setInterpretation] = useState<PromptInterpretation | null>(null);
  const [preview, setPreview] = useState<CanvasPreview | null>(null);
  
  // Canvas data state
  const [uiCanvasData, setUiCanvasData] = useState<Record<string, any> | null>(null);
  const [apiCanvasData, setApiCanvasData] = useState<any>(null);
  const [dbCanvasData, setDbCanvasData] = useState<any>(null);
  const [collectionCanvasData, setCollectionCanvasData] = useState<any>(null);
  
  // Confirmation state
  const [confirmedCanvases, setConfirmedCanvases] = useState({
    ui: false,
    api: false,
    db: false,
    collection: false,
  });

  const { updateUICanvas } = useUICanvasUpdate({ selectedUICanvasId: canvasId });
  const { currentProject } = useAppSelector((state) => state.project);

  // Step 1: Collect templates on mount
  useEffect(() => {
    if (open) {
      const collectedTemplates = collectTemplates();
      setTemplates(collectedTemplates);
      console.log('Templates collected:', collectedTemplates);
    }
  }, [open]);

  // Reset state when drawer closes
  useEffect(() => {
    if (!open) {
      setPrompt('');
      setStep('prompt');
      setError(null);
      setWarnings([]);
      setInterpretation(null);
      setPreview(null);
      setUiCanvasData(null);
      setApiCanvasData(null);
      setDbCanvasData(null);
      setCollectionCanvasData(null);
      setConfirmedCanvases({
        ui: false,
        api: false,
        db: false,
        collection: false,
      });
    }
  }, [open]);

  // Step 2 & 3: Interpret prompt and generate canvases
  const handleGenerate = useCallback(async () => {
    if (!prompt?.trim()) {
      setError('Please enter a prompt');
      return;
    }

    if (!templates) {
      setError('Templates not loaded. Please wait...');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setWarnings([]);

      // Step 2: Interpret the prompt
      const interpreted = interpretPrompt(prompt);
      setInterpretation(interpreted);
      console.log('Prompt interpreted:', interpreted);

      // Step 3: Generate canvases (using AI API)
      // For now, we'll use the existing API endpoint, but enhanced
      const response = await callApi('/ui-canvas/generate-canvas', {
        prompt,
        canvasId,
        interpretation: interpreted,
        templates: templates,
        generateAll: true, // Flag to generate all canvas types
      });

      // Parse response
      const parsed = response?.input?.[canvasId] || response?.inputs?.[canvasId] || response?.input || response?.inputs || response?.data?.input?.[canvasId] || response;

      if (!parsed || (typeof parsed === 'object' && Object.keys(parsed).length === 0)) {
        setError('No canvas data found in generator response.');
        return;
      }

      // Step 4: Create preview
      const previewData: CanvasPreview = {
        uiCanvas: parsed.uiCanvas || parsed,
        apiCanvas: parsed.apiCanvas,
        dbCanvas: parsed.dbCanvas,
        collectionCanvas: parsed.collectionCanvas,
        warnings: parsed.warnings || [],
        errors: parsed.errors || [],
      };

      setPreview(previewData);
      setUiCanvasData(previewData.uiCanvas);
      setApiCanvasData(previewData.apiCanvas);
      setDbCanvasData(previewData.dbCanvas);
      setCollectionCanvasData(previewData.collectionCanvas);
      setWarnings(previewData.warnings);
      
      if (previewData.errors.length > 0) {
        setError(previewData.errors.join(', '));
      }

      // Move to preview step
      setStep('preview');
    } catch (e: any) {
      console.error('Generation error:', e);
      setError(e?.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  }, [prompt, canvasId, templates]);

  // Step 5: Apply changes after confirmation
  const handleApplyChanges = useCallback(async () => {
    if (!preview) {
      setError('No preview data to apply');
      return;
    }

    try {
      setLoading(true);
      setStep('saving');
      setError(null);

      // Apply UI Canvas
      if (confirmedCanvases.ui && uiCanvasData) {
        await updateUICanvas(uiCanvasData);
        message.success('UI Canvas updated successfully');
      }

      // Apply API Canvas
      if (confirmedCanvases.api && apiCanvasData && currentProject?.id) {
        const apiId = apiCanvasData.id || uuidv4();
        const apiDocRef = doc(db, 'api_canvas', apiId);
        await setDoc(apiDocRef, {
          ...apiCanvasData,
          id: apiId,
          type: 'api',
        });

        // Update project's api_json
        const projectDocRef = doc(db, 'projects', currentProject.id);
        const projectDoc = await projectDocRef.get();
        const existingApiJson = projectDoc.exists() ? JSON.parse(projectDoc.data()?.api_json || '{}') : {};
        existingApiJson[apiId] = apiCanvasData.name || apiId;
        await updateDoc(projectDocRef, {
          api_json: JSON.stringify(existingApiJson),
        });

        message.success('API Canvas created successfully');
      }

      // Apply DB Canvas
      if (confirmedCanvases.db && dbCanvasData && currentProject?.id) {
        // DB Canvas is stored in project document
        const projectDocRef = doc(db, 'projects', currentProject.id);
        const projectDoc = await projectDocRef.get();
        const existingDbData = projectDoc.exists() ? projectDoc.data()?.Database || {} : {};
        
        const mergedDbData = {
          ...existingDbData,
          List: { ...existingDbData.List, ...dbCanvasData.List },
          Field: { ...existingDbData.Field, ...dbCanvasData.Field },
          FieldOrder: { ...existingDbData.FieldOrder, ...dbCanvasData.FieldOrder },
        };

        await updateDoc(projectDocRef, {
          Database: mergedDbData,
        });

        message.success('Database Canvas updated successfully');
      }

      // Apply Collection Canvas
      if (confirmedCanvases.collection && collectionCanvasData && currentProject?.id) {
        const collectionId = collectionCanvasData.id || uuidv4();
        const collectionDocRef = doc(db, 'collection_canvas', collectionId);
        await setDoc(collectionDocRef, {
          ...collectionCanvasData,
          id: collectionId,
        });

        // Update project's collection_canvas
        const projectDocRef = doc(db, 'projects', currentProject.id);
        const projectDoc = await projectDocRef.get();
        const existingCollections = projectDoc.exists() 
          ? JSON.parse(projectDoc.data()?.collection_canvas || '[]') 
          : [];
        
        existingCollections.push({
          id: collectionId,
          label: collectionCanvasData.label || collectionId,
          description: collectionCanvasData.description || '',
        });

        await updateDoc(projectDocRef, {
          collection_canvas: JSON.stringify(existingCollections),
        });

        message.success('Collection Canvas created successfully');
      }

      // Close drawer and reset
      onClose();
      message.success('All changes applied successfully');
    } catch (e: any) {
      console.error('Apply error:', e);
      setError(e?.message || 'Failed to apply changes');
    } finally {
      setLoading(false);
      setStep('preview');
    }
  }, [preview, confirmedCanvases, uiCanvasData, apiCanvasData, dbCanvasData, collectionCanvasData, currentProject, updateUICanvas, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const canApply = Object.values(confirmedCanvases).some((confirmed) => confirmed);

  const renderPreviewTabs = () => {
    if (!preview) return null;

    return (
      <Tabs defaultActiveKey="ui">
        {preview.uiCanvas && (
          <TabPane tab="UI Canvas" key="ui">
            <Card>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Checkbox
                  checked={confirmedCanvases.ui}
                  onChange={(e) =>
                    setConfirmedCanvases((prev) => ({ ...prev, ui: e.target.checked }))
                  }
                >
                  <Text strong>Apply UI Canvas changes</Text>
                </Checkbox>
                <UIPrototype
                  preview={true}
                  componentsJson={uiCanvasData || {}}
                  selectedUICanvasId={canvasId}
                />
              </Space>
            </Card>
          </TabPane>
        )}

        {preview.apiCanvas && (
          <TabPane tab="API Canvas" key="api">
            <Card>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Checkbox
                  checked={confirmedCanvases.api}
                  onChange={(e) =>
                    setConfirmedCanvases((prev) => ({ ...prev, api: e.target.checked }))
                  }
                >
                  <Text strong>Apply API Canvas changes</Text>
                </Checkbox>
                <Collapse>
                  <Panel header="API Canvas JSON" key="api-json">
                    <pre style={{ whiteSpace: 'pre-wrap', maxHeight: 400, overflow: 'auto' }}>
                      {JSON.stringify(preview.apiCanvas, null, 2)}
                    </pre>
                  </Panel>
                </Collapse>
              </Space>
            </Card>
          </TabPane>
        )}

      </Tabs>
    );
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="AI Canvas Generator"
      width={1200}
      footer={
        <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
          <div>
            {step === 'preview' && (
              <Button
                type="primary"
                icon={<CheckOutlined />}
                disabled={!canApply || loading}
                onClick={handleApplyChanges}
                loading={loading && step === 'saving'}
              >
                Apply Changes
              </Button>
            )}
          </div>
          <Button onClick={onClose} disabled={loading && step === 'saving'}>
            {step === 'saving' ? 'Saving...' : 'Cancel'}
          </Button>
        </div>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {step === 'prompt' && (
          <>
            <div>
              <Title level={4}>Step 1: Enter Your Requirements</Title>
              <Paragraph>
                Describe what you want to build. The AI will generate UI, API, Database, and Collection canvases based on your prompt.
              </Paragraph>
            </div>

            <TextArea
              rows={6}
              placeholder="Example: Create a user registration form with email, password, and name fields. Include an API endpoint to save user data to a users table in the database and a Firestore collection..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
            />

            <Button
              type="primary"
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              loading={loading}
              block
            >
              {loading ? 'Generating...' : 'Generate Canvases'}
            </Button>

            {error && <Alert type="error" message={error} showIcon />}
          </>
        )}

        {step === 'preview' && (
          <>
            <div>
              <Title level={4}>Step 2: Review Generated Canvases</Title>
              <Paragraph>
                Review the generated canvases below. Select which canvases you want to apply, then click "Apply Changes".
              </Paragraph>
            </div>

            {warnings.length > 0 && (
              <Alert
                type="warning"
                icon={<WarningOutlined />}
                message="Warnings"
                description={
                  <ul>
                    {warnings.map((warning, idx) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                }
                showIcon
              />
            )}

            {error && <Alert type="error" message={error} showIcon />}

            {renderPreviewTabs()}
              <UICanvasPreview uiCanvasData={uiCanvasData}/>
          </>
        )}

        {step === 'saving' && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
            <Paragraph style={{ marginTop: 16 }}>Applying changes to canvases...</Paragraph>
          </div>
        )}
      
      </Space>

    </Drawer>
  );
};

export default UICanvasAIDrawer;

