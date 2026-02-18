import { Button, message, Tooltip } from "antd"
import { PlusOutlined, UnorderedListOutlined } from '@ant-design/icons';
import MultiSelectWithSelectAll from "@/ui-canvas/ui_canvas_platform/canvas/BussinesCanvasComponent/Multiselect";
import { Download } from "lucide-react";
import { useContext, useState } from "react";
import useSprintAllSprint from "@/ui-canvas/canvas_sprint/actions/useSprintAllSprint";
import { SprintContext } from "@/ui-canvas/canvas_sprint/sprintContext";
import html2canvas from "html2canvas";

const SprintToolBox = ({ setCreateFlag, setUpdateFlag , current }) => {
    const { sprints } = useSprintAllSprint()
    const { selectedItems, setSelectedItems, setUpdatedId } = useContext(SprintContext)
    const updateSprintOption = (event, id) => {
        event.stopPropagation()
        setUpdateFlag(true)
        setUpdatedId(id)
    }
    
    const exportImage = async () => {
        const canvas = await html2canvas(current.current)
        canvas.toBlob(blob => {
            if (blob) {
                navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]).then(() => message.success("Image copied to clipboard")).catch(() => message.error("Something went wrong!"))
                const link = document.createElement('a')
                link.download = "canvas.jpeg";
                link.href = canvas.toDataURL("image/jpeg", 0.95)
                link.click()
            }
            else message.error("Something went wrong!")
        }) 
    }

    return (
        <div className="flex items-center justify-between">
            <Button>
                <UnorderedListOutlined />
            </Button>
            <div className='w-1/2 flex items-center gap-3'>
                <MultiSelectWithSelectAll location='sprint' event={updateSprintOption} data={sprints} selectedItems={selectedItems} setSelectedItems={setSelectedItems} />
                <Tooltip placement='bottomLeft' title="Create New Sprint"><Button type='primary' onClick={() => setCreateFlag(true)}><PlusOutlined /></Button></Tooltip>
                <Tooltip placement='bottomLeft' title="Export Image"><Button onClick={exportImage}><Download className='w-4 h-4' /></Button></Tooltip>
            </div>
        </div>
    )
}

export default SprintToolBox