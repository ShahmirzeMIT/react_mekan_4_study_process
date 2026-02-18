import {Button, Drawer, Form, Modal, Select, Space} from "antd";
import TextArea from "antd/es/input/TextArea";
import {SaveOutlined} from "@ant-design/icons";
import React, {useEffect, useState} from "react";

export default React.memo(UICanvasActionsManualDescriptionUpdateDrawer, (prevProps, nextProps) => prevProps.open === nextProps.open);

function UICanvasActionsManualDescriptionUpdateDrawer({
                                                                         open,
                                                                         onClose,
                                                                         updateManualDescription,
                                                                         selectedAction,
                                                                         deleteManualDescription
                                                                     }) {
    const [error, setError] = useState<Record<string, string> | null>(null);
    const [manualDescriptionValue, setManualDescriptionValue] = React.useState({
        event: "",
        description: "",
    });

    useEffect(() => {
        selectRef.current?.focus();
    }, [open]);

    const selectRef = React.useRef(null);

    const handleUpdate = () => {
        if (manualDescriptionValue.description) {
            updateManualDescription(manualDescriptionValue, selectedAction.inputId);
            setManualDescriptionValue({event: "", description: ""});
            onClose()
        }
    };

    useEffect(() => {
        if (selectedAction && open) {
            setManualDescriptionValue({event: selectedAction.event, description: selectedAction.description});
        }
    }, [open, selectedAction]);

    const handleDelete = () => {
        Modal.confirm({
            content: "Are you sure to delete this description?",
            okText: "OK",
            cancelText: "Cancel",
            onOk: () => {
                deleteManualDescription(selectedAction.id, selectedAction.inputId);
                onClose();
            }
        })

    };

    return (
        <Drawer
            width={400}
            title="Update Manual Description"
            open={open}
            onClose={onClose}
            footer={
                <div className="flex justify-between">
                    <Space direction="horizontal">
                        <Button type="primary" icon={<SaveOutlined/>} onClick={handleUpdate}>
                            Update
                        </Button>
                        <Button onClick={onClose} style={{marginRight: 8}}>
                            Cancel
                        </Button>
                    </Space>
                    <Button type="link" onClick={handleDelete}>
                        Delete
                    </Button>
                </div>
            }
        >
            <Form layout="vertical">
                <Form.Item label="Action">
                    <Select
                        ref={selectRef}
                        onChange={(value) =>
                            setManualDescriptionValue({
                                ...manualDescriptionValue,
                                event: value,
                            })
                        }

                        value={manualDescriptionValue.event}
                        options={[
                            {label: "", value: ""},
                            {label: "onclick", value: "onclick"},
                            {label: "onchange", value: "onchange"},
                            {label: "onload", value: "onload"},
                            {label: "ondblclick", value: "ondblclick"},
                            {label: "onkeypress", value: "onkeypress"},
                            {label: "onrightclick", value: "onrightclick"},
                            {label: "onmouseover", value: "onmouseover"},
                        ]}
                    />

                </Form.Item>
                <Form.Item label="Description">
                    <TextArea
                        rows={5}
                        placeholder="Enter Description"
                        value={manualDescriptionValue.description}
                        onChange={(e) =>
                            setManualDescriptionValue({
                                ...manualDescriptionValue,
                                description: e.target.value,
                            })

                        }
                        onBlur={(event) => {
                            if (!event.target.value) setError({description: "Description is required"})
                            else setError(null);
                        }}
                    />
                    {error?.description && (
                        <p
                            id="input-name-error"
                            role="alert"
                            aria-live="assertive"
                            className="mt-2 text-sm text-red-600 flex items-center gap-2 transition-opacity duration-150"
                        >
                            {/* Basit inline SVG ikonu */}
                            <svg
                                className="h-4 w-4 flex-shrink-0"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                aria-hidden="true"
                            >
                                <path fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-10.75a.75.75 0 10-1.5 0v4a.75.75 0 001.5 0v-4zM10 13a1 1 0 100 2 1 1 0 000-2z"
                                      clipRule="evenodd"/>
                            </svg>

                            <span>{error.event}</span>
                        </p>
                    )}
                </Form.Item>
            </Form>
        </Drawer>
    );
}
