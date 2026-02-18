import {Button, Drawer, Input, Space, Spin, Alert, Collapse} from "antd";
import {useState} from "react";
import {callApi} from "@/utils/callApi.ts";
import UIPrototype from "@/hooks/ui-canvas/ui-prototype/UIPrototype.tsx";
import {SaveOutlined} from "@ant-design/icons";
import useUICanvasUpdate from "@/hooks/ui-canvas/useUICanvasUpdate.tsx";

const {TextArea} = Input;
const {Panel} = Collapse;

export default function UICanvasAIDrawer({open, onClose, canvasId}) {
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [inputs, setInputs] = useState<Record<string, any> | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [rawResponse, setRawResponse] = useState<any>(null);
    const {updateUICanvas} = useUICanvasUpdate({selectedUICanvasId: canvasId})

    const handleGenerate = async () => {
        if (!prompt?.trim()) {
            setError("Please enter a prompt");
            return;
        }
        try {
            setLoading(true);
            setError(null);
            setInputs(null);
            const response = await callApi("/ui-canvas/generate-canvas", {prompt, canvasId});
            setRawResponse(response);

            // Try multiple possible response shapes
            const parsed = response?.input?.[canvasId]
                || response?.inputs?.[canvasId]
                || response?.input
                || response?.inputs
                || response?.data?.input?.[canvasId]
                || response;

            if (!parsed || (typeof parsed === 'object' && Object.keys(parsed).length === 0)) {
                setError("No UI inputs found in generator response. See raw response below.");
                setInputs(null);
            } else {
                setInputs(parsed);
            }
        } catch (e: any) {
            console.error(e);
            setError(e?.message || 'Generation failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = () => {
        try {
            if (!inputs || Object.keys(inputs).length === 0) {
                setError('Nothing to save');
                return;
            }
            updateUICanvas(inputs);
            onClose();
            setPrompt("")
            setInputs(null)
            setRawResponse(null)
            setError(null)
        } catch (e) {
            console.log(e)
            setError('Save failed')
        }
    }

    function submitWithKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === "Enter" && e.ctrlKey) {
            e.preventDefault();
            handleGenerate()
        }
    }

    return (
        <Drawer
            open={open}
            onClose={onClose}
            title="AI Assistant"
            width={1000}
            footer={
                <div style={{display: "flex", gap: 8}}>
                    <Button type="primary" icon={<SaveOutlined/>} disabled={!inputs || Object.keys(inputs).length===0}
                            onClick={handleSave}>
                        Save UI
                    </Button>
                    <Button onClick={onClose}>Cancel</Button>
                </div>
            }
        >
            <Space direction="vertical" style={{width: "100%"}}>
                <TextArea
                    rows={4}
                    placeholder="Write your prompt here... (Ctrl+Enter to generate)"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={submitWithKeyDown}
                />

                <Button
                    type="primary"
                    onClick={handleGenerate}
                    disabled={loading || !prompt.trim()}
                >
                    {loading ? <Spin size="small"/> : "Generate UI"}
                </Button>

                {error && <Alert type="error" message={error} showIcon />}
            </Space>

            {/* Preview area */}
            <div style={{marginTop: 16}}>
                <UIPrototype preview={true} componentsJson={inputs ?? {}} selectedUICanvasId={canvasId} />

                {!loading && !inputs && rawResponse && (
                    <Collapse style={{marginTop: 12}}>
                        <Panel header="Raw generator response" key="1">
                            <pre style={{whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto'}}>
                                {JSON.stringify(rawResponse, null, 2)}
                            </pre>
                        </Panel>
                    </Collapse>
                )}
            </div>
        </Drawer>
    )
}