import React, {Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef, useState} from "react";
import {
    Button,
    Checkbox,
    Col,
    DatePicker,
    Divider,
    Form,
    Input,
    message,
    Radio,
    Row,
    Select,
    Table,
    TimePicker,
    Typography,
    Upload
} from "antd";
import {DndProvider, useDrag, useDrop} from "react-dnd";
import {buildDisplayOrderData} from "@/utils/ui-canvas/buildDisplayOrderData.ts";
import {doc, getDoc, updateDoc} from "firebase/firestore";
import {db} from "@/config/firebase.ts";
import {UploadOutlined} from "@ant-design/icons";
import {parseCssString} from "@/utils/ui-canvas/parseCssString.ts";
import UICanvasDraggableCSSPanel from "@/components/ui-canvas/ui-prototype/UICanvasDraggableCSSPanel.tsx";
import {ComponentJson, ComponentsJson} from "@/components/ui-canvas/common/types.ts";
import {debounce} from "@/utils/ui-canvas/debounce.ts";
import {deviceOptions} from "@/components/ui-editor/types.ts";
import {HTML5Backend} from "react-dnd-html5-backend";

const { Text } = Typography;





interface UIDisplayProps {
    componentsJson: ComponentsJson;
    selectedUICanvasId: string;
    isShowUIViewCSSColumn?: boolean;
    selectedComponent?: ComponentJson | null,
    setSelectedComponent?: Dispatch<SetStateAction<ComponentJson | null>>
    preview: boolean
}



const COMPONENT_TYPE = "COMPONENT";


async function updatePrototypes(componentsJson, selectedUICanvasId) {

    const uiCanvasDocRef = doc(db, "ui_canvas", selectedUICanvasId);
    const docSnap = await getDoc(uiCanvasDocRef);
    const docData = docSnap.data();
    const canvasInputs = docData?.input?.[selectedUICanvasId] || {};

    const updatedAllInput = {
        ...docData.input,
        [selectedUICanvasId]: { ...canvasInputs, ...componentsJson }
    };
    try {
        await updateDoc(uiCanvasDocRef, { input: updatedAllInput });
        // message.success("Components updated successfully!");

    } catch (e) {
        console.error(e);
        message.error("Error updating");
    }

}

export default React.memo(UIPrototype, (prevProps, nextProps) => prevProps.selectedUICanvasId === nextProps.selectedUICanvasId && prevProps.componentsJson === nextProps.componentsJson && prevProps.isShowUIViewCSSColumn === nextProps.isShowUIViewCSSColumn)
 function UIPrototype({
                                           preview = false,
                                           componentsJson,
                                           selectedUICanvasId,
                                           isShowUIViewCSSColumn = false,
                                           selectedComponent,
                                           setSelectedComponent
                                       }: UIDisplayProps) {
    const [containerCss, setContainerCss] = useState<string>("width: 900px; height: auto;");
    const cssRef = useRef<Record<string, string>>({});
    const [cssTarget, setCssTarget] = useState<"container" | "component">("container");
    const [components, setComponents] = useState<ComponentsJson>(componentsJson);

    const renderRef = useRef(false);

    useEffect(() => {
        if (Object.keys(componentsJson).length === 0) {
            setComponents({} as ComponentsJson);
            setContainerCss("width: 900px; height: auto")
            return
        }
        const newCss =
            componentsJson?.css && componentsJson.css.trim() !== ""
                ? componentsJson.css
                : "width: 900px; height: auto;";
        setComponents(componentsJson);
        setContainerCss(newCss);
        setTimeout(() => renderRef.current = true, 1000)
    }, [componentsJson]);


    const moveComponent = (dragId: string, hoverId: string) => {
        setComponents(prev => {
            const newState = { ...prev };

            const dragComp = { ...newState[dragId] };
            const hoverComp = { ...newState[hoverId] };
            if (!dragComp || !hoverComp) return prev;

            // Parent id’leri al
            const dragParentId = dragComp.fkTableId ?? dragComp.fkGroupId ?? "root";
            const hoverParentId = hoverComp.fkTableId ?? hoverComp.fkGroupId ?? "root";

            // Eğer parent değişiyorsa dragComp parent’ını hoverComp parent’ına ayarla
            if (dragParentId !== hoverParentId) {
                if (["table", "tbl"].includes(hoverComp.componentType)) {
                    dragComp.fkTableId = hoverComp.id;
                    dragComp.hasLabel = false
                    dragComp.fkGroupId = null;
                } else if (["grp", "group"].includes(hoverComp.componentType)) {
                    dragComp.fkGroupId = hoverComp.id;
                    if (!dragComp.hasLabel && !["btn", "hlink"].includes(dragComp.componentType)) dragComp.hasLabel = true
                    dragComp.fkTableId = null;
                } else {
                    if (!dragComp.hasLabel && !["btn", "hlink"].includes(dragComp.componentType)) dragComp.hasLabel = true
                    dragComp.fkTableId = hoverComp.fkTableId ?? null;
                    dragComp.fkGroupId = hoverComp.fkGroupId ?? null;
                }
            }

            // Drag ve hover componentlerin order değerlerini swap et
            const tempOrder = dragComp.order ?? 0;
            dragComp.order = hoverComp.order ?? 0;
            hoverComp.order = tempOrder;

            // State’e yaz
            newState[dragComp.id] = dragComp;
            newState[hoverComp.id] = hoverComp;
            updatePrototypes?.(newState, selectedUICanvasId);
            return newState;
        });
    };

    // === Component Item ===

    const ComponentItem = React.memo(({ component, allComponents, className }: {
        component: ComponentJson;
        allComponents: ComponentJson[];
        className?: string;
    }) => {
        const ref = useRef<HTMLDivElement>(null);

        const [, drag] = useDrag(() => ({
            canDrag: !preview,
            type: COMPONENT_TYPE,
            item: { id: component.id },
        }));

        const [, drop] = useDrop({
            accept: COMPONENT_TYPE,
            drop: (item: { id: string }, monitor) => {
                if (!ref.current) return;
                if (monitor.didDrop()) return; // alt elemana bırakıldıysa durdur
                if (item.id === component.id) return;

                moveComponent(item.id, component.id);
            },
        });

        if (!preview) drag(drop(ref));

        // sadece componentCss renderComponent'a gönderilecek
        const customComponentStyle = {
            ...parseCssString(component?.css?.['componentCss'] ?? '')
        };

        const isSelected = selectedComponent?.id === component.id;

        const isChildSelected = allComponents.some(
            c => c.fkGroupId === component.id && c.id === selectedComponent?.id
        );

        const shouldHighlight = isSelected && !isChildSelected;
        return (
            <div
                ref={!preview ? ref : undefined}
                className={`flex flex-col gap-1.5 ${!preview ? "cursor-move" : ""}  bg-transparent rounded-[5px] hover:shadow-sm transition-all ${shouldHighlight ? "!bg-[#fafafa]" : ""}`}
                style={{
                    width: `calc(${(Number(component.cellNo ?? 12) / 12) * 100}% - 8px)`,
                    minHeight: 32,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                }}
                onClick={(e) => {
                    e.stopPropagation()
                    setSelectedComponent(component)
                }}
            >
                <div className="p-1.5 flex flex-col bg-transparent" style={{
                    width: "100%",
                    ...parseCssString(component?.css?.['containerCss'] ?? '')
                }}>
                    {component.inputName && component.hasLabel && !["btn", "hlink"].includes(component.componentType) && (
                        <Text style={{
                            width: "inherit",
                            height: "inherit",
                            opacity: "inherit",
                            borderRadius: "inherit",
                            padding: component?.css?.['containerCss']?.includes("padding") ? "inherit" : "0px",
                            margin: component?.css?.['containerCss']?.includes("margin") ? "inherit" : "0px",
                            fontSize: component?.css?.['containerCss']?.includes("font-size") ? "inherit" : "13px",
                            fontWeight: "inherit",
                            color: "inherit",
                            background: "inherit",
                            fontFamily: "inherit",
                            fontStyle: "inherit",
                        }}>
                            {component.inputName}
                        </Text>
                    )}
                    {["group", "grp"].includes(component.componentType)
                        ? renderGroup(component, allComponents, className)
                        : ["table", "tbl"].includes(component.componentType)
                            ? renderTable(component, allComponents)
                            : renderComponent(component, customComponentStyle)
                    }
                </div>
            </div>
        );
    }, (prevProps, nextProps) => prevProps.component === nextProps.component);


    const renderComponent = (c: ComponentJson, customComponentStyle = {}) => {
        // unique className oluştur
        const uniqueClass = `component-${c.id}`;

        if (Object.keys(customComponentStyle).length > 0) {
            const styleTagId = `style-${uniqueClass}`;
            if (!document.getElementById(styleTagId)) {
                const styleTag = document.createElement("style");
                styleTag.id = styleTagId;

                // tüm CSS propertylerini key/value ile ekle
                const cssString = Object.entries(customComponentStyle)
                    .map(([key, value]) => `${key}: ${value} !important;`)
                    .join("\n");

                styleTag.innerHTML = `
                .${uniqueClass} .ant-select-selector,
                .${uniqueClass} .ant-input,
                .${uniqueClass} .ant-input-number,
                .${uniqueClass} .ant-picker,
                .${uniqueClass} .ant-btn,
                .${uniqueClass} .ant-checkbox-wrapper,
                .${uniqueClass} .ant-radio-wrapper,
                .${uniqueClass} span,
                .${uniqueClass} label {
                    ${cssString}
                }

                .${uniqueClass} .ant-select-item {
                    ${customComponentStyle.color ? `color: ${customComponentStyle.color} !important;` : ""}
                }
            `;

                document.head.appendChild(styleTag);
            }
        }

        switch (c.componentType) {
            case "txt":
                return <Input className={uniqueClass} defaultValue={c.content} style={{ width: "100%" }} />;

            case "cmb":
                return (
                    <Select
                        className={uniqueClass}
                        style={{ width: "100%" }}
                        defaultValue={c.content?.split("\n")[0]}
                        options={(c.content?.split("\n") || []).map(x => ({ label: x, value: x }))}
                    />
                );

            case "btn":
                return <Button className={`whitespace-normal shrink-0 h-auto min-h-[30px] ${uniqueClass} `
                }
                               type="primary">{c.content || "Button"}</Button>;

            case "txa":
                return <Input.TextArea className={uniqueClass} rows={2} defaultValue={c.content} />;

            case "rbtn":
                return (
                    <Radio.Group className={uniqueClass} defaultValue={c.content?.split("\n")[0]}>
                        {(c.content?.split("\n") || []).map(x => (
                            <Radio key={x} value={x}>{x}</Radio>
                        ))}
                    </Radio.Group>
                );
            case"irbtn":
                return (
                    <Radio className={uniqueClass} defaultChecked>{c.content || ''}</Radio>
                );

            case "cbox":
                return (
                    <Checkbox.Group className={uniqueClass} defaultValue={[c.content?.split("\n")?.[0]]}>
                        {(c.content?.split("\n") || []).map(x => (
                            <Checkbox key={x} value={x}>{x}</Checkbox>
                        ))}
                    </Checkbox.Group>
                );

            case "icbox":
                return (
                    <Checkbox className={uniqueClass} defaultChecked>
                        {c.content || ""}
                    </Checkbox>
                );

            case "date":
                return <DatePicker className={uniqueClass} style={{ width: "100%" }} />;

            case "time":
                return <TimePicker className={uniqueClass} style={{ width: "100%" }} />;

            case "lbl":
                return <Text className={uniqueClass}>{c.content}</Text>;

            case "file":
                return (
                    <Upload className={uniqueClass}>
                        <Button icon={<UploadOutlined />}>
                            {c.content || "Upload File"}
                        </Button>
                    </Upload>
                );

            case "hlink":
                return (
                    <a href={c.content || "#"} target="_blank" rel="noopener noreferrer" className={uniqueClass}>
                        {c.content || "Link"}
                    </a>
                );

            case "img":
                return (
                    <img
                        src={c.content || "https://via.placeholder.com/120x80?text=Image"}
                        alt={c.inputName || "image"}
                        className={uniqueClass}
                        style={{ width: "100%", height: "auto", borderRadius: 6 }}
                    />
                );

            case "ytube":
                return (
                    <iframe
                        width="100%"
                        height="200"
                        src={`https://www.youtube.com/embed/${c.content || ""}`}
                        title="YouTube video"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className={uniqueClass}
                    />
                );

            // table ve group renderComponent tarafından yönetilmiyor
            case "tbl":
            case "table":
            case "group":
            case "grp":
                return null;

            default:
                return <div className={uniqueClass}>{c.content}</div>;
        }
    };



    const renderGroup = (component: ComponentJson, allComponents: ComponentJson[], className) => {
        const children = allComponents.filter(c => c?.fkGroupId === component.id);
        return (
            <div className={`flex flex-wrap gap-2.5 p-1  ${className}`}>
                {children.map(c => (
                    <ComponentItem key={c.id} component={c} allComponents={allComponents} />
                ))}
            </div>
        );
    };

    const renderTable = (component: ComponentJson, allComponents: ComponentJson[]) => {
        const children = allComponents.filter(c => c?.fkTableId === component.id).sort((a, b) => a.order - b.order);

        const columns = children.map(c => ({
            title: c.inputName || " ",
            dataIndex: c.inputName || c.id,
            render: (content) => {
                return <ComponentItem
                    key={c.id}
                    component={{...c, ...(content && {content}), cellNo: 12, hasLabel: false}}
                    allComponents={allComponents}
                />
            },
        }));
        const inputs = children.filter(c => ["txt", "txa", "lbl"].includes(c.componentType));

        const linesByInput = inputs.map(c =>
            c.content?.trim()?.split("\n").filter(Boolean) || []
        );

        const maxLen = Math.max(...linesByInput.map(arr => arr.length));

        const childrenWithContent = Array.from({length: maxLen}, (_, i) => {
            const item = {};

            inputs.forEach((c, idx) => {
                item[c.inputName] = linesByInput[idx][i] || "";
            });
            return item;
        });

        const childrenWithoutContent = childrenWithContent
            .filter(c => c.componentType !== 'txt' && c.componentType !== 'lbl' && c.componentType !== 'txa').length > 0 ? [{}] : [];
        const data = children.length > 0 ? [...childrenWithContent] : [];
        return <Table columns={columns} dataSource={data} pagination={false} size="small" scroll={{ x: "max-content" }} />
    };

    const updateCss = (property: string, value: string) => {
        if (!selectedComponent) return;

        setComponents(prev => {
            const id = selectedComponent.id;
            const targetKey = cssTarget === "container" ? "containerCss" : "componentCss";
            const oldCss = prev[id]?.css?.[targetKey] || "";

            // Əgər property artıq varsa → onu əvəz et
            const regex = new RegExp(`${property}:\\s*[^;]+;?`, "i");
            let newCss = "";

            if (regex.test(oldCss)) {
                // Mövcud dəyəri dəyişdir
                newCss = oldCss.replace(regex, `${property}: ${value};`);
            } else {
                // Yeni property əlavə et
                newCss = `${oldCss.trim()} ${property}: ${value};`.trim();
            }
            const data = {
                ...prev,
                [id]: {
                    ...prev[id],
                    css: {
                        ...prev[id]?.css,
                        [targetKey]: newCss,
                    },
                },
            }
            updatePrototypes(data, selectedUICanvasId)
            return data;
        });
    };

    const updateAllCss = (newCss: string) => {
        if (!selectedComponent) return;

        setComponents(prev => {
            const id = selectedComponent.id;
            const targetKey = cssTarget === "container" ? "containerCss" : "componentCss";

            return {
                ...prev,
                [id]: {
                    ...prev[id],
                    css: {
                        ...prev[id]?.css,
                        [targetKey]: newCss,
                    },
                },
            };
        });
    };

    const getCssValue = (property: string, target = cssTarget) => {
        if (!selectedComponent) return "";
        const targetKey = target === "container" ? "containerCss" : "componentCss";
        const cssString = components?.[selectedComponent?.id]?.css?.[targetKey] || "";
        return cssString.match(new RegExp(`${property}:\\s*([^;]+)`))?.[1] || "";
    };
    const getAllCss = (target = cssTarget) => {
        if (!selectedComponent) return "";

        const targetKey = target === "container" ? "containerCss" : "componentCss";
        let cssString = components?.[selectedComponent?.id]?.css?.[targetKey] || "";

        cssString = cssString
            .split("\n")
            .map(s => s.trim())
            .filter(Boolean)
            .map(s => s.endsWith(";") ? s : s + ";")
            .join("\n");

        return cssString;
    };

    useEffect(() => {
        if (!selectedComponent) return;

        const allCssString = getAllCss(cssTarget);
        const cssEntries: Record<string, string> = {};

        allCssString.split(";").forEach(entry => {
            const [key, value] = entry.split(":").map(s => s?.trim());
            if (key && value) {
                const camelKey = key.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
                cssEntries[camelKey] = value;
            }
        });

        // 🔹 px'leri temizle ve ref'e yaz
        cssRef.current = {
            ...cssEntries,
            allCss: allCssString,
            width: cssEntries.width?.replace("px", "") || "",
            height: cssEntries.height?.replace("px", "") || "",
            fontSize: cssEntries.fontSize?.replace("px", "") || "",
            borderRadius: cssEntries.borderRadius?.replace("px", "") || "",
            borderWidth: cssEntries.borderWidth?.replace("px", "") || "",
            paddingTop: cssEntries.paddingTop?.replace("px", "") || "",
            paddingBottom: cssEntries.paddingBottom?.replace("px", "") || "",
            paddingLeft: cssEntries.paddingLeft?.replace("px", "") || "",
            paddingRight: cssEntries.paddingRight?.replace("px", "") || "",
            marginTop: cssEntries.marginTop?.replace("px", "") || "",
            marginBottom: cssEntries.marginBottom?.replace("px", "") || "",
            marginLeft: cssEntries.marginLeft?.replace("px", "") || "",
            marginRight: cssEntries.marginRight?.replace("px", "") || "",
            background: cssEntries.background || "#ffffff",
            color: cssEntries.color || "#000000",
            opacity: cssEntries.opacity || "",
            fontWeight: cssEntries.fontWeight || "",
            fontStyle: cssEntries.fontStyle || "",
            textAlign: cssEntries.textAlign || "",
            fontFamily: cssEntries.fontFamily || "",
            borderStyle: cssEntries.borderStyle || "",
        };
    }, [cssTarget, selectedComponent, getAllCss]);

    const handleChange = useCallback(
        debounce((key: string, val: string) => {
            cssRef.current[key] = val;
        }, 150),
        []
    );
     const orderedComponents = useMemo(
         () => buildDisplayOrderData(Object.values(components)),
         [components]
     );

    return (
        <DndProvider backend={HTML5Backend}>
            <Row className="shadow-prototype rounded-md">
            <Col span={isShowUIViewCSSColumn ? 18 : 24} className="text-[13px]">
                <div style={{ ...parseCssString(containerCss || "width: 900px; height: auto;"), transition: "all 0.3s" }} className="p-4 overflow-auto rounded-[5px]">
                    {orderedComponents.length > 0 && (
                        <div className="flex flex-wrap gap-0 px-3 border border-gray-200 shadow-sm rounded-md">
                            {orderedComponents
                                .filter(c => !c?.fkGroupId && !c?.fkTableId)
                                .map(c => (
                                    <ComponentItem
                                        key={c.id}
                                        component={c}
                                        allComponents={orderedComponents}
                                        className={`${["group", "grp"].includes(c.componentType) ? "bg-[#f6f6f6] rounded-[5px]" : ""}`}
                                    />
                                ))}
                        </div>
                    )}
                </div>
            </Col>

            <Col span={isShowUIViewCSSColumn ? 6 : 0}>
                <UICanvasDraggableCSSPanel>
                    <div>
                        <Form layout="vertical">
                            <Form.Item label="Canvas">
                                <Select
                                    defaultValue="Responsible"
                                    getPopupContainer={(triggerNode) => triggerNode.parentNode}
                                    onChange={(value) => {
                                        const device = deviceOptions.find(d => d.value === value);
                                        if (!device) return;

                                        const { width, height } = device;

                                        // Responsible üçün reset
                                        if (value === "Responsible") {
                                            setContainerCss("");

                                            return;
                                        }

                                        let newCss = containerCss;

                                        if (width) {
                                            if (newCss.includes("width:"))
                                                newCss = newCss.replace(/width:\s*[^;]+;/, `width: ${width}px;`);
                                            else newCss += `width: ${width}px;`;
                                        }

                                        if (height) {
                                            if (newCss.includes("height:"))
                                                newCss = newCss.replace(/height:\s*[^;]+;/, `height: ${height}px;`);
                                            else newCss += `height: ${height}px;`;
                                        }

                                        setContainerCss(newCss);
                                    }}
                                    value={
                                        deviceOptions.find(
                                            (item) =>
                                                String(item.width) ===
                                                containerCss.match(/width:\s*([^;]+)/)?.[1]?.replace("px", "") &&
                                                String(item.height) ===
                                                containerCss.match(/height:\s*([^;]+)/)?.[1]?.replace("px", "")
                                        )?.value || "Responsible"
                                    }
                                    onBlur={() => {
                                        updatePrototypes({...components, css: containerCss}, selectedUICanvasId)
                                        setComponents(prev => ({
                                            ...prev,
                                            css: containerCss,
                                        }))
                                    }}
                                >
                                    {deviceOptions.map((d) => (
                                        <Select.Option key={d.value} value={d.value}>
                                            {d.label}
                                        </Select.Option>
                                    ))}

                                </Select>
                            </Form.Item>

                            <Row gutter={8}>
                                <Col span={12}>
                                    <Form.Item label="Width (px)">
                                        <Input
                                            type="number"
                                            value={
                                                (() => {
                                                    const widthMatch = containerCss.match(/width:\s*([^;]+)/)?.[1];
                                                    if (!widthMatch) return "900"; // hiç width yoksa → 900
                                                    if (widthMatch.includes("%")) return ""; // 100% ise input boş
                                                    return widthMatch.replace("px", "");
                                                })()
                                            }
                                            onChange={(e) => {
                                                const val = e.target.value;

                                                // boşsa width property’sini sil
                                                let newCss = containerCss;
                                                if (val === "") {
                                                    newCss = newCss.replace(/width:\s*[^;]+;?/, "").trim();
                                                } else {
                                                    newCss = newCss.includes("width:")
                                                        ? newCss.replace(/width:\s*[^;]+;/, `width: ${val}px;`)
                                                        : newCss + `width: ${val}px;`;
                                                }

                                                setContainerCss(newCss);
                                            }}
                                            onBlur={() => setComponents(prev => ({
                                                ...prev,
                                                css: containerCss
                                            }))}
                                        />
                                    </Form.Item>
                                </Col>

                                <Col span={12}>
                                    <Form.Item label="Height (px)">
                                        <Input
                                            type="number"
                                            value={containerCss.match(/height:\s*([^;]+)/)?.[1]?.replace("px", "") || ""}
                                            onChange={(e) => {
                                                const val = e.target.value;

                                                let newCss = containerCss;
                                                if (val === "") {
                                                    newCss = newCss.replace(/height:\s*[^;]+;?/, "").trim();
                                                } else {
                                                    newCss = newCss.includes("height:")
                                                        ? newCss.replace(/height:\s*[^;]+;/, `height: ${val}px;`)
                                                        : newCss + `height: ${val}px;`;
                                                }

                                                setContainerCss(newCss);
                                            }}
                                            onBlur={() => setComponents(prev => ({
                                                ...prev,
                                                css: containerCss
                                            }))}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Divider />

                            <Form layout="vertical">
                                <Form.Item label="CSS Target">
                                    <Radio.Group
                                        value={cssTarget}
                                        onChange={(e) => setCssTarget(e.target.value)}
                                        optionType="button"
                                        buttonStyle="solid"
                                    >
                                        <Radio.Button value="container">Container</Radio.Button>
                                        <Radio.Button value="component">Component</Radio.Button>
                                    </Radio.Group>
                                </Form.Item>

                                <Form.Item label="Custom CSS">
                                    <Input.TextArea
                                        rows={8}
                                        disabled={!selectedComponent}
                                        defaultValue={cssRef.current.allCss}
                                        onChange={(e) => handleChange("allCss", e.target.value)}
                                        onBlur={(e) => updateAllCss(e.target.value)}
                                    />
                                </Form.Item>

                                <Row gutter={8}>
                                    <Col span={12}>
                                        <Form.Item label="Width (px)">
                                            <Input
                                                type="number"
                                                disabled={!selectedComponent}
                                                defaultValue={cssRef.current.width}
                                                onChange={(e) => handleChange("width", e.target.value)}
                                                onBlur={(e) => {
                                                    const val = e.target.value;
                                                    updateCss("width", val ? `${val}px` : "");
                                                }}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item label="Height (px)">
                                            <Input
                                                type="number"
                                                disabled={!selectedComponent}
                                                defaultValue={cssRef.current.height}
                                                onChange={(e) => handleChange("height", e.target.value)}
                                                onBlur={(e) => {
                                                    const val = e.target.value;
                                                    updateCss("height", val ? `${val}px` : "");
                                                }}
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Form.Item label="Background Color">
                                    <Input
                                        type="color"
                                        disabled={!selectedComponent}
                                        defaultValue={cssRef.current.background}
                                        onChange={(e) => handleChange("background", e.target.value)}
                                        onBlur={(e) => updateCss("background", e.target.value)}
                                    />
                                </Form.Item>

                                <Form.Item label="Font Color">
                                    <Input
                                        type="color"
                                        disabled={!selectedComponent}
                                        defaultValue={cssRef.current.color}
                                        onChange={(e) => handleChange("color", e.target.value)}
                                        onBlur={(e) => updateCss("color", e.target.value)}
                                    />
                                </Form.Item>

                                <Form.Item label="Font Size (px)">
                                    <Input
                                        type="number"
                                        disabled={!selectedComponent}
                                        defaultValue={cssRef.current.fontSize}
                                        onChange={(e) => handleChange("fontSize", e.target.value)}
                                        onBlur={(e) => {
                                            const val = e.target.value;
                                            updateCss("font-size", val ? `${val}px` : "");
                                        }}
                                    />
                                </Form.Item>

                                <Form.Item label="Border Width (px)">
                                    <Input
                                        type="number"
                                        disabled={!selectedComponent}
                                        defaultValue={cssRef.current.borderWidth}
                                        onChange={(e) => handleChange("borderWidth", e.target.value)}
                                        onBlur={(e) => {
                                            const val = e.target.value;
                                            updateCss("border-width", val ? `${val}px` : "");
                                        }}
                                    />
                                </Form.Item>

                                <Form.Item label="Border Style">
                                    <Select
                                        disabled={!selectedComponent}
                                        defaultValue={cssRef.current.borderStyle || ""}
                                        onChange={(val) => {
                                            cssRef.current.borderStyle = val;
                                        }}
                                        onBlur={() => updateCss("border-style", cssRef.current.borderStyle || "")}
                                    >
                                        <Select.Option value="">Select Border Style</Select.Option>
                                        <Select.Option value="solid">Solid</Select.Option>
                                        <Select.Option value="dashed">Dashed</Select.Option>
                                        <Select.Option value="dotted">Dotted</Select.Option>
                                    </Select>
                                </Form.Item>
                            </Form>

                        </Form>
                    </div>

                </UICanvasDraggableCSSPanel>
            </Col>

        </Row>
        </DndProvider>
    );
}
