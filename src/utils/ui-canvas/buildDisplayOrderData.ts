export const buildDisplayOrderData = (data) => {
    // support both object ({"id": {...}}) and array([..., ...]) inputs
    const arr = Array.isArray(data) ? data : Object.values(data || {});
    const result = [];

    // normalize values we will check on parent nodes (lowercase for safe compare)
    const normalize = (v) => (v === undefined || v === null) ? "" : String(v).trim();

    // build simple lookup maps to find potential parents by several keys
    const byId = new Map();           // parent.id -> parent
    const byFkTableId = new Map();    // parent.fkTableId -> parent
    const byTableName = new Map();    // parent.tableName -> parent
    const byFkGroupId = new Map();    // parent.fkGroupId -> parent
    const byGroupName = new Map();    // parent.groupName -> parent (if exists)

    arr.forEach(item => {
        const id = normalize(item.id);
        if (!id) return;
        byId.set(id, item);

        const fkTableId = normalize(item.fkTableId);
        if (fkTableId) byFkTableId.set(fkTableId, item);

        const tableName = normalize(item.tableName);
        if (tableName) byTableName.set(tableName.toLowerCase(), item);

        const fkGroupId = normalize(item.fkGroupId);
        if (fkGroupId) byFkGroupId.set(fkGroupId, item);

        const groupName = normalize(item.groupName);
        if (groupName) byGroupName.set(groupName.toLowerCase(), item);
    });

    // children mapping: key -> [children]
    const fkMap = arr.reduce((acc, d) => {
        const fkTable = normalize(d.fkTableId);
        const fkGroup = normalize(d.fkGroupId);

        // choose which fk key to use for grouping; preserve empty string as falsy
        if (fkTable) {
            if (!acc[fkTable]) acc[fkTable] = [];
            acc[fkTable].push(d);
        } else if (fkGroup) {
            if (!acc[fkGroup]) acc[fkGroup] = [];
            acc[fkGroup].push(d);
        } else {
            // items with no fkTableId/fkGroupId considered potential parents - do nothing here
        }
        return acc;
    }, {});

    // parents: primary rule -> no fkTableId && no fkGroupId
    // additionally, include items that are referenced by fkMap keys (so we don't miss synthetic parents)
    const parentCandidates = arr.filter(d => !normalize(d.fkTableId) && !normalize(d.fkGroupId));

    // also ensure we include items that correspond to fkMap keys but might not be "no-fk" items
    // e.g., when fkMap key is "book_table" and there's an item whose fkTableId === "book_table" OR tableName === "Books"
    const extraParents = new Set();
    Object.keys(fkMap).forEach(fkKey => {
        // try to resolve fkKey to an actual parent item:
        const byIdItem = byId.get(fkKey);
        const byFkTableItem = byFkTableId.get(fkKey);
        const byTableNameItem = byTableName.get(fkKey.toLowerCase());
        const byFkGroupItem = byFkGroupId.get(fkKey);
        const byGroupNameItem = byGroupName.get(fkKey.toLowerCase());

        const resolved = byIdItem || byFkTableItem || byTableNameItem || byFkGroupItem || byGroupNameItem;
        if (resolved && !parentCandidates.includes(resolved)) {
            extraParents.add(resolved);
        }
    });

    const parents = [
        ...parentCandidates.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
        ...Array.from(extraParents).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    ];

    let displayCounter = 1;

    const addWithChildren = (item) => {
        const newItem = {...item, displayIndex: `${displayCounter}`};
        result.push(newItem);

        // find children using multiple resolution strategies:
        const itemId = normalize(item.id);
        const itemFkTableId = normalize(item.fkTableId);
        const itemTableName = normalize(item.tableName).toLowerCase();

        // collect children candidates from fkMap by:
        // 1) key === item.id
        // 2) key === item.fkTableId
        // 3) key === item.tableName (lowercased)
        const childrenKeys = new Set();
        if (itemId) childrenKeys.add(itemId);
        if (itemFkTableId) childrenKeys.add(itemFkTableId);
        if (itemTableName) childrenKeys.add(itemTableName);

        // also include children that have parent.id stored in their fkTableId implicitly
        // gather children arrays
        let children = [];
        childrenKeys.forEach(k => {
            const arrChildren = fkMap[k] || [];
            if (arrChildren.length) children = children.concat(arrChildren);
        });

        // remove duplicates and sort by order
        const seen = new Set();
        children = children.filter(c => {
            if (!c || !c.id) return false;
            if (seen.has(c.id)) return false;
            seen.add(c.id);
            return true;
        }).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        children.forEach((child, i) => {
            result.push({
                ...child,
                displayIndex: `${displayCounter}.${i + 1}`
            });
        });

        displayCounter += 1;
    };

    parents.forEach(parent => addWithChildren(parent));

    // Finally, if there are any items not included yet (orphans), append them at the end with indexes
    const includedIds = new Set(result.map(r => r.id));
    const orphans = arr.filter(d => !includedIds.has(d.id))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    orphans.forEach((o, idx) => {
        result.push({...o, displayIndex: `${displayCounter}.${idx + 1}`});
    });

    // sort by numeric displayIndex (works for indexes like "1", "1.1", "2", etc.)
    const parseIndex = (s) => {
        const parts = String(s).split('.').map(p => Number(p));
        // convert to a comparable number: major + minor / 100
        return (parts[0] || 0) + ((parts[1] || 0) / 100);
    };

    return result.sort((a, b) => parseIndex(a.displayIndex) - parseIndex(b.displayIndex));
};
