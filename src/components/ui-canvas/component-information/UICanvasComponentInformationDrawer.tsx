import {Button, Col, Drawer, Form, Input, Row, Select, Space} from "antd";
import {SaveOutlined} from "@ant-design/icons";
import React, {useEffect, useState} from "react";
import {componentTypeLabel} from "@/hooks/ui-canvas/types.ts";

const {Option} = Select;
const {TextArea} = Input;
const componentTypes = Object.keys(componentTypeLabel).map(item => ({value: item, label: componentTypeLabel[item]}));

interface IComponentInfo {
    cellNo: string
    componentType: string
    content: string
    inputName: string
    hasLabel?: boolean
}

export default React.memo(UICanvasComponentInformationDrawer, (prevProps, nextProps) => (prevProps.open === nextProps.open));

function UICanvasComponentInformationDrawer({open, onClose, selectedInput, createComponentInfo}) {
    const [componentInfo, setComponentInfo] = useState<IComponentInfo>({
        cellNo: "12",
        componentType: "txt",
        content: "",
        inputName: ""
    })

    function handleSave() {
        createComponentInfo(componentInfo);
        onClose()
    }

    useEffect(() => {
        if (open) {
            setComponentInfo((prevState) => ({
                ...prevState,
                inputName: selectedInput.inputName,
                cellNo: selectedInput.cellNo,
                componentType: selectedInput.componentType,
                content: selectedInput.content,
                hasLabel: selectedInput.hasLabel !== undefined ? selectedInput.hasLabel : !["btn", "hlink"].includes(selectedInput.componentType || ""),
            }))
        }
    }, [open, selectedInput])


    return <>
        <Drawer
            width={600}
            title="Component İnformation"
            open={open}
            onClose={onClose}
            footer={
                <Space direction="horizontal">
                    <Button
                        type="primary"
                        icon={<SaveOutlined/>}
                        onClick={handleSave}
                    >Update</Button>
                    <Button onClick={onClose}>Cancel</Button>
                </Space>
            }
        >
            <Form
                layout="vertical"
                style={{
                    maxWidth: 700,
                    margin: "0 auto",
                }}
            >
                {/* Input Name */}
                <Form.Item label="Input Name">
                    <Input
                        placeholder="Input Name"
                        value={componentInfo.inputName ?? ''}
                        onChange={(value) => setComponentInfo((prev) => ({...prev, inputName: value.target.value}))}
                        // onChange={handleChange}
                    />
                </Form.Item>

                {/* Component Type & Component Width */}
                <Row gutter={16}>
                    <Col xs={24} sm={12}>
                        <Form.Item label="Component Type">
                            <Select
                                value={componentInfo.componentType}
                                placeholder="Select Component Type"
                                options={componentTypes}
                                onChange={(value) => setComponentInfo((prev) => ({
                                    ...prev,
                                    componentType: value,
                                    hasLabel: ["btn", "hlink"].includes(value) ? false : (prev.hasLabel !== undefined ? prev.hasLabel : true)
                                }))}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item label="Component Width (Cell)">
                            <Select
                                placeholder="12"
                                onChange={(value) => setComponentInfo((prev) => ({...prev, cellNo: value}))}
                                value={componentInfo.cellNo}>
                                {[...Array(12)].map((_, i) => (
                                    <Option key={i + 1} value={i + 1}>
                                        {i + 1}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                {/* Content */}
                <Form.Item label="Content">
                    <TextArea
                        rows={4}
                        placeholder="Enter content..."
                        value={componentInfo.content}
                        onChange={(e) => setComponentInfo(({...componentInfo, content: e.target.value}))}/>
                </Form.Item>
            </Form>
        </Drawer>
    </>
}