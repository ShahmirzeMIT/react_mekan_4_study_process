import React, {useEffect, useState} from "react";
import {Button, Form, Input, message, Modal, Select, Space, Upload} from "antd";
import {InboxOutlined, SaveOutlined} from "@ant-design/icons";
import {getDownloadURL, ref, uploadBytesResumable} from "firebase/storage";
import {storage} from "@/config/firebase.ts";

const {Dragger} = Upload;

export default function UICanvasExternalLinkUpdateModal({
                                                            open,
                                                            onClose,
                                                            selectedLink,
                                                            onUpdate,
                                                            onDelete,
                                                            loading = false,
                                                        }) {
    const [form] = Form.useForm();
    const [uploading, setUploading] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [type, setType] = useState<string>("embedded");

    useEffect(() => {
        if (selectedLink && open) {
            const currentType = selectedLink.type || "embedded";
            setType(currentType);
            form.setFieldsValue({
                title: selectedLink.title,
                type: currentType,
                ...(type === "image" ? {image: selectedLink.image} : {url: selectedLink.url})
            });
            setDownloadUrl(selectedLink.url || selectedLink.image || null);
        }
    }, [selectedLink, form, open]);

    const handleUpload = (file: File) => {
        setUploading(true);
        const imageId = crypto.randomUUID();
        const storageRef = ref(storage, `external_links/${imageId}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
            "state_changed",
            null,
            (error) => {
                setUploading(false);
                console.error(error);
                message.error("Image upload failed");
            },
            async () => {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                setDownloadUrl(url);
                setUploading(false);
                message.success("Image uploaded successfully");
            }
        );

        return false; // manual upload
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();

            if (type === "image" && !downloadUrl) {
                message.error("Please upload an image first");
                return;
            }

            onUpdate?.(selectedLink?.id, {
                title: values.title,
                type: values.type,
                ...(type === "image" ? {image: downloadUrl} : {url: values.url}),
            });
            onClose();
            // message.success("Link updated successfully");
        } catch (err) {
            console.error(err);
        }
    };

    const uploadProps = {
        name: "file",
        multiple: false,
        beforeUpload: handleUpload,
        showUploadList: false,
    };

    return (
        <Modal
            title="Update External Link"
            open={open}
            onCancel={onClose}
            footer={null}
            destroyOnClose
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    label="Title"
                    name="title"
                    rules={[{required: true, message: "Please enter a title"}]}
                >
                    <Input placeholder="Enter link title"/>
                </Form.Item>

                <Form.Item
                    label="Type"
                    name="type"
                    rules={[{required: true, message: "Please select a type"}]}
                >
                    <Select
                        options={[
                            {value: "image", label: "Image"},
                            {value: "embedded", label: "Embedded"},
                        ]}
                        onChange={(value) => setType(value)}
                    />
                </Form.Item>

                {type === "embedded" ? (
                    <Form.Item
                        label="URL"
                        name="url"
                        rules={[{required: true, message: "Please enter a URL"}]}
                    >
                        <Input.TextArea rows={6} placeholder="Enter embedded URL"/>
                    </Form.Item>
                ) : (
                    <Form.Item label="Upload Image" name="file">
                        <Dragger {...uploadProps} disabled={uploading}>
                            <p className="ant-upload-drag-icon">
                                <InboxOutlined/>
                            </p>
                            <p className="ant-upload-text">
                                Click, drag & drop, or paste an image here
                            </p>
                        </Dragger>

                        {downloadUrl && (
                            <div style={{marginTop: 12, textAlign: "center"}}>
                                <img
                                    src={downloadUrl}
                                    alt="Uploaded preview"
                                    style={{
                                        maxWidth: "100%",
                                        maxHeight: 200,
                                        borderRadius: 8,
                                        marginBottom: 8,
                                    }}
                                />
                                <Button
                                    type="dashed"
                                    size="small"
                                    onClick={() => setDownloadUrl(null)}
                                >
                                    Remove Image
                                </Button>
                            </div>
                        )}
                    </Form.Item>

                )}
                <Space direction={"horizontal"} className="justify-between w-full">

                    <div style={{display: "flex", gap: 8}}>

                        <Button
                            type="primary"
                            onClick={handleSubmit}
                            loading={uploading || loading}
                            icon={<SaveOutlined/>}
                        >
                            Update
                        </Button>
                        <Button onClick={onClose}>Cancel</Button>

                    </div>
                    <Button onClick={onDelete} type="link">Delete</Button>
                </Space>

            </Form>
        </Modal>
    );
}
