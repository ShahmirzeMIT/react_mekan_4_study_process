import {Drawer, Table} from "antd";
import columnsHead from "@/ui-canvas/db-canvas copy/hooks/columns.tsx";
import React, {useEffect, useState} from "react";
import {Field} from "@/ui-canvas/db-canvas copy/actions/useDatabase.tsx";
import {doc, getDoc} from "firebase/firestore";
import {db} from "@/config/firebase.ts";

const getOrderedFields = (tableId: string, database: any): Field[] => {
    if (!tableId || !database?.field?.Field?.[tableId]) return [];

    const order =
        database.FieldOrder?.[tableId] || Object.keys(database.field?.Field?.[tableId] || {});
    return order
        .map((fieldId) => database.field?.Field?.[tableId]?.[fieldId])
        .filter((field) => field);
}
export default React.memo(UCanvasDatabasePreviewDrawer, (prevProps, nextProps) => prevProps.open === nextProps.open);

function UCanvasDatabasePreviewDrawer({open, onClose, data, zIndex = 2000}) {
    const [dbData, setDBData] = useState({});

    useEffect(() => {
        if (!data?.id) return;
        const dbCanvasDocRef = doc(db, "database_canvas", data?.id);
        getDoc(dbCanvasDocRef).then(res => {
            const dbCanvasData = res.data();
            setDBData(dbCanvasData)
        });
    }, [data?.id]);

    const currentFields = data?.id ? getOrderedFields(data?.id, dbData) : [];

    return (
        <>
        <Drawer
            open={open}
            onClose={onClose}
            title={`Database Card (${data?.name})`}
            width={800}
            zIndex={zIndex}>
            <Table
                columns={columnsHead({})}
                dataSource={currentFields}
                rowKey="id"
                pagination={false}
                size="middle"
            />
        </Drawer>
        </>)
}