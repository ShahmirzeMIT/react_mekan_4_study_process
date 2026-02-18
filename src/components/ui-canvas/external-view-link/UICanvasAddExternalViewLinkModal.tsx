import React, {useEffect} from "react";
import {Button, Form, Input, Modal, message} from "antd";
import useUICanvasExternalLinkCreate from "@/hooks/ui-canvas/external-link/useUICanvasExternalLinkCreate.tsx";
import {SaveOutlined} from "@ant-design/icons";

const AddExternalViewLinkModal = ({open, onClose}) => {
    const [form] = Form.useForm();
    const {createExternalLink} = useUICanvasExternalLinkCreate({type: "embedded"});
    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            await createExternalLink(values);
            form.resetFields();
            onClose();
        } catch (err) {
            console.error(err);
            if (err?.errorFields) {
                // Form validation errors are handled by Ant Design
                return;
            }
            message.error("Failed to create external link");
        }
    };
    useEffect(() => {
        if (open) form.resetFields()
    }, [open]);

    return (
        <Modal
            title="Add External View Link"
            open={open}
            onCancel={onClose}
            footer={
                <div style={{display: "flex", justifyContent: "flex-end", gap: 8}}>
                    <Button type="primary" onClick={handleSave} icon={<SaveOutlined/>}>
                        Create
                    </Button>
                    <Button onClick={onClose}>Cancel</Button>
                </div>}
            className="modal-bottom-border"
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    label="Title"
                    name="title"
                    required={true}
                    rules={[
                        {
                            validator: (_, value) =>
                                value && value.trim() !== ""
                                    ? Promise.resolve()
                                    : Promise.reject("Please enter a title"),
                        },
                    ]}
                >
                    <Input/>
                </Form.Item>

                <Form.Item
                    required={true}
                    label="URL"
                    name="url"
                >
                    <Input.TextArea rows={6}/>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default AddExternalViewLinkModal;
