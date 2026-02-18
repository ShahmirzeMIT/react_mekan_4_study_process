import React, {useEffect, useMemo, useState} from 'react';
import {Alert, Button, Drawer, Empty, Input, Select, Space, Spin, Tree, Typography, message} from 'antd';
import {SaveOutlined} from '@ant-design/icons';
import {useSelector} from 'react-redux';
import {doc, onSnapshot} from 'firebase/firestore';
import {RootState} from '@/store';
import {db} from '@/config/firebase';
import type {CanvasDescriptor, CollectionCanvasAssignment, DocumentData} from '@/ui-canvas/collection/types';
import {parseCollectionCanvasField} from '@/utils/ui-canvas/parseCollectionCanvasField';
import type {DataNode} from 'antd/es/tree';
import {buildCollectionStructureTree, FieldOption} from '@/utils/ui-canvas/buildCollectionStructureTree';

const {Option} = Select;
const {Paragraph, Text} = Typography;
const {TextArea} = Input;
const CANVAS_COLLECTION = 'collection_canvas';

type UICanvasCollectionCanvasDrawerProps = {
    open: boolean;
    onClose: () => void;
    selectedInput?: {
        id?: string;
        inputName?: string;
        componentType?: string;
        collectioncanvas?: Partial<CollectionCanvasAssignment> | null;
        collectionCanvas?: Partial<CollectionCanvasAssignment> | null;
    } | null;
    assignCollectionCanvasToInput: (assignment: CollectionCanvasAssignment | null) => Promise<void> | void;
};

const UICanvasCollectionCanvasDrawer: React.FC<UICanvasCollectionCanvasDrawerProps> = ({
    open,
    onClose,
    selectedInput,
    assignCollectionCanvasToInput,
}) => {
    const currentProject = useSelector((state: RootState) => state.project.currentProject);
    const [canvases, setCanvases] = useState<CanvasDescriptor[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedCanvasId, setSelectedCanvasId] = useState<string | null>(null);
    const [structureLoading, setStructureLoading] = useState(false);
    const [structureError, setStructureError] = useState<string | null>(null);
    const [treeData, setTreeData] = useState<DataNode[]>([]);
    const [fieldOptions, setFieldOptions] = useState<Record<string, FieldOption>>({});
    const [selectedFieldKey, setSelectedFieldKey] = useState<string | null>(null);
    const [notes, setNotes] = useState('');
    const [actionType, setActionType] = useState<'GET' | 'POST'>('GET');
    const [isDirty, setIsDirty] = useState(false);

    const existingAssignment = useMemo(() => selectedInput?.collectioncanvas ?? selectedInput?.collectionCanvas ?? null, [selectedInput]);

    const existingFieldKey = useMemo(() => {
        if (!existingAssignment) return null;
        if (typeof existingAssignment.fieldPathLabel === 'string') return existingAssignment.fieldPathLabel;
        if (Array.isArray(existingAssignment.fieldPath)) return existingAssignment.fieldPath.join('/');
        return null;
    }, [existingAssignment]);

    useEffect(() => {
        if (!open) return;
        setSelectedCanvasId(existingAssignment?.id ?? null);
        setSelectedFieldKey(existingFieldKey);
        setNotes(existingAssignment?.description ?? '');
        setActionType((existingAssignment?.actionType as 'GET' | 'POST') ?? 'GET');
        setIsDirty(false);
    }, [open, existingAssignment, existingFieldKey]);

    useEffect(() => {
        if (!open || !currentProject?.id) {
            setCanvases([]);
            return undefined;
        }
        setLoading(true);
        const projectRef = doc(db, 'projects', currentProject.id);
        const unsubscribe = onSnapshot(projectRef, (snapshot) => {
            setLoading(false);
            if (!snapshot.exists()) {
                setCanvases([]);
                return;
            }
            setCanvases(parseCollectionCanvasField(snapshot.data()?.collection_canvas));
        }, (error) => {
            console.error('Failed to load collection canvases', error);
            setLoading(false);
            message.error('Unable to load collection canvases');
        });
        return unsubscribe;
    }, [open, currentProject?.id]);

    useEffect(() => {
        if (!open || !selectedCanvasId) {
            setTreeData([]);
            setFieldOptions({});
            setStructureError(null);
            setStructureLoading(false);
            if (!selectedCanvasId) {
                setSelectedFieldKey(null);
            }
            return undefined;
        }

        setStructureLoading(true);
        setStructureError(null);
        const canvasRef = doc(db, CANVAS_COLLECTION, selectedCanvasId);
        const unsubscribe = onSnapshot(canvasRef, (snapshot) => {
            setStructureLoading(false);
            if (!snapshot.exists()) {
                setTreeData([]);
                setFieldOptions({});
                setStructureError('Selected canvas has no fields yet.');
                return;
            }
            const data = snapshot.data() as DocumentData;
            const {nodes, leaves} = buildCollectionStructureTree(data?.structure ?? {});
            setTreeData(nodes);
            setFieldOptions(leaves);
        }, (error) => {
            console.error('Failed to load collection canvas structure', error);
            setStructureLoading(false);
            setStructureError('Unable to load collection fields');
        });

        return unsubscribe;
    }, [open, selectedCanvasId]);

    useEffect(() => {
        if (!selectedFieldKey || structureLoading) return;
        if (selectedFieldKey && !fieldOptions[selectedFieldKey]) {
            setSelectedFieldKey(null);
        }
    }, [fieldOptions, selectedFieldKey, structureLoading]);

    const targetInputLabel = useMemo(() => {
        if (!selectedInput) return 'this input';
        return selectedInput?.inputName || selectedInput?.componentType || 'this input';
    }, [selectedInput]);

    const selectedField = useMemo(() => (selectedFieldKey ? fieldOptions[selectedFieldKey] : null), [fieldOptions, selectedFieldKey]);

    const fallbackField = useMemo(() => {
        if (!existingAssignment) return null;
        if (!selectedCanvasId || selectedCanvasId !== existingAssignment.id) return null;
        if (selectedFieldKey && existingFieldKey && selectedFieldKey !== existingFieldKey) return null;
        const resolvedPath = Array.isArray(existingAssignment.fieldPath)
            ? existingAssignment.fieldPath
            : typeof existingAssignment.fieldPathLabel === 'string'
                ? existingAssignment.fieldPathLabel.split('/').filter(Boolean)
                : [];
        const fallbackKey = existingAssignment.fieldPathLabel || resolvedPath.join('/') || existingAssignment.fieldLabel || existingAssignment.id || 'field';
        const fallbackLabel = existingAssignment.fieldLabel || resolvedPath[resolvedPath.length - 1] || existingAssignment.label || 'field';
        return {
            key: fallbackKey,
            label: fallbackLabel,
            path: resolvedPath,
            type: existingAssignment.fieldType || 'string',
        } as FieldOption;
    }, [existingAssignment, existingFieldKey, selectedCanvasId, selectedFieldKey]);

    const effectiveField = selectedField ?? fallbackField;

    const hasValidSelection = Boolean(selectedCanvasId && effectiveField);
    const canSave = hasValidSelection && (isDirty || !existingAssignment);

    const selectedFieldLabel = effectiveField?.path?.length ? effectiveField.path.join(' / ') : effectiveField?.label;

    const handleSave = async () => {
        if (!selectedInput?.id) {
            message.warning('Select an input first');
            return;
        }
        if (!selectedCanvasId) {
            message.warning('Choose a collection canvas');
            return;
        }
        if (!effectiveField) {
            message.warning('Select a field from the collection');
            return;
        }
        const descriptor = canvases.find((canvas) => canvas.id === selectedCanvasId);
        if (!descriptor) {
            message.error('Selected collection does not exist anymore');
            return;
        }

        await assignCollectionCanvasToInput({
            id: descriptor.id,
            label: descriptor.label,
            fieldPath: effectiveField.path,
            fieldPathLabel: effectiveField.key,
            fieldLabel: effectiveField.label,
            fieldType: effectiveField.type,
            description: notes,
            actionType,
        });
        setIsDirty(false);
        onClose();
    };

    const handleClear = async () => {
        if (!selectedInput?.id) return;
        await assignCollectionCanvasToInput(null);
        setSelectedCanvasId(null);
        setSelectedFieldKey(null);
        setNotes('');
        setActionType('GET');
        setIsDirty(false);
        onClose();
    };

    const isRemoveEnabled = Boolean(existingAssignment?.id);

    const renderFields = () => {
        if (!selectedCanvasId) {
            return <Empty description="Select a collection canvas to view its fields" />;
        }

        if (structureLoading) {
            return (
                <div className="flex w-full justify-center py-6">
                    <Spin />
                </div>
            );
        }

        if (structureError) {
            return <Alert type="error" showIcon message={structureError} />;
        }

        if (!treeData.length) {
            return <Empty description="No fields defined in this collection yet" />;
        }

        return (
            <div className="max-h-80 overflow-auto rounded border border-gray-100 p-2">
                <Tree
                    showLine
                    selectable
                    blockNode
                    selectedKeys={selectedFieldKey ? [selectedFieldKey] : []}
                    onSelect={(keys) => {
                        const key = (keys?.[0] as string) || null;
                        if (key && fieldOptions[key]) {
                            setSelectedFieldKey(key);
                            setIsDirty(true);
                        }
                    }}
                    treeData={treeData}
                    defaultExpandAll
                />
            </div>
        );
    };

    return (
        <Drawer
            width={420}
            title="Assign Collection Canvas"
            placement="right"
            open={open}
            onClose={onClose}
            destroyOnClose
            footer={(
                <Space>
                    <Button danger disabled={!isRemoveEnabled} onClick={handleClear}>
                        Remove
                    </Button>
                    <Button type="primary" icon={<SaveOutlined />} disabled={!canSave} onClick={handleSave}>
                        Save
                    </Button>
                    <Button onClick={onClose}>Cancel</Button>
                </Space>
            )}
        >
            {!currentProject?.id ? (
                <Alert type="warning" message="Select a project to load collection canvases." showIcon />
            ) : !selectedInput ? (
                <Alert type="info" message="Select an input first." showIcon />
            ) : (
                <Space direction="vertical" className="w-full" size="large">
                    <Paragraph>
                        Link <strong>{targetInputLabel}</strong> to a collection field so every drag action maps to a specific
                        document location.
                    </Paragraph>
                    {loading ? (
                        <div className="w-full flex justify-center py-6">
                            <Spin />
                        </div>
                    ) : canvases.length === 0 ? (
                        <Empty description="No collection canvases found" />
                    ) : (
                        <Select
                            showSearch
                            placeholder="Select a collection canvas"
                            value={selectedCanvasId ?? undefined}
                            onChange={(value) => {
                                setSelectedCanvasId(value);
                                setSelectedFieldKey(null);
                                setIsDirty(true);
                            }}
                            optionFilterProp="children"
                            className="w-full"
                        >
                            {canvases.map((canvas) => (
                                <Option key={canvas.id} value={canvas.id}>
                                    {canvas.label}
                                </Option>
                            ))}
                        </Select>
                    )}

                    {renderFields()}

                    <div className="space-y-2 w-full">
                        <Text strong>Action</Text>
                        <Select
                            value={actionType}
                            onChange={(value: 'GET' | 'POST') => {
                                setActionType(value);
                                setIsDirty(true);
                            }}
                            className="w-full"
                            options={[
                                {label: 'GET', value: 'GET'},
                                {label: 'Send', value: 'POST'},
                            ]}
                        />
                    </div>

                    {effectiveField && (
                        <Alert
                            type="success"
                            showIcon
                            message={
                                <Space direction="vertical" size={2} className="w-full">
                                    <Text strong>Selected field</Text>
                                    <Text>{selectedFieldLabel}</Text>
                                </Space>
                            }
                        />
                    )}

                    <div className="space-y-2">
                        <Text strong>Notes</Text>
                        <TextArea
                            rows={4}
                            placeholder="Add any context or instructions for this assignment"
                            value={notes}
                            onChange={(event) => {
                                setNotes(event.target.value);
                                setIsDirty(true);
                            }}
                        />
                    </div>
                </Space>
            )}
        </Drawer>
    );
};

export default React.memo(UICanvasCollectionCanvasDrawer);
