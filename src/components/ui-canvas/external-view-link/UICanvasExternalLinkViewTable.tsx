import {Button, Modal, Select, Space, Table} from "antd";
import React, {useState} from "react";
import useUICanvasExternalLinkSetDefault from "@/hooks/ui-canvas/external-link/useUICanvasExternalLinkSetDefault.tsx";
import useUICanvasExternalLinkUpdateType from "@/hooks/ui-canvas/external-link/useUICanvasExternalLinkUpdateType.tsx";
import {DeleteOutlined, EditOutlined} from "@ant-design/icons";
import UICanvasExternalLinkUpdateModal
    from "@/components/ui-canvas/external-view-link/UICanvasExternalLinkUpdateModal.tsx";
import useUICanvasExternalLinkUpdate from "@/hooks/ui-canvas/external-link/useUICanvasExternalLinkUpdate.tsx";
import useUICanvasExternalLinkDelete from "@/hooks/ui-canvas/external-link/useUICanvasExternalLinkDelete.tsx";
// hook yolunu öz strukturuna görə dəyiş

export default function UICanvasExternalLinkViewTable({tableData}) {
    const [isOpenExternalLinkUpdateModal, setIsOpenExternalLinkUpdateModal] = useState(false);
    const [selectedLink, setSelectedLink] = useState(null);
    // 🔄 Firestore listener
    const {setDefault} = useUICanvasExternalLinkSetDefault();
    const {updateExternalLinkType} = useUICanvasExternalLinkUpdateType();
    const {updateExternalLink} = useUICanvasExternalLinkUpdate();
    const {deleteExternalLink} = useUICanvasExternalLinkDelete();

    const handleTypeChange = (id, newType) => {
        updateExternalLinkType(id, newType)
    };


    const columns = [
        {
            title: "#",
            dataIndex: "order",
            width: 50,
        },
        {
            title: "Title",
            dataIndex: "title",
            width: 150,
        },
        {
            title: "File Name",
            dataIndex: "file_name",
            width: 100,
        },
        {
            title: "URL Content",
            dataIndex: "url",
            render: (_, record) => {

                return record.type === 'image' ? <img src={record?.image || record?.url} alt="image"
                                                      className="w-[100px] h-[100px] object-cover"/> : record.url

            }
        },
        {
            title: "Type",
            dataIndex: "type",
            width: 150,
            render: (_, record) => (
                <Select
                    size="small"
                    style={{width: "100%"}}
                    value={record.type}
                    onChange={(value) => handleTypeChange(record.id, value)}
                    options={[
                        {value: "image", label: "image"},
                        {value: "embedded", label: "embedded"},
                    ]}
                />
            ),
        },
        {
            title: "",
            dataIndex: "defaultView",
            width: 120,
            align: "center",
            render: (_, record) =>
                <Space direction="horizontal">
                    {record?.defaultView ? (
                        <strong>Default View</strong>
                    ) : (
                        <Button
                            type="default"
                            onClick={() => setDefault(record.id)}
                            size="small"
                        >
                            Set as Default
                        </Button>
                    )}
                    <Button
                        type="text"
                        icon={<EditOutlined/>}
                        onClick={() => handleEdit(record)}
                        className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    />
                    <Button
                        type="text"
                        icon={<DeleteOutlined/>}
                        onClick={() => handleDelete(record?.id)}
                        className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    />
                </Space>
            ,
        },
        // {
        //     title: "",
        //     key: "action",
        //     width: 80,
        //     align: "center",
        //     render: (_, record) => (
        //         <Space direction="horizontal">
        //             <Button
        //                 type="text"
        //                 icon={<EditOutlined/>}
        //                 onClick={() => handleEdit(record)}
        //             />
        //             <Button
        //                 type="text"
        //                 icon={<DeleteOutlined/>}
        //                 onClick={() => handleDelete(record?.id)}
        //             />
        //
        //         </Space>
        //     ),
        // },
    ];

    function handleEdit(record) {
        setSelectedLink(record);
        setIsOpenExternalLinkUpdateModal(true);
    }

    function handleDelete(id: string) {
        Modal.confirm({
            content: "Are you sure to delete this link?",
            okText: "OK",
            cancelText: "Cancel",
            onOk: () => {
                deleteExternalLink(id ? id : selectedLink?.id);
                setIsOpenExternalLinkUpdateModal(false);
            }
        })
    }

    return (
        <>
            <Table
                dataSource={tableData}
                columns={columns}
                pagination={false}
                size="middle"
                rowClassName="group"
                bordered
            />
            <UICanvasExternalLinkUpdateModal
                open={isOpenExternalLinkUpdateModal}
                onClose={() => setIsOpenExternalLinkUpdateModal(false)}
                selectedLink={selectedLink}
                onUpdate={updateExternalLink}
                onDelete={handleDelete}
            />
        </>
    );
}
