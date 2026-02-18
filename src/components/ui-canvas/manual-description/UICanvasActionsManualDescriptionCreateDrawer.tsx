import {Button, Drawer, Form, Select, Space} from "antd";
import TextArea from "antd/es/input/TextArea";
import {SaveOutlined} from "@ant-design/icons";
import React, {useEffect, useState} from "react";

export default React.memo(UICanvasActionsManualDescriptionCreateDrawer, (prevProps, nextProps) => prevProps.open === nextProps.open);

function UICanvasActionsManualDescriptionCreateDrawer({
  open,
  onClose,
  createManualDescription,
}) {
    const [error, setError] = useState<Record<string, string> | null>(null);
  const [manualDescriptionValue, setManualDescriptionValue] = React.useState({
    event: "",
    description: "",
  });

    useEffect(() => {
    selectRef.current?.focus();
  }, [open]);

  const selectRef = React.useRef(null);

  const handleCreate = () => {
      if (manualDescriptionValue.description) {
          createManualDescription(manualDescriptionValue);
          setManualDescriptionValue({event: "", description: ""});
          // Select-ə fokus ver
          setTimeout(() => selectRef.current?.focus(), 0);
      }
  };

  return (
    <Drawer
      width={400}
      title="Add Manual Description"
      open={open}
      onClose={onClose}
      footer={
        <Space direction="horizontal">
          <Button type="primary" icon={<SaveOutlined />} onClick={handleCreate}>
            Create
          </Button>
          <Button onClick={onClose} style={{ marginRight: 8 }}>
            Cancel
          </Button>
        </Space>
      }
    >
      <Form layout="vertical">
        <Form.Item label="Action">
          <Select
            ref={selectRef}
            onChange={(value) =>
              setManualDescriptionValue({
                ...manualDescriptionValue,
                event: value,
              })
            }

            value={manualDescriptionValue.event}
            options={[
              { label: "", value: "" },
              { label: "onclick", value: "onclick" },
              { label: "onchange", value: "onchange" },
              { label: "onload", value: "onload" },
              { label: "ondblclick", value: "ondblclick" },
              { label: "onkeypress", value: "onkeypress" },
              { label: "onrightclick", value: "onrightclick" },
              { label: "onmouseover", value: "onmouseover" },
            ]}
          />

        </Form.Item>
        <Form.Item label="Description">
          <TextArea
            rows={5}
            placeholder="Enter Description"
            value={manualDescriptionValue.description}
            onChange={(e) =>
              setManualDescriptionValue({
                ...manualDescriptionValue,
                description: e.target.value,
              })

            }
            onBlur={(event) => {
                if (!event.target.value) setError({description: "Description is required"})
                else setError(null);
            }}
          />
            {error?.description && (
                <p
                    id="input-name-error"
                    role="alert"
                    aria-live="assertive"
                    className="mt-2 text-sm text-red-600 flex items-center gap-2 transition-opacity duration-150"
                >
                    {/* Basit inline SVG ikonu */}
                    <svg
                        className="h-4 w-4 flex-shrink-0"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                    >
                        <path fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-10.75a.75.75 0 10-1.5 0v4a.75.75 0 001.5 0v-4zM10 13a1 1 0 100 2 1 1 0 000-2z"
                              clipRule="evenodd"/>
                    </svg>

                    <span>{error.event}</span>
                </p>
            )}
        </Form.Item>
      </Form>
    </Drawer>
  );
}
