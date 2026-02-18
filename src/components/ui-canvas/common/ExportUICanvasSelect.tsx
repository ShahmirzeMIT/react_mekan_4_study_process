import React, {useState, useRef} from "react";
import {Select, Modal, Upload, message} from "antd";
import useAPICanvasExport from "@/hooks/api-canvas/API/useAPICanvasExport.tsx";
import {ImportOutlined, ExportOutlined} from "@ant-design/icons";

const { Option } = Select;

export default function ExportUICanvasSelect({
    targetRef, 
    data,
    // Import related props
    showImportModal,
    setShowImportModal,
    importDPSFile,
    handleImportCancel,
    setFileContent,
    importLoading,
    currentProject
}) {
    const [exportType, setExportType] = useState<"image" | "json" | "import">();
    const [fileName, setFileName] = useState("export");
    const {exportCanvas, downloading} = useAPICanvasExport();
    const fileInputRef = useRef(null);

    const handleExport = async (exportType: "image" | "json") => {
        await exportCanvas({exportType, data, targetRef, filename: fileName});
    };

    const handleFileUpload = (info) => {
        const { file } = info;
        
        if (file.status === 'done') {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const content = e.target.result;
                    const parsedContent = JSON.parse(content);
                    setFileContent(parsedContent);
                    setShowImportModal(true);
                } catch (error) {
                    message.error('Invalid .dps file format');
                    console.error('Error parsing .dps file:', error);
                }
            };
            
            reader.readAsText(file.originFileObj);
        }
    };

    function handleChange(value: "image" | "json" | "import") {
        setExportType(value);
        
        if (value === "import") {
            // Trigger file input click for import
            if (fileInputRef.current) {
                fileInputRef.current.click();
            }
        } else if (value === "image" || value === "json") {
            handleExport(value);
        }
        
        // Reset the select value
        setTimeout(() => {
            setExportType(undefined);
        }, 300);
    }

    // Upload props for Import
    const uploadProps = {
        name: 'file',
        accept: '.dps,.json',
        showUploadList: false,
        customRequest: ({ file, onSuccess }) => {
            setTimeout(() => {
                onSuccess('ok');
            }, 0);
        },
        onChange: handleFileUpload,
    };

    return (
        <>
            <Upload {...uploadProps}>
                {/* Hidden file input */}
                <input 
                    type="file" 
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept=".dps,.json"
                    onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            const reader = new FileReader();
                            
                            reader.onload = (event) => {
                                try {
                                    const content = event.target.result;
                                    const parsedContent = JSON.parse(content);
                                    setFileContent(parsedContent);
                                    setShowImportModal(true);
                                } catch (error) {
                                    message.error('Invalid .dps file format');
                                    console.error('Error parsing .dps file:', error);
                                }
                            };
                            
                            reader.readAsText(file);
                            // Reset file input
                            e.target.value = '';
                        }
                    }}
                />
            </Upload>
            
            <Select 
                placeholder="Import/Export" 
                value={exportType} 
                onChange={handleChange}
                style={{width: "140px"}}
                loading={downloading || importLoading}
                suffixIcon={<ExportOutlined />}
            >
                <Option value="import">
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ImportOutlined /> Import
                    </span>
                </Option>
                <Option value="image">
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ExportOutlined /> Export Image
                    </span>
                </Option>
                <Option value="json">
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ExportOutlined /> Export JSON
                    </span>
                </Option>
            </Select>

            {/* Import Confirmation Modal */}
            <Modal
                title="Import UI Canvas"
                open={showImportModal}
                onOk={importDPSFile}
                onCancel={handleImportCancel}
                confirmLoading={importLoading}
                okText="Import"
                cancelText="Cancel"
                width={600}
            >
                {currentProject && (
                    <div>
                        <div style={{ marginBottom: 16 }}>
                            <strong>Importing to Project:</strong> {currentProject.name || currentProject.id}
                        </div>
                        <div style={{ 
                            backgroundColor: '#f6f6f6', 
                            padding: 16, 
                            borderRadius: 4,
                            marginBottom: 16
                        }}>
                            <p>This will:</p>
                            <ul style={{ marginBottom: 0 }}>
                                <li>Add this UI Canvas to the current project's digital_service_json</li>
                                <li>Create/update the UI Canvas document in the database</li>
                                <li>The UI Canvas ID will be preserved</li>
                            </ul>
                        </div>
                        <div style={{ color: '#666', fontSize: 12 }}>
                            <p>Note: If a UI Canvas with the same ID already exists, it will be overwritten.</p>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
};