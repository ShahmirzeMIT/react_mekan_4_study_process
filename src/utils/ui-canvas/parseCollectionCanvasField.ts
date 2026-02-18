import type { CanvasDescriptor } from '@/ui-canvas/collection/types';

export const parseCollectionCanvasField = (rawValue: unknown): CanvasDescriptor[] => {
    if (!rawValue) {
        return [];
    }

    if (Array.isArray(rawValue)) {
        return rawValue.filter((item): item is CanvasDescriptor => (
            typeof item?.id === 'string' && typeof item?.label === 'string'
        )).map((item) => {
            const result: CanvasDescriptor = { id: item.id, label: item.label };
            if (typeof item.description === 'string' && item.description) {
                result.description = item.description;
            }
            return result;
        });
    }

    if (typeof rawValue === 'string') {
        try {
            const parsed = JSON.parse(rawValue);
            return Array.isArray(parsed)
                ? parsed.filter((item): item is CanvasDescriptor => (
                    typeof item?.id === 'string' && typeof item?.label === 'string'
                )).map((item) => {
                    const result: CanvasDescriptor = { id: item.id, label: item.label };
                    if (typeof item.description === 'string' && item.description) {
                        result.description = item.description;
                    }
                    return result;
                })
                : [];
        } catch (error) {
            console.warn('Failed to parse collection_canvas JSON', error);
            return [];
        }
    }

    if (typeof rawValue === 'object' && rawValue !== null) {
        return Object.entries(rawValue as Record<string, { name?: string; description?: string }>).map(([id, meta]) => {
            const result: CanvasDescriptor = {
            id,
            label: typeof meta?.name === 'string' ? meta.name : id,
            };
            if (typeof meta?.description === 'string' && meta.description) {
                result.description = meta.description;
            }
            return result;
        });
    }

    return [];
};

export default parseCollectionCanvasField;
