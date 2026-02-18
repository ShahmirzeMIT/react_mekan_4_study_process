import React, { useState } from 'react';
import { Button, Space } from 'antd';
import { DragOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { DndContext, DragEndEvent, DragOverlay } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface DataItem {
  key: string;
  [key: string]: any;
}

interface ColumnItem {
  key: string;
  title: string;
  width?: number;
  render?: (value: any, record: DataItem, index: number) => React.ReactNode;
}

interface CustomTableProps {
  dataSource: DataItem[];
  columns: ColumnItem[];
  onEdit?: (record: any, index: number) => void;
  onDelete?: (record: any, index: number) => void;
  onDragEnd?: (oldIndex: number, newIndex: number) => void;
}

const SortableRow: React.FC<{
  id: string;
  children: React.ReactNode;
  onEdit?: (record: any, index: number) => void;
  onDelete?: (record: any, index: number) => void;
  record: any;
  index: number;
  columns: ColumnItem[];
}> = ({ id, children, onEdit, onDelete, record, index, columns }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(isDragging ? { position: 'relative', zIndex: 9999 } : {}),
  };

  return (
    <tr ref={setNodeRef} style={style} {...attributes}>
      {React.Children.map(children, (child, i) => {
        if (i === 0) {
          // Drag handle column
          return React.cloneElement(child as React.ReactElement, {
            ref: (node: HTMLElement) => {
              if (node) {
                node.addEventListener('mousedown', (e) => {
                  e.preventDefault();
                  listeners?.onMouseDown?.(e);
                });
              }
            },
            style: { cursor: 'move' },
          });
        }
        
        if (i === React.Children.count(children) - 1) {
          // Actions column
          return (
            <td key="actions" style={{ padding: '8px' }}>
              <Space>
                {onEdit && (
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => onEdit(record, index)}
                  />
                )}
                {onDelete && (
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => onDelete(record, index)}
                  />
                )}
              </Space>
            </td>
          );
        }

        // Dynamic data columns
        const columnIndex = i - 1; // Subtract 1 for the drag handle column
        const column = columns[columnIndex];
        const value = record[column.key];
        
        return (
          <td key={column.key} style={{ padding: '8px' }}>
            {column.render 
              ? column.render(value, record, index) 
              : value}
          </td>
        );
      })}
    </tr>
  );
};

const DraggableTable: React.FC<CustomTableProps> = ({
  dataSource,
  columns,
  onEdit,
  onDelete,
  onDragEnd,
}) => {
  const [data, setData] = useState<DataItem[]>(dataSource);
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleDragStart = (event: { active: any }) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (active.id !== over?.id) {
      const oldIndex = data.findIndex((item) => item.key === active.id);
      const newIndex = data.findIndex((item) => item.key === over?.id);
      const newData = arrayMove(data, oldIndex, newIndex);
      setData(newData);
      if (onDragEnd) {
        onDragEnd(oldIndex, newIndex);
      }
    }
  };

  const mergedColumns = [
    { key: 'drag', title: '', width: 50 }, // Drag handle column
    ...columns,
    { key: 'actions', title: 'Actions', width: 120 }, // Actions column
  ];

  const activeItem = activeId ? data.find((item) => item.key === activeId) : null;

  return (
    <DndContext
      modifiers={[restrictToVerticalAxis]}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {mergedColumns.map((col) => (
              <th
                key={col.key}
                style={{
                  padding: '8px',
                  textAlign: 'left',
                  borderBottom: '1px solid #f0f0f0',
                  width: col.width,
                }}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <SortableContext items={data.map((i) => i.key)} strategy={verticalListSortingStrategy}>
            {data.map((item, index) => (
              <SortableRow
                key={item.key}
                id={item.key}
                record={item}
                index={index}
                onEdit={onEdit}
                onDelete={onDelete}
                columns={columns}
              >
                <td style={{ padding: '8px', textAlign: 'center' }}>
                  <DragOutlined />
                </td>
                {columns.map((column) => (
                  <td key={column.key} style={{ padding: '8px' }}></td>
                ))}
                <td style={{ padding: '8px' }}></td>
              </SortableRow>
            ))}
          </SortableContext>
        </tbody>
      </table>
      <DragOverlay>
        {activeItem ? (
          <table style={{ width: '100%', backgroundColor: '#fff', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
            <tbody>
              <tr>
                <td style={{ padding: '8px', textAlign: 'center' }}>
                  <DragOutlined />
                </td>
                {columns.map((column) => {
                  const value = activeItem[column.key];
                  return (
                    <td key={column.key} style={{ padding: '8px' }}>
                      {column.render 
                        ? column.render(value, activeItem, data.findIndex(item => item.key === activeId)) 
                        : value}
                    </td>
                  );
                })}
                <td style={{ padding: '8px' }}>
                  <Space>
                    {onEdit && <Button size="small" icon={<EditOutlined />} disabled />}
                    {onDelete && <Button size="small" danger icon={<DeleteOutlined />} disabled />}
                  </Space>
                </td>
              </tr>
            </tbody>
          </table>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

// Usage example with dynamic fields:
const InputTable = ({
  inputs,
  opId,
  moveRow,
  editInput,
  deleteInput,
  selectedEndpoint,
  fields, // New prop for dynamic fields
}: {
  inputs: Record<string, any>;
  opId: string;
  moveRow: (opId: string, type: string, oldIndex: number, newIndex: number) => void;
  editInput: (opId: string, key: string, record: any) => void;
  deleteInput: (opId: string, key: string) => void;
  selectedEndpoint: any;
  fields: { key: string; title: string; render?: (value: any, record: any, index: number) => React.ReactNode }[];
}) => {
  const formattedData = inputs
    ? Object.entries(inputs).map(([key, item]) => ({
        ...item,
        key,
      }))
    : [];

  const handleEdit = (record: any, index: number) => {
    const keys = selectedEndpoint?.input?.[opId] ? Object.keys(selectedEndpoint.input[opId]) : [];
    const key = keys[index];
    editInput(opId, key, record);
  };

  const handleDelete = (record: any, index: number) => {
    const keys = selectedEndpoint?.input?.[opId] ? Object.keys(selectedEndpoint.input[opId]) : [];
    const key = keys[index];
    deleteInput(opId, key);
  };

  const handleDragEnd = (oldIndex: number, newIndex: number) => {
    moveRow(opId, 'input', oldIndex, newIndex);
  };

  return (
    <DraggableTable
      dataSource={formattedData}
      columns={fields} // Pass dynamic fields here
      onEdit={handleEdit}
      onDelete={handleDelete}
      onDragEnd={handleDragEnd}
    />
  );
};

export { InputTable };