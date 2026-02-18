import React, {useEffect, useState} from "react";
import {Button, Drawer, Form, Input, Modal, Select, Space} from "antd";
import {SaveOutlined} from "@ant-design/icons";

const {TextArea} = Input;
export default React.memo(UICanvasUpdateFormActionDrawer, (prevProps, nextProps) => prevProps.open === nextProps.open);

function UICanvasUpdateFormActionDrawer({
                                                           open,
                                                           onClose,
                                                           updateFormAction,
                                                           uiList,
                                                           selectedInput,
                                                           formActionDelete
                                                       }) {
    const [form] = Form.useForm();
    const [actionType, setActionType] = useState("");

    const handleFinish = (values) => {
        if (values.action === 'close_form') {
            form.setFieldsValue({ui_canvas_id: ""}); // correct method
            values.ui_canvas_id = ""; // ensure the value sent to updateFormAction is cleared
        }
        updateFormAction?.(values);
        onClose()
        // form.resetFields();
    };

    useEffect(() => {
        if (open && selectedInput) {
            form.setFieldsValue(selectedInput); // set form values
            setActionType(selectedInput.action || "")
        }
    }, [open, selectedInput]);

    function handleDelete() {
        Modal.confirm({
            content: "Are you sure to delete this description?",
            okText: "OK",
            cancelText: "Cancel",
            onOk: () => {
                formActionDelete();
                onClose();
            }
        })

    }

    return (
        <Drawer
            title="Update Form Action"
            placement="right"
            width={400}
            onClose={onClose}
            open={open}
            destroyOnClose
            footer={
                <div className="flex justify-between">
                    <Space>
                        <Button type="primary" onClick={() => form.submit()}
                                icon={<SaveOutlined/>}
                        >
                            Update
                        </Button>
                        <Button onClick={onClose}>Cancel</Button>
                    </Space>
                    <Button onClick={handleDelete} type="link">Delete</Button>
                </div>
            }
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleFinish}
                initialValues={{actionType: ""}}
            >
                <Form.Item
                    label="Action Type"
                    name="action"
                    rules={[{required: true, message: "Please select an action type"}]}
                >
                    <Select
                        placeholder="Select Action Type"
                        onChange={(value) => setActionType(value)}
                        allowClear
                    >

                        <Select.Option value="show_form">Show Form</Select.Option>
                        <Select.Option value="close_form">Close Form</Select.Option>
                        <Select.Option value="redirect">Redirect</Select.Option>
                    </Select>
                </Form.Item>

                {(actionType === "show_form" || actionType === "redirect") && (
                    <Form.Item
                        label="Related UI Canvas"
                        name="ui_canvas_id"
                        rules={[{required: true, message: "Please select a related UI canvas"}]}
                    >
                        <Select placeholder="Select Related UI Canvas">
                            {
                                uiList.map(item => (
                                    <Select.Option key={item.id} value={item.id}>{item.label}</Select.Option>)
                                )}
                        </Select>
                    </Form.Item>
                )}

                <Form.Item label="Condition" name="condition"
                           rules={[
                               {required: true}, {min: 3, message: "Condition must be at least 3 characters"},
                               {max: 50, message: "Condition cannot exceed 50 characters"}
                           ]}
                >
                    <TextArea rows={3} placeholder="Enter condition..." maxLength={50} minLength={3}/>
                </Form.Item>
            </Form>
        </Drawer>
    );
}

