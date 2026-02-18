import { Button, Drawer, Form, Select, Space } from "antd";
import { SaveOutlined } from "@ant-design/icons";
import TextArea from "antd/es/input/TextArea";
import React, { useEffect, useState } from "react";
import useUICanvasAPICallUpload from "@/hooks/ui-canvas/useUICanvasAPICallUpload.tsx";
import useApiCanvasStates from "@/hooks/api-canvas/apiCanvasStates";

export default React.memo(APIRelationCreateDrawer, (prevProps, nextProps) => prevProps.open === nextProps.open);
function APIRelationCreateDrawer({ open, onClose, createAPICallRelation }) {
    const { loadAPIList } = useUICanvasAPICallUpload();
    const [apiList, setApiList] = useState([]);
    const [form] = Form.useForm();
    
    useEffect(() => {
        if (open) {
            (async () => {
                form.resetFields();
                const list = await loadAPIList();
                setApiList(list);
            })();
        }
    }, [open]);
    console.log(apiList);
    
    const handleSave = (values) => {
        createAPICallRelation({
            ...values,
            apiName: apiList.find(item => item.id === values.api)?.name
        });
        form.resetFields();
    };

    return (
        <Drawer
            width={400}
            title="Event API Call"
            open={open}
            onClose={onClose}
            destroyOnClose
            footer={
                <Space direction="horizontal">
                    <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        onClick={() => form.submit()}
                    >
                        Create
                    </Button>
                    <Button onClick={onClose}>Cancel</Button>
                </Space>
            }
        >
            <Form
                form={form}
                onFinish={handleSave}
                layout="vertical"
                initialValues={{ event: "onclick", description: "", api: "" }}
            >
                {/* Action Select */}
                <Form.Item
                    label="Action"
                    name="event"
                    rules={[{ required: true, message: "Please select an action!" }]}
                >
                    <Select
                        placeholder="Select event action"
                        options={[
                            { label: "onclick", value: "onclick" },
                            { label: "onchange", value: "onchange" },
                            { label: "onload", value: "onload" },
                            { label: "ondblclick", value: "ondblclick" },
                            { label: "onkeypress", value: "onkeypress" },
                            { label: "onrightclick", value: "onrightclick" },
                            { label: "onmouseover", value: "onmouseover" },
                        ]}
                    />
                </Form.Item>

                <Form.Item
                    label="API"
                    name="api"
                    key="label"
                    rules={[{ required: true, message: "Please select an API!" }]}
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
                                value: item.id,
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
