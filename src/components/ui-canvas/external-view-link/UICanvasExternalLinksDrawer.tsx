import React, {useState} from "react";
import {Button, Drawer, Space} from "antd";
import AddExternalViewLinkModal from "@/components/ui-canvas/external-view-link/UICanvasAddExternalViewLinkModal.tsx";
import UICanvasExternalLinkUploadImageModal
    from "@/components/ui-canvas/external-view-link/UICanvasExternalLinkUploadImageModal.tsx";
import UICanvasExternalLinkImageClipboardCopyModal
    from "@/components/ui-canvas/external-view-link/UICanvasExternalLinkImageClipboardCopyModal.tsx";
import UICanvasExternalLinkViewTable from "@/components/ui-canvas/external-view-link/UICanvasExternalLinkViewTable.tsx";

export default React.memo(UICanvasExternalLinksDrawer,(prevProps,nextProps)=> prevProps.open === nextProps.open)
 function UICanvasExternalLinksDrawer({open, onClose, tableData}) {
    const [isOpenAddExternalLinkModal, setIsOpenAddExternalLinkModal] = useState(false);
    const [isOpenAddExternalUploadImageModal, setIsOpenAddExternalUploadImageModal] = useState(false);
    const [isOpenAddExternalClipboardImageModal, setIsOpenAddExternalClipboardImageModal] = useState(false);


    return (
        <>
            <Drawer
                title="External View Link"
                open={open}
                onClose={onClose}
                width={900}
                bodyStyle={{paddingTop: 12}}
            >
                <Space style={{marginBottom: 16}}>
                    <Button type="default" onClick={() => setIsOpenAddExternalLinkModal(true)}>
                        Add External View Link
                    </Button>
                    <Button type="default" onClick={() => setIsOpenAddExternalUploadImageModal(true)}>
                        Upload Image
                    </Button>
                    <Button type="default" onClick={() => setIsOpenAddExternalClipboardImageModal(true)}>
                        Upload from Clipboard
                    </Button>
                </Space>

                <UICanvasExternalLinkViewTable tableData={tableData}/>
            </Drawer>

            {/* Modals */}
            <AddExternalViewLinkModal
                open={isOpenAddExternalLinkModal}
                onClose={() => setIsOpenAddExternalLinkModal(false)}
            />

            <UICanvasExternalLinkUploadImageModal
                open={isOpenAddExternalUploadImageModal}
                onClose={() => setIsOpenAddExternalUploadImageModal(false)}
            />
            <UICanvasExternalLinkImageClipboardCopyModal
                open={isOpenAddExternalClipboardImageModal}
                onClose={() => setIsOpenAddExternalClipboardImageModal(false)}
            />
        </>
    );
}
