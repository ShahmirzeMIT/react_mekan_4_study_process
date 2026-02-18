import {Button, Drawer, Form, Input, Modal, Select, Space} from "antd";
import {SaveOutlined} from "@ant-design/icons";
import React, {useEffect, useState} from "react";
import useUICanvasDBUpload from "@/hooks/ui-canvas/useUICanvasDBUpload.tsx";

const {TextArea} = Input
export default React.memo(UICanvasDatabaseRelationUpdateDrawer, (prevProps, nextProps) => prevProps.open === nextProps.open);

function UICanvasDatabaseRelationUpdateDrawer({
                                                                 open,
                                                                 selectedUI,
                                                                 selectedInput,
                                                                 onClose,
                                                                 updateDBRelation,
                                                                 deleteDBRelation
                                                             }) {

    const [dbRelationValue, setDBRelationValue] = useState({
        input: "",
        description: "",
        table: "",
        field: "",
        action: "send"
    });

    const [error, setError] = useState<Record<string, string> | null>(null);
    const {databaseLoad, databaseFieldListLoad} = useUICanvasDBUpload();
    const [database, setDatabase] = useState({list: {}, fieldList: {}});

    const inputList = Object.keys(selectedUI?.input || {})?.map(item => ({
        label: selectedUI?.input?.[item].inputName ,
        value: item
    })) || [];

    useEffect(() => {
        if (open) (async () => {
            // setDBRelationValue({event: "onclick", description: "", api: ""})
            setDBRelationValue({
                input: selectedInput.id,
                description: "",
                table: "",
                field: "",
                action: "send"
            })
            const {list} = await databaseLoad();
            setDatabase((prevState) => ({...prevState, list}));
        })()
    }, [open]);

    useEffect(() => {
        if (selectedInput && open) {
            console.log(selectedInput)
            setDBRelationValue(prev => ({
                ...prev,
                input: selectedInput.inputId,
                table: selectedInput.table,
                field: selectedInput.field,
                action: selectedInput.action,
                description: selectedInput.description
            }))
        }
    }, [selectedInput, open]);

    useEffect(() => {
        if (!dbRelationValue?.table) return
        databaseFieldListLoad(dbRelationValue?.table).then(
            (fieldList) => {
                setDatabase((prevState) => ({
                    ...prevState,
                    fieldList: fieldList[dbRelationValue?.table] ? Object.keys(fieldList[dbRelationValue?.table])

                        .filter(item => fieldList[dbRelationValue.table][item].fieldName)

                        .map(item => ({
                            label: fieldList[dbRelationValue.table][item].fieldName,
                            value: item
                        })) : []
                }))
            }
        )
    }, [dbRelationValue?.table]);

    const handleSave = () => {
        updateDBRelation({...dbRelationValue, description: dbRelationValue.description || ''}, selectedInput.inputId);
        onClose()
    }

    const handleDelete = () => {
        Modal.confirm({
            content: "Are you sure to delete this description?",
            okText: "OK",
            cancelText: "Cancel",
            onOk: () => {
                deleteDBRelation(selectedInput.dbRelId, selectedInput.inputId);
                onClose();
            }
        })
    };

    const dbList = Object.keys(database.list).filter(item => database.list[item]).map(item => ({
        label: database.list[item],
        value: item
    }));

    return (
        <>
            <Drawer
                width={400}
                title="Update Table Relation"
                open={open}
                onClose={onClose}
                footer={
                    <div className="flex justify-between">
                        <Space direction="horizontal">
                            <Button
                                type="primary"
                                icon={<SaveOutlined/>}
                                onClick={handleSave}
                            >Update</Button>
                            <Button onClick={onClose}>Cancel</Button>
                        </Space>
                        <Button type="link" onClick={handleDelete}>Delete</Button>
                    </div>
                }
            >
                <Form layout="vertical">
                    <Form.Item label="Input">
                        <Select
                            onChange={(value) =>
                                setDBRelationValue({
                                    ...dbRelationValue,
                                    input: value,
                                })
                            }
                            value={dbRelationValue.input}
                            options={inputList}
                        />
                    </Form.Item>
                    <Form.Item label="Table">
                        <Select
                            showSearch
                            filterOption={(inputValue, option) => option.label.toLowerCase().includes(inputValue.toLowerCase())}
                            onChange={(value) =>
                                setDBRelationValue({
                                    ...dbRelationValue,
                                    table: value,
                                })
                            }
                            value={dbRelationValue.table}
                            options={dbList}
                        />
                    </Form.Item>
                    <Form.Item label="Field">
                        <Select
                            showSearch
                            filterOption={(inputValue, option) => option.value.toLowerCase().includes(inputValue.toLowerCase())}
                            onChange={(value) =>
                                setDBRelationValue({
                                    ...dbRelationValue,
                                    field: value,
                                })
                            }
                            value={dbRelationValue.field}
                            options={database.fieldList}
                        />
                    </Form.Item>
                    <Form.Item label="Action">
                        <Select
                            onChange={(value) =>
                                setDBRelationValue({
                                    ...dbRelationValue,
                                    action: value,
                                })
                            }
                            value={dbRelationValue.action}
                            options={[{label: "Send", value: "send"}, {label: "Get", value: "get"}]}
                        />
                    </Form.Item>
                    <Form.Item label="Description">
                        <TextArea
                            rows={5}
                            value={dbRelationValue.description}
                            onChange={(e) => setDBRelationValue({
                                ...dbRelationValue,
                                description: e.target.value,
                            })}
                            placeholder="Enter Description"
                        />
                    </Form.Item>
                </Form>
            </Drawer>

        </>
    )
}