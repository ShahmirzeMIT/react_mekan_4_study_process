import {useState} from "react";
import {message} from "antd";
import * as htmlToImage from 'html-to-image';

export default function useAPICanvasExport() {
    const [downloading, setDownloading] = useState(false);

    const downloadBlob = (blob: Blob, name: string = "export") => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    const exportJSON = async (data: any, filename: string = "export") => {
        try {
            setDownloading(true);
            const jsonString = JSON.stringify(data ?? {}, null, 2);
            const blob = new Blob([jsonString], {type: "application/json"});
            downloadBlob(blob, filename.trim() ? `${filename.trim()}.dps` : "export.dps");
            message.success("JSON exported");
        } catch (err) {
            console.error(err);
            message.error("Failed to export JSON");
        } finally {
            setDownloading(false);
        }
    };

    const exportImage = async (targetRef: React.RefObject<HTMLElement>, filename: string = "export.png") => {
        if (!targetRef.current) return;
        setDownloading(true);
        htmlToImage.toBlob(targetRef.current)
            .then(async (blob) => {
                await navigator.clipboard.write([new ClipboardItem({"image/png": blob})])
                downloadBlob(blob)
                setDownloading(false);
                message.success("Image exported and copied to clipboard");
            })
            .catch((err) => console.error(err));
    };

    const exportCanvas = async ({
                                    exportType,
                                    data,
                                    targetRef,
                                    filename,
                                }: {
        exportType: "json" | "image";
        data?: any;
        targetRef?: React.RefObject<HTMLElement>;
        filename?: string;
    }) => {
        if (exportType === "json") {
            await exportJSON(data, filename);
        } else if (exportType === "image") {
            await exportImage(targetRef!, filename);
        }
    };

    return {exportCanvas, downloading};
}
