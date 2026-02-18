import React from 'react';
import type { DataNode } from 'antd/es/tree';
import type { FieldType } from '@/ui-canvas/collection/types';

export type FieldOption = {
    key: string;
    label: string;
    path: string[];
    type: FieldType;
};

export type TreeBuildResult = {
    nodes: DataNode[];
    leaves: Record<string, FieldOption>;
};

export const inferCollectionFieldType = (value: unknown): FieldType => {
    if (Array.isArray(value)) return 'array';
    if (value === null) return 'null';
    if (value && typeof value === 'object') return 'map';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    return 'string';
};

const formatNodeTitle = (label: string, type: FieldType) => (
    <span className="flex items-center gap-2">
        <span className="font-medium text-gray-800">{label}</span>
        <span className="text-xs uppercase tracking-wide text-gray-500">{type}</span>
    </span>
);

const buildArrayNodes = (items: unknown[], path: string[]): TreeBuildResult => {
    const nodes: DataNode[] = [];
    const leaves: Record<string, FieldOption> = {};

    items.forEach((item, index) => {
        const label = `[${index}]`;
        const nextPath = [...path, index.toString()];
        const nodeKey = nextPath.join('/');
        const type = inferCollectionFieldType(item);
        const isContainer = type === 'map' || type === 'array';

        const node: DataNode = {
            key: nodeKey,
            title: formatNodeTitle(label, type),
            selectable: !isContainer,
        };

        if (type === 'map' && item && typeof item === 'object') {
            const result = buildMapNodes(item as Record<string, unknown>, nextPath);
            node.children = result.nodes;
            Object.assign(leaves, result.leaves);
        } else if (type === 'array' && Array.isArray(item)) {
            const result = buildArrayNodes(item, nextPath);
            node.children = result.nodes;
            Object.assign(leaves, result.leaves);
        } else if (!isContainer) {
            leaves[nodeKey] = {
                key: nodeKey,
                label,
                path: nextPath,
                type,
            };
        }

        nodes.push(node);
    });

    return {nodes, leaves};
};

const buildMapNodes = (value: Record<string, unknown>, path: string[]): TreeBuildResult => {
    const nodes: DataNode[] = [];
    const leaves: Record<string, FieldOption> = {};
    const entries = Object.entries(value ?? {}).sort(([a], [b]) => a.localeCompare(b));

    entries.forEach(([key, child]) => {
        const type = inferCollectionFieldType(child);
        const nextPath = [...path, key];
        const nodeKey = nextPath.join('/');
        const isContainer = type === 'map' || type === 'array';

        const node: DataNode = {
            key: nodeKey,
            title: formatNodeTitle(key, type),
            selectable: !isContainer,
        };

        if (type === 'map' && child && typeof child === 'object' && !Array.isArray(child)) {
            const result = buildMapNodes(child as Record<string, unknown>, nextPath);
            node.children = result.nodes;
            Object.assign(leaves, result.leaves);
        } else if (type === 'array' && Array.isArray(child)) {
            const result = buildArrayNodes(child, nextPath);
            node.children = result.nodes;
            Object.assign(leaves, result.leaves);
        } else if (!isContainer) {
            leaves[nodeKey] = {
                key: nodeKey,
                label: key,
                path: nextPath,
                type,
            };
        }

        nodes.push(node);
    });

    return {nodes, leaves};
};

export const buildCollectionStructureTree = (structure: Record<string, unknown> = {}): TreeBuildResult => {
    return buildMapNodes(structure, []);
};
