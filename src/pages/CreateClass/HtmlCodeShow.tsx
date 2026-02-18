import { useEffect, useRef, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { EditorView } from "@codemirror/view";

interface Props {
  data: {
    previewHtml: string;
    onChange: (value: string) => void;
  };
}

// Only used ONCE on initial load
const formatHtml = (input: string): string => {
  const tab = "  ";
  const formatted: string[] = [];
  const regex = /(<\/?[^>]+>)/g;
  const parts = input.replace(/\n/g, "").split(regex).filter(Boolean);
  let indent = 0;

  for (let part of parts) {
    if (part.startsWith("</")) {
      indent = Math.max(indent - 1, 0);
    }
    if (part.match(/<[^>]+>/)) {
      formatted.push(tab.repeat(indent) + part.trim());
      if (!part.startsWith("</") && !part.endsWith("/>")) {
        indent++;
      }
    } else if (part.trim()) {
      formatted.push(tab.repeat(indent) + part.trim());
    }
  }

  return formatted.join("\n").trim();
};

export default function HtmlCodeShow({ data }: Props) {
  const { previewHtml, onChange } = data;

  // Format ONLY once on first render
  const [codeValue, setCodeValue] = useState(previewHtml);
  const [isEditing, setIsEditing] = useState(false);

  // Do NOT re-format on previewHtml update (per request)
  useEffect(() => {
    setCodeValue(previewHtml); // ← skip this
  }, [previewHtml]);
  useEffect(()=>{
    setCodeValue(formatHtml(previewHtml));
  },[])

  const handleBlur = () => {
    onChange(codeValue); // Just update, don't format again
  };

  return (
    <div
      style={{
        width: "100%",
        maxHeight: "65vh",
        overflow: "scroll",
        padding: "20px 0px",
      }}
    >
      {!isEditing ? (
        <textarea
          style={{
            width: "100%",
            height: "65vh",
            fontFamily: "monospace",
            border: "1px solid #ddd",
            borderRadius: "8px",
            background: "#f7f7f7",
            overflow: "auto",
            padding: "20px",
            whiteSpace: "pre-wrap",
          }}
          value={codeValue}
          readOnly
          onFocus={() => setIsEditing(true)}
        />
      ) : (
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: "8px",
            overflow: "hidden",
            background: "#f7f7f7",
            padding: "20px",
            position: "relative",
          }}
        >
          <CodeMirror
            value={codeValue}
            height="610px"
            extensions={[html(), EditorView.lineWrapping]}
            onChange={(value) => setCodeValue(value)}
            onBlur={handleBlur}
            theme="light"
            basicSetup={{
              lineNumbers: true,
              highlightActiveLine: true,
            }}
          />
        </div>
      )}
    </div>
  );
}
