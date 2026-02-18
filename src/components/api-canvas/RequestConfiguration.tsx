import {Col, Collapse, Input, Row, Select, Space} from 'antd';
import {useEffect, useState} from 'react';

const {Panel} = Collapse;
const {Option} = Select;
export default function RequestConfiguration({
                                                 selectedEndpoint,
                                                 updateConfig,
                                                 updateNameAndUrl
                                             }
) {
    const [value, setValue] = useState(selectedEndpoint?.name || "");

    useEffect(() => {
        setValue(selectedEndpoint?.name || "");
    }, [selectedEndpoint]);

    useEffect(() => {

        if (value === (selectedEndpoint?.name || "")) return;

        const timeout = setTimeout(() => {
            updateNameAndUrl(value);
        }, 600);

        return () => clearTimeout(timeout);
    }, [value]);

    return (
        <Space direction="vertical" style={{width: "100%"}}>
            <Row gutter={8}>
                <Col span={6}>
                    <Select
                        value={selectedEndpoint?.config?.method}
                        style={{width: "100%"}}
                        onChange={(value) => updateConfig("method", value)}
                    >
                        <Option value="GET">GET</Option>
                        <Option value="POST">POST</Option>
                        <Option value="PUT">PUT</Option>
                        <Option value="DELETE">DELETE</Option>
                    </Select>
                </Col>
                <Col span={18}>
                    <Input
                        value={value} // Use name instead of localUrl
                        onChange={(e) => setValue(e.target.value)}
                        placeholder="Endpoint name and URL"
                    />
                </Col>
            </Row>

            <Input
                value={selectedEndpoint?.config?.filePath}
                onChange={(e) =>
                    updateConfig("filePath", e.target.value)
                }
                placeholder="File path in project"
            />

            <Input.TextArea
                value={selectedEndpoint?.config?.localHeader}
                onChange={(e) =>
                    updateConfig("localHeader", e.target.value)
                }
                placeholder="Request headers"
                rows={2}
            />
        </Space>

    )
}
