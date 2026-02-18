import React, {useEffect, useState} from "react";
import {Button, Form, Input, Modal} from "antd";
import * as htmlToImage from "html-to-image";

export default React.memo(UICanvasDuplicateModal, (prevProps, nextProps) => prevProps.isOpenUICanvasDuplicateModal === nextProps.isOpenUICanvasDuplicateModal);

function UICanvasDuplicateModal({
                                                   isOpenUICanvasDuplicateModal,
                                                   setIsOpenUICanvasDuplicateModal,
                                                   duplicateUICanvas,
                                                   targetRef
                                               }) {
    const [name, setName] = useState("");
    const [loading, setLoading] = useState<boolean>(false);
    // Modal açıldığında inputu temizle
    useEffect(() => {
        if (isOpenUICanvasDuplicateModal) {
            setName("");
        }
    }, [isOpenUICanvasDuplicateModal]);

    const handleOk = async () => {
        if (name.trim()) {
            setLoading(true)
            await duplicateUICanvas(name.trim());
            await htmlToImage.toBlob(targetRef.current).then(async (blob) => {
                await navigator.clipboard.write([new ClipboardItem({"image/png": blob})])
            });
            setLoading(false);
            setIsOpenUICanvasDuplicateModal(false);
        }
    };

    const handleCancel = () => {
        setIsOpenUICanvasDuplicateModal(false);
    };

    return (
        <Modal
            title="Duplicate UI Canvas"
            open={isOpenUICanvasDuplicateModal}
            onCancel={() => setIsOpenUICanvasDuplicateModal(false)}
            footer={[
                <Button key="copy" type="primary" onClick={handleOk} className="leading-[22px]" disabled={!name.trim()}
                        loading={loading}>Duplicate</Button>,
                <Button key="cancel" onClick={handleCancel}>Cancel</Button>
            ]}
        >
            <Form layout="vertical">
                <Form.Item label="Canvas Name" required>
                    <Input
                        placeholder="Enter Canvas Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onPressEnter={handleOk}
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
}
