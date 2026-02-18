import { Button, Col, DatePicker, Drawer, Form, Input, message, Modal, Row, Space } from "antd"
import { SaveOutlined } from '@ant-design/icons';
import TextArea from "antd/es/input/TextArea";
import { useContext, useEffect } from "react";
import { SprintContext } from "@/ui-canvas/canvas_sprint/sprintContext";
import useGetSprintById from "@/ui-canvas/canvas_sprint/actions/useGetSprintById";
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import useUpdateSprint from "@/ui-canvas/canvas_sprint/actions/useUpdateSprint";
import useSprintAllSprint from "@/ui-canvas/canvas_sprint/actions/useSprintAllSprint";
const SprintUpdateDrawer = ({ updateFlag, setUpdateFlag }) => {
    const [form] = Form.useForm()
    const { updatedId, setSelectedItems } = useContext(SprintContext)
    const { sprint } = useGetSprintById(updatedId)
    const { sprints } = useSprintAllSprint()
    const { updateSprint, deleteSprint } = useUpdateSprint()
    dayjs.extend(customParseFormat);
    useEffect(() => {
        if (sprint) {
            form.setFieldsValue({
                sprintName: sprint.sprintName,
                startDate: dayjs(sprint.startDate),
                endDate: dayjs(sprint.endDate),
                description: sprint?.description || "",
            })
        }
    }, [sprint])
    const handleSave = () => {
        const values = form.getFieldsValue()
        values.startDate = values.startDate.format('YYYY-MM-DD')
        values.endDate = values.endDate.format('YYYY-MM-DD')
        updateSprint(updatedId, values)
        setSelectedItems(prev => prev.map(item => item === sprint.sprintName ? values.sprintName : item))
        setUpdateFlag(false)
    }
    const removeSprint = () => {
        Modal.confirm({
            title: 'Are you sure to delete current Sprint?',
            content: 'Delete the sprint',
            okText: 'Ok',
            cancelText: 'No',
            centered: true,
            onOk: async () => {
                await deleteSprint(updatedId)
                setSelectedItems(prev => prev.filter(i => i !== sprint.sprintName))
                setUpdateFlag(false)
                message.success("Sprint removed successfully")
            }
        });
        setSelectedItems(sprints?.map(item => item?.sprintName))
    }
    return (
        <Drawer
            title="Update Sprint"
            closable={{ 'aria-label': 'Close Button' }}
            onClose={() => setUpdateFlag(false)}
            open={updateFlag}
            footer={[
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                        <Button onClick={handleSave} type="primary"><SaveOutlined />Update</Button>
                        <Button onClick={() => setUpdateFlag(false)}>Cancel</Button>
                    </div>
                    <Space onClick={removeSprint} className="text-blue-500 hover:underline cursor-pointer">Delete</Space>
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

export default SprintUpdateDrawer