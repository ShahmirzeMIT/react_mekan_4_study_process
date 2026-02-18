import React, {useEffect, useRef, useState} from "react";

export default function UICanvasDraggableCSSPanel({children}: { children: React.ReactNode }) {
    const [pos, setPos] = useState({ x: 100, y: 100 });
    const [dragging, setDragging] = useState(false);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const panelRef = useRef(null);

    const onMouseDown = (e) => {
        const handle = e.target.closest(".drag-handle");
        if (!handle) return;

        e.preventDefault();

        const panelEl = panelRef.current;
        const panelRect = panelEl.getBoundingClientRect();

        setDragging(true);
        // store pointer offset inside the panel so drag feels natural
        setOffset({
            x: e.clientX - panelRect.left,
            y: e.clientY - panelRect.top,
        });
    };

    const onMouseMove = (e) => {
        if (!dragging) return;

        setPos({
            x: e.clientX - offset.x,
            y: e.clientY - offset.y,
        });
    };

    const onMouseUp = () => setDragging(false);

    useEffect(() => {
        window.addEventListener("mouseup", onMouseUp);
        window.addEventListener("mousemove", onMouseMove);
        return () => {
            window.removeEventListener("mouseup", onMouseUp);
            window.removeEventListener("mousemove", onMouseMove);
        };
    });

    return (
        <div
            ref={panelRef}
            onMouseDown={onMouseDown}
            style={{
                position: "fixed",
                top: pos.y,
                left: pos.x,
                zIndex: 9999,
                width: 380,
                background: "#fff",
                border: "1px solid #ddd",
                borderRadius: 8,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                userSelect: "none",
            }}
        >
            <div
                className="drag-handle"
                style={{
                    background: "#f5f5f5",
                    padding: "6px 10px",
                    cursor: "move",
                    borderTopLeftRadius: 8,
                    borderTopRightRadius: 8,
                    fontWeight: 500,
                }}
            >
                🎨 CSS Panel
            </div>
            <div style={{ maxHeight: 500, overflow: "auto", padding: 16 }}>
                {children}
            </div>
        </div>
    );
}