import React, {useState} from "react";
import {Select} from "antd";
import useAPICanvasExport from "@/hooks/api-canvas/API/useAPICanvasExport.tsx";
import {Option} from "antd/es/mentions";

export default function ExportAPICanvasSelect({targetRef, data}) {
    const [exportType, setExportType] = useState<"image" | "json">();
    const [fileName, setFileName] = useState("export");
    const {exportCanvas, downloading} = useAPICanvasExport();

    const handleExport = async (exportType: "image" | "json") => {
        await exportCanvas({exportType, data, targetRef, filename: fileName});
    };

    function handleChange(value: "image" | "json") {
        handleExport(value)
    }

    return (
        <Select placeholder="Export" value={exportType} onChange={handleChange}
                style={{width: "120px"}}>
            <Option value="image">Export Image</Option>
            <Option value="json">Export JSON</Option>
            </Select>
    );
};
