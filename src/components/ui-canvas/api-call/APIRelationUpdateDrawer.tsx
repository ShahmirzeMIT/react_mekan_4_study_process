import {Button, Drawer, Form, Modal, Select, Space} from "antd";
import {SaveOutlined} from "@ant-design/icons";
import TextArea from "antd/es/input/TextArea";
import React, {useEffect, useState} from "react";
import useUICanvasAPICallUpload from "@/hooks/ui-canvas/useUICanvasAPICallUpload.tsx";

export default React.memo(APIRelationUpdateDrawer, (prevProps, nextProps) => prevProps.open === nextProps.open);
 function APIRelationUpdateDrawer({
                                                    open,
                                                    onClose,
                                                    updateAPICallRelation,
                                                    selectedAction,
                                                    deleteAPIRelation
                                                }) {
    const [apiList, setApiList] = useState([]);
    const {loadAPIList} = useUICanvasAPICallUpload();
    const [form] = Form.useForm();

    // Load API list & reset form on open
    useEffect(() => {
        if (open) {
            (async () => {
                form.resetFields();
                const list = await loadAPIList();
                setApiList(list);
            })();
        }
    }, [open]);

    // Set form values when selectedAction changes
    useEffect(() => {
        if (open && selectedAction) {
            form.setFieldsValue({
                event: selectedAction.event,
                api: selectedAction.api,
                description: selectedAction.description
            });
        }
    }, [selectedAction, open, form]);

    const handleSave = (values) => {
        updateAPICallRelation(values, selectedAction.inputId);
        onClose();
    };

    const handleDelete = () => {
        Modal.confirm({
            content: "Are you sure to delete this description?",
            okText: "OK",
            cancelText: "Cancel",
            onOk: () => {
                deleteAPIRelation(selectedAction.relId, selectedAction.inputId);
                onClose();
            }
        });
    };

    return (
        <Drawer
            width={400}
            title="Event API Call"
            open={open}
            onClose={onClose}
            destroyOnClose
            footer={
                <div className="flex justify-between">
                    <Space>
                        <Button
                            type="primary"
                            icon={<SaveOutlined/>}
                            onClick={() => form.submit()}
                        >
                            Update
                        </Button>
                        <Button onClick={onClose}>Cancel</Button>
                    </Space>
                    <Button type="link"  onClick={handleDelete}>
                        Delete
                    </Button>
                </div>
            }
        >
            <Form form={form} layout="vertical" onFinish={handleSave}
                  initialValues={{event: "onclick", api: "", description: ""}}>
                {/* Action Select */}
                <Form.Item
                    label="Action"
                    name="event"
                    rules={[{required: true, message: "Please select an action!"}]}
                >
                    <Select
                        placeholder="Select event action"
                        options={[
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

                {/* API Select */}
                <Form.Item
                    label="API"
                    name="api"
                    rules={[{required: true, message: "Please select an API!"}]}
                >
                    <Select
                        showSearch
                        optionLabelProp="label"
                        placeholder="Select API"
                        filterOption={(input, option) =>
                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        options={apiList
                            .filter(item => item.name && item.name !== item.id && item.name.trim() !== '')
                            .sort((a, b) => {
                                const nameA = (a.name || '').toLowerCase();
                                const nameB = (b.name || '').toLowerCase();
                                return nameA.localeCompare(nameB);
                            })
                            .map((item) => ({
                                label: item.name || item.id,
                                value: item.id
                            }))}
                    />
                </Form.Item>

                {/* Description TextArea */}
                <Form.Item
                    label="Description"
                    name="description"
                >
                    <TextArea
                        rows={5}
                        placeholder="Enter Description"
                    />
                </Form.Item>
            </Form>
        </Drawer>
    );
}
