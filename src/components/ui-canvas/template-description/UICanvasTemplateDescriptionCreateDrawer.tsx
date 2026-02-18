import {Button, Checkbox, Col, Drawer, Form, Input, Row, Space} from "antd";
import {SaveOutlined} from "@ant-design/icons";
import React, {useEffect, useState} from "react";

const checkboxGroup = [
    {id: "is_mandatory", label: "Is Mandatory"},
    {id: "is_unique", label: "Is Unique"},
    {id: "is_editable", label: "Is Editable"},
    {id: "is_not_editable", label: "Is Not Editable"},
    {id: "is_integer", label: "Is Integer"},
    {id: "is_float", label: "Is Float"},
    {id: "is_string", label: "Is String"},
    {id: "is_dropdown", label: "Is Dropdown"},
    {id: "is_readonly", label: "Is Readonly"},
    {id: "is_current_user", label: "Is Current User"},
    {id: "is_current_date", label: "Is Current Date"},
    {id: "is_current_time", label: "Is Current Time"},
    {id: "is_minimum_value", label: "Is Minimum Value"},
    {id: "is_maximum_value", label: "Is Maximum Value"},
    {id: "is_row_count", label: "Is Row Count"},
    {id: "is_average_value", label: "Is Average Value"},
    {id: "is_summary", label: "Is Summary"},
    {id: "close_after_click", label: "Close After Click"},
    {id: "disappear_after_click", label: "Disappear After Click"},
];


const InputFields = [
    {id: "maximum_length_is", label: "Maximum length is"},
    {id: "minimum_length_is", label: "Minimum length is"},
    {id: "after_redirect_to", label: "After redirect to"},
    {id: "successful_message_is", label: "Successful message is"},
    {id: "warning_message_is", label: "Warning message is"},
    {id: "error_message_is", label: "Error message is"},
    {id: "date_format_is", label: "Date format is"},
    {id: "time_format_is", label: "Time format is"},
    {id: "minimum_value_is", label: "Minimum value is"},
    {id: "maximum_value_is", label: "Maximum value is"},
    {id: "default_value_is", label: "Default value is"},
    {id: "placeholder_is", label: "Placeholder is"},
    {id: "minimum_selected_item_count_is", label: "Minimum selected item count is"},
    {id: "maximum_selected_item_count_is", label: "Maximum selected item count is"},
    {id: "mask_is", label: "Mask is"},
];

export default React.memo(UICanvasTemplateDescriptionCreateDrawer, (prevProps, nextProps) => (prevProps.open === nextProps.open));

function UICanvasTemplateDescriptionCreateDrawer({
                                                                    open,
                                                                    onClose,
                                                                    templateDescriptionCreate,
                                                                    selectedInput
                                                                }) {
    const [descriptionList, setDescriptionList] = useState([]);
    const [inputValues, setInputValues] = useState({});

    function handleSave() {
        templateDescriptionCreate(descriptionList)
        onClose();
    }

    const handleCheckboxChange = (label, checked) => {
        updateDescription(label, checked);
    };

    const handleInputChange = (label, e) => {
        const val = e.target.value;
        setInputValues((prev) => ({...prev, [label.id]: val}));
        updateDescription(label, val);
    };

    const updateDescription = (label, value) => {
        const id = label.id; // label’ı unique key olarak kullanabiliriz
        setDescriptionList((prev) => {
            const filtered = prev.filter((item) => item.id !== label.id);

            if (!value || value === false || value === "") {
                return filtered; // boşsa sil
            }

            return [
                ...filtered,
                {
                    id,
                    check: typeof value === "boolean",
                    ...(typeof value !== "boolean" && {label: label.label}),
                    description:
                        typeof value === "boolean"
                            ? label?.label // checkbox için
                            : `${value}`, // input için

                },
            ];
        });
    }
    useEffect(() => {
        if (open) {
            if(Object.keys(selectedInput.templateDescription || {}).length){
                const templateDescriptions = Object.values(selectedInput.templateDescription);
                const inputValue = {}
                templateDescriptions.filter(item => !item.check).forEach(item => inputValue[item.templateDescId] = item.description);
                setDescriptionList(templateDescriptions.map(item => ({...item, id: item.templateDescId})));
                setInputValues(inputValue);

            }else {
                setDescriptionList([]);
                setInputValues({});
            }
        }
    }, [open, selectedInput]);
    const onClear = () => {
        setDescriptionList([]);
        setInputValues({});
    }
    return <>
        <Drawer
            width={1000}
            open={open}
            onClose={onClose}
            title="Add Description from Template"
            footer={
                <div className="flex justify-between">

                    <Space direction="horizontal">
                    <Button
                        type="primary"
                        icon={<SaveOutlined/>}
                        onClick={handleSave}
                    >Add</Button>
                    <Button onClick={onClose}>Cancel</Button>
                </Space>
                    <Button
                        onClick={onClear}
                        className="bg-[orange] hover:!bg-[orange] hover:!text-[black]">Clear</Button>
                </div>
            }
        >
            <Form
                layout="vertical"
                style={{
                    maxWidth: 1400,
                    margin: "0 auto",
                }}
            >
                <Row gutter={16} align="top">
                    {/* === Checkbox Section === */}
                    <Col xs={24} md={12}>
                        <Row
                            gutter={[0, 4]} // dikey aralığı azaldır
                            className="gap-y-0"
                        >
                            {checkboxGroup.map((label) => (
                                <Col span={12} key={label.id} style={{padding: "0 4px"}}>
                                    <Form.Item label={null} className="m-0 !max-h-[25px]">
                                        <Checkbox
                                            checked={!!descriptionList.find(item => item.id === label.id)}
                                            onChange={(e) => handleCheckboxChange(label, e.target.checked)}
                                        >
                                            <span style={{fontSize: 13}}>{label.label}</span>
                                        </Checkbox>
                                    </Form.Item>
                                </Col>
                            ))}
                        </Row>
                    </Col>

                    {/* === Input Section === */}
                    <Col xs={24} md={12}>
                        <Row gutter={[16, 8]}>
                            {InputFields.map((field) => (
                                <Col xs={24} sm={12} md={12} key={field.id}>
                                    <Form.Item
                                        label={field.label}
                                        className="whitespace-normal flex flex-col mb-1"
                                        wrapperCol={{style: {flex: 1}}}
                                        labelCol={{style: {paddingBottom: "3px"}}}
                                    >
                                        <Input
                                            size="middle"
                                            value={inputValues?.[field.id] || ""}
                                            onChange={(e) => handleInputChange(field, e)}
                                        />
                                    </Form.Item>
                                </Col>
                            ))}
                        </Row>
                    </Col>
                </Row>
            </Form>

        </Drawer>
    </>
}