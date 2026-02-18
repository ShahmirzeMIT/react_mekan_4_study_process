import { Button, Col, DatePicker, Drawer, Form, Input, Row } from "antd"
import { SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import TextArea from "antd/es/input/TextArea";
import useSprintNewSprintCreate from "@/ui-canvas/canvas_sprint/actions/useSprintNewSprintCreate";
import { useEffect } from "react";
const SprintCreateNewSprint = ({ createFlag, setCreateFlag }) => {
    dayjs.extend(customParseFormat);
    const dateFormat = 'YYYY-MM-DD';
    const [form] = Form.useForm()
    const { handleSave } = useSprintNewSprintCreate()
    const onClose = () => {
        form.resetFields()
        setCreateFlag(false) 
    }
    const createSprint = async () => {
        const values = await form.validateFields()
        values.startDate = values.startDate.format(dateFormat) || ""
        values.endDate = values.endDate.format(dateFormat) || ""
        handleSave(values)
        onClose()
    }
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.key === "Enter") {
                e.preventDefault()
                createSprint()
            }
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [])
    return (
        <Drawer
            width="30%"
            title="New Sprint"
            closable={{ 'aria-label': 'Close Button' }}
            onClose={onClose}
            open={createFlag}
            footer={[
                <div className="flex items-center justify-start gap-2">
                    <Button type="primary" onClick={createSprint}><SaveOutlined />Create</Button>
                    <Button onClick={onClose}>Cancel</Button>
                </div>
            ]}
        >
            <Form form={form} layout="vertical">
                <Form.Item rules={[{ required: true, message: "Sprint name is reqiured!" }, {
                    validator: (_, values) => {
                        if (!values || !values.trim()) {
                            return Promise.reject("Description cannot be empty or spaces only!")
                        }
                        return Promise.resolve()
                    }
                }]} name="sprintName" label="Sprint Name">
                    <Input placeholder="Enter Sprint Name" />
                </Form.Item>
                <Row gutter={5}>
                    <Col span={12}>
                        <Form.Item name="startDate" label="Start Date">
                            <DatePicker className="w-full" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="endDate" label="End Date">
                            <DatePicker className="w-full" />
                        </Form.Item>
                    </Col>
                </Row>
                <Form.Item name="description" rules={[{
                    validator: (_, values) => {
                        if (!values || !values.trim()) {
                            return Promise.reject("Description cannot be empty or spaces only!")
                        }
                        return Promise.resolve()
                    }
                }]} label="Related Input Description">
                    <TextArea placeholder="Enter Related Input Description" rows={10} />
                </Form.Item>
            </Form>
        </Drawer>
    )
}

export default SprintCreateNewSprint