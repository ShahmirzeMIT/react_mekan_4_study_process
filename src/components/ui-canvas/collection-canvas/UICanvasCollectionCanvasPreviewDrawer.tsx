import React, {useEffect, useMemo, useState} from 'react';
import {Alert, Drawer, Empty, Space, Spin, Tag, Tree, Typography} from 'antd';
import {FolderOpenOutlined} from '@ant-design/icons';
import {doc, onSnapshot} from 'firebase/firestore';
import {db} from '@/config/firebase';
import type {CollectionCanvasAssignment, DocumentData} from '@/ui-canvas/collection/types';
import type {DataNode} from 'antd/es/tree';
import {buildCollectionStructureTree} from '@/utils/ui-canvas/buildCollectionStructureTree';

const {Text, Paragraph} = Typography;
const CANVAS_COLLECTION = 'collection_canvas';
const formatActionLabel = (type?: string | null) => (type === 'POST' ? 'Send' : type);

type UICanvasCollectionCanvasPreviewDrawerProps = {
    open: boolean;
    assignment: CollectionCanvasAssignment | null;
    onClose: () => void;
};

const UICanvasCollectionCanvasPreviewDrawer: React.FC<UICanvasCollectionCanvasPreviewDrawerProps> = ({open, assignment, onClose}) => {
    const [loading, setLoading] = useState(false);
    const [structureError, setStructureError] = useState<string | null>(null);
    const [treeData, setTreeData] = useState<DataNode[]>([]);

    useEffect(() => {
        if (!open) {
            setTreeData([]);
            setStructureError(null);
            setLoading(false);
            return undefined;
        }
        if (!assignment?.id) {
            setTreeData([]);
            setStructureError('Missing collection canvas reference');
            return undefined;
        }

        setLoading(true);
        setStructureError(null);
        const canvasRef = doc(db, CANVAS_COLLECTION, assignment.id);
        const unsubscribe = onSnapshot(canvasRef, (snapshot) => {
            setLoading(false);
            if (!snapshot.exists()) {
                setTreeData([]);
                setStructureError('Collection canvas not found');
                return;
            }
            const data = snapshot.data() as DocumentData;
            const {nodes} = buildCollectionStructureTree(data?.structure ?? {});
            setTreeData(nodes);
        }, (error) => {
            console.error('Failed to load collection canvas preview', error);
            setLoading(false);
            setStructureError('Unable to load collection structure');
        });

        return unsubscribe;
    }, [open, assignment?.id]);

    const selectionLabel = useMemo(() => assignment?.fieldPathLabel ?? assignment?.fieldPath?.join('/') ?? '', [assignment]);

    return (
        <Drawer
            width={460}
            title={
                <Space align="center" size={8}>
                    <FolderOpenOutlined className="text-lg text-blue-500" />
                    <span>{assignment?.label ?? 'Collection Canvas'}</span>
                </Space>
            }
            placement="right"
            open={open}
            onClose={onClose}
            destroyOnClose
        >
            {!assignment ? (
                <Alert type="info" showIcon message="Select a collection canvas to preview" />
            ) : (
                <Space direction="vertical" size="large" className="w-full">
                    <Space size={8} wrap>
                        {assignment.actionType && <Tag color="geekblue">{formatActionLabel(assignment.actionType)}</Tag>}
                        {(assignment.fieldPathLabel || assignment.fieldPath) && (
                            <Tag color="purple">{selectionLabel ? `${selectionLabel}:${assignment.fieldType}` : assignment.fieldType}</Tag>
                        )}
                        {assignment.fieldType && !assignment.fieldPathLabel && (
                            <Tag color="blue">{assignment.fieldType}</Tag>
                        )}
                    </Space>
                    {assignment.description && (
                        <Paragraph className="text-gray-700 whitespace-pre-line">{assignment.description}</Paragraph>
                    )}

                    <div className="rounded border border-gray-200 p-2">
                        {loading ? (
                            <div className="flex justify-center py-6">
                                <Spin />
                            </div>
                        ) : structureError ? (
                            <Alert type="error" showIcon message={structureError} />
                        ) : treeData.length === 0 ? (
                            <Empty description="No fields defined yet" />
                        ) : (
                            <Tree
                                showLine
                                selectable={Boolean(assignment.fieldPathLabel)}
                                defaultExpandAll
                                selectedKeys={assignment.fieldPathLabel ? [assignment.fieldPathLabel] : []}
                                treeData={treeData}
                            />
                        )}
                    </div>
                </Space>
            )}
        </Drawer>
    );
};

export default React.memo(UICanvasCollectionCanvasPreviewDrawer);
