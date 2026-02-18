import {Button, Drawer, Form, Input, Select, Space} from "antd";
import {SaveOutlined} from "@ant-design/icons";
import React, {useEffect, useState} from "react";
import useUICanvasDBUpload from "@/hooks/ui-canvas/useUICanvasDBUpload.tsx";

const {TextArea} = Input
export default React.memo(UICanvasDatabaseRelationCreateDrawer, (prevProps, nextProps) => prevProps.open === nextProps.open);
 function UICanvasDatabaseRelationCreateDrawer({
                                                                open,
                                                                selectedUI,
                                                                selectedInput,
                                                                onClose,
                                                                createDBRelation
                                                            }) {
    const [fieldList, setFieldList] = useState([])

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
        label: selectedUI?.input?.[item].inputName,
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
        if (selectedInput) {
            setDBRelationValue(prev => ({...prev, input: selectedInput.id}))
        }
    }, [selectedInput]);

    const handleSave = () => {
        createDBRelation({
            ...dbRelationValue,
            fieldName: database?.fieldList?.find(item => item.value === dbRelationValue.field)?.label ?? '',
            tableName: dbList.find(item => item.value === dbRelationValue.table)?.label ?? '',
        });
        setDBRelationValue({
            input: "",
            description: "",
            table: "",
            field: "",
            action: "send"
        })
    }
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

    const dbList = Object.keys(database.list)
        .filter(item => database.list[item])
        .map(item => ({
        label: database.list[item],
        value: item
    }));


    return (
        <>
            <Drawer
                width={400}
                title="Create Table Relation"
                open={open}
                onClose={onClose}
                footer={
                    <Space direction="horizontal">
                        <Button
                            type="primary"
                            icon={<SaveOutlined/>}
                            onClick={handleSave}
                        >Create</Button>
                        <Button onClick={onClose}>Cancel</Button>
                    </Space>
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