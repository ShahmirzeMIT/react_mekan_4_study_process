import {Card, Col, Drawer, Input, Row, Select, Space, Table} from "antd";
import {DownloadOutlined} from "@ant-design/icons";
import React, {useEffect, useState} from "react";
import useUICanvasInputColumns from "@/hooks/ui-canvas/input/useUICanvasInputColumns.tsx";
import {RootState, useAppSelector} from "@/store";
import {doc, getDoc, onSnapshot} from "firebase/firestore";
import {db} from "@/config/firebase.ts";
import UICanvasLinksView from "@/components/ui-canvas/external-view-link/UICanvasLinksView.tsx";
import useUICanvasExternalLinksLoad from "@/hooks/ui-canvas/external-link/useUICanvasExternalLinksLoad.tsx";
import UIPrototype from "@/hooks/ui-canvas/ui-prototype/UIPrototype.tsx";
import APICanvasDetailsDrawer from "@/components/ui-canvas/common/APICanvasDetailsDrawer.tsx";
import UCanvasDatabasePreviewDrawer from "@/components/ui-canvas/database-relation/UCanvasDatabasePreviewDrawer.tsx";

const { TextArea } = Input
export default React.memo(UICanvasPreviewDrawer, (prevProps, nextProps) => prevProps.open === nextProps.open)

function UICanvasPreviewDrawer({open, onClose, data, zIndex = 2100}) {
    const [uiList, setUIList] = useState([]);
    const [externalLinkData, setExternalLinkData] = useState(null);
    const [selectedLink, setSelectedLink] = useState({id: 'ui_prototype'});
    const currentProject = useAppSelector((state: RootState) => state.project.currentProject)
    const [currentCanvas, setCurrentCanvas] = useState({input: {}, description: ""});
    const [apiCanvasDrawerData, setApiCanvasDrawerData] = useState({open: false, data: null});
    const [dbCanvasDrawerData, setDBCanvasDrawerData] = useState({open: false, data: null});
    useUICanvasExternalLinksLoad(() => {
    }, setExternalLinkData, data?.id)

    useEffect(() => {
        if (!data?.id) return;
        const unsubscribe = onSnapshot(doc(db, "ui_canvas", data?.id), (snapshot) => {
            const canvasData = snapshot.data();
            const {...rest} = canvasData ?? {};
            setCurrentCanvas({input: rest.input[data?.id] ?? {}, description: rest.description ?? ""});
        });
        return () => unsubscribe();
    }, [data?.id]);

    useEffect(() => {
        if (!currentProject?.id) return;
        const projectsDocRef = doc(db, "projects", currentProject?.id);
        getDoc(projectsDocRef).then(res => {
            const listJson = res.get("digital_service_json");
            const listObject = JSON.parse(listJson ? listJson : "{}");
            const list = Array.isArray(listObject) ? listObject : Object.keys(listObject).map(item => ({id: item, label: listObject[item]}))
            setUIList(list ?? []);
        })

    }, [currentProject?.id]);

    const [inputColumns, setInputColumns] = useState([]);
    const { inputTableData } = useUICanvasInputColumns({
        setInputColumns,
        readOnly: true,
        uiList,
        selectedUI: {input: {...currentCanvas?.input ?? {}}},
        selectedUICanvasId: data?.id,
        setApiCanvasDrawerData,
        setDBCanvasDrawerData
    });

    return (
        <>
            <Drawer
                open={open}
                onClose={onClose}
                title={`UI Canvas Card (${uiList.find(item => item.id == data?.id)?.label || ''})`}
                width={window.innerWidth * 0.8}
                zIndex={zIndex}
            >

                <Row gutter={24} style={{ height: "calc(100% - 60px)" }}>
                    <Col span={24}>
                        <Space
                            direction="vertical"
                            style={{ width: "100%" }}
                            size="large"
                        >
                            <Card
                                headStyle={{ background: "rgba(0, 0, 0, 0.02)" }}
                                // bordered={false}
                                title={
                                    <Space
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            // marginBottom: "8px",
                                        }}
                                    >
                                        <span>Description</span>
                                    </Space>
                                }
                            >
                                <TextArea
                                    rows={5}
                                    placeholder="Enter description..."
                                    value={currentCanvas?.description || ""}
                                    readOnly={true}
                                />
                            </Card>

                            <Card
                                headStyle={{ background: "rgba(0, 0, 0, 0.02)" }}
                                // bordered={false}
                                title={
                                    <Space
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            // marginBottom: "8px",
                                        }}
                                    >
                                        <Space direction="horizontal">
                                            <span>UI View</span>
                                            <Select
                                                value={selectedLink?.id}
                                                onChange={(value) => setSelectedLink({ id: value })}
                                                options={[{
                                                    label: "UI Prototype",
                                                    value: "ui_prototype"
                                                }, ...externalLinkData?.map(item => ({
                                                    label: item.title,
                                                    value: item?.id
                                                })) || []]}
                                                style={{ width: 140 }}
                                            />
                                        </Space>
                                    </Space>
                                }
                            >
                                {selectedLink?.id === 'ui_prototype' ? <UIPrototype
                                        selectedUICanvasId={data?.id}
                                        isShowUIViewCSSColumn={false}
                                        componentsJson={currentCanvas?.input ?? {}}
                                    /> :

                                    <UICanvasLinksView selectedLink={selectedLink} externalLinkData={externalLinkData}/>
                                }

                            </Card>
                            <Card
                                headStyle={{ background: "rgba(0, 0, 0, 0.02)" }}
                                title={
                                    <Space
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                        }}
                                    >
                                        <span>
                                            <DownloadOutlined className="text-[24px] mr-2" />
                                            Input & Description
                                        </span>
                                    </Space>
                                }
                            >
                                <Table
                                    columns={inputColumns}
                                    dataSource={inputTableData.map((item, index) => ({
                                        ...item as any,
                                        index: index + 1
                                    }))}
                                    pagination={false}
                                    bordered
                                    size="small"
                                    style={{ marginTop: 16 }}
                                    rowKey="key-form"

                                />
                            </Card>
                        </Space>
                    </Col>
                </Row>

            </Drawer>
            <APICanvasDetailsDrawer
                open={apiCanvasDrawerData.open}
                onClose={() => setApiCanvasDrawerData({open: false, data: null})}
                data={apiCanvasDrawerData.data}
                zIndex={zIndex + 10}
            />
            <UCanvasDatabasePreviewDrawer
                open={dbCanvasDrawerData.open}
                onClose={() => setDBCanvasDrawerData({open: false, data: null})}
                data={dbCanvasDrawerData.data}
                zIndex={zIndex + 10}
            />
        </>
    )
}