import { Box } from "@mui/material";
import { Editor } from "@tinymce/tinymce-react";
import { Button, Form, Input, Modal, Select } from "antd";
import { useEffect, useRef, useState } from "react";

// import { useHtmlCode } from "../context/useHtmlCode";
// import HtmlPreviewsComponents from "./HtmlPreviewsComponents";

interface Props {
  data: {
    value: string;
    onChange: (value: string) => void;
  };
}

export default function HtmlEditorComp({ data }: Props) {
  const editorRef = useRef<any>(null);
  // const {setContent}=useHtmlCode()
  const [isHtmlModalVisible, setIsHtmlModalVisible] = useState(false);
  const [isLinkImageModalVisible, setIsLinkImageModalVisible] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [isTableModalVisible, setIsTableModalVisible] = useState(false);
  const [rows, setRows] = useState<number>(2);
  const [cols, setCols] = useState<number>(2);
  const [headers, setHeaders] = useState<string[]>([]);
  const [imageLink, setImageLink] = useState("");
  const handleInsertTable = () => {
    if (editorRef.current) {
      let tableHtml = `<table border="1" style="width: 100%; border-collapse: collapse;">`;
      tableHtml += "<tr>";
      // Add headers
      headers.forEach((header) => {
        tableHtml += `<th>${header}</th>`;
      });
      tableHtml += "</tr>";

      // Add table rows and columns
      for (let i = 0; i < rows; i++) {
        tableHtml += "<tr>";
        for (let j = 0; j < cols; j++) {
          tableHtml += `<td>Row ${i + 1} Col ${j + 1}</td>`;
        }
        tableHtml += "</tr>";
      }
      tableHtml += "</table>";

      editorRef.current.insertContent(tableHtml);
      setIsTableModalVisible(false);
      setCols(2)
      setRows(2)
      setHeaders([])

    }
  };

  const handleAddLinkImage = (link:string) => {
    if (editorRef.current) {
      editorRef.current.insertContent(
        `<img src="${link}" alt="Placeholder Image" style="max-width: 100%;">`
      );
    }
  };
  const handleAddImageFromModal = () => {
    handleAddLinkImage(imageLink);
    setIsLinkImageModalVisible(false);
    setImageLink("");
  };
  

  const updateHeaderValue = (value: string, index: number) => {
    const updatedHeaders = [...headers];
    updatedHeaders[index] = value;
    setHeaders(updatedHeaders);
  };

  const handleEditorChange = (content: string) => {
    data.onChange(content);
    
    setPreviewHtml(content);
    // setContent(content)
  };
  const handleCloseLinkImageModal = () => {
    setIsLinkImageModalVisible(false);
  }

  const handleHtmlModalClose = () => {
    setIsHtmlModalVisible(false);
    setSelectedTag("");
  };

  const handleInsertTag = () => {
    if (editorRef.current && selectedTag) {
      let htmlTemplate = "";

      switch (selectedTag) {
        // Structural Tags
        case "div":
          htmlTemplate = `<div style="color: red;">Your content here</div>`;
          break;
        case "Html Try Yourself":
          htmlTemplate=`<p style="width: 98%; margin: 0 auto; text-align: right;"><button id="run-btn" style="background-color: #f96b1f; border: none; color: white; padding: 5px 10px; text-align: center; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; font-size: 16px; margin: 4px 2px; cursor: pointer; border-radius: 5px; transition: background-color 0.3s ease, transform 0.2s ease; box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.2);"> <!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--> Try Yourself</button></p>`
          break;
        case "Sql Try Yourself":
        htmlTemplate=`<p style="width: 98%; margin: 0 auto; text-align: right;"><button id="run-btn" style="background-color: #f96b1f; border: none; color: white; padding: 5px 10px; text-align: center; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; font-size: 16px; margin: 4px 2px; cursor: pointer; border-radius: 5px; transition: background-color 0.3s ease, transform 0.2s ease; box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.2);"> <!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.-->  Try Yourself In Sql</button></p>`
          break;
        case "compare":
          htmlTemplate=`<textarea  id="compare-text-code"  style=" width: 100%; height: 140px; padding: 20px; background: black; color: green; font-size: 14px; line-height: 1.8; font-weight: bold;" placeholder="Write Your Code" >
          </textarea>`;
          break;
   
        case "section":
          htmlTemplate = `<section><p>Section content here</p></section>`;
          break;
        case "article":
          htmlTemplate = `<article><h2>Article Title</h2><p>Article content here</p></article>`;
          break;
        case "header":
          htmlTemplate = `<header><h1>Header Title</h1></header>`;
          break;
        case "footer":
          htmlTemplate = `<footer><p>Footer content here</p></footer>`;
          break;
        case "nav":
          htmlTemplate = `<nav><ul><li><a href="#">Link 1</a></li><li><a href="#">Link 2</a></li></ul></nav>`;
          break;
        case "aside":
          htmlTemplate = `<aside><p>Aside content here</p></aside>`;
          break;
        case "main":
          htmlTemplate = `<main><h1>Main Content</h1><p>Your content here</p></main>`;
          break;

        // Text and Inline Tags
        case "p":
          htmlTemplate = `<p>Your paragraph content here</p>`;
          break;
        case "span":
          htmlTemplate = `<span style="color: blue;">Your inline text here</span>`;
          break;
        case "strong":
          htmlTemplate = `<strong>Your bold text here</strong>`;
          break;
        case "em":
          htmlTemplate = `<em>Your italicized text here</em>`;
          break;
        case "h1":
          htmlTemplate = `<h1>Heading 1</h1>`;
          break;
        case "h2":
          htmlTemplate = `<h2>Heading 2</h2>`;
          break;
        case "h3":
          htmlTemplate = `<h3>Heading 3</h3>`;
          break;
        case "h4":
          htmlTemplate = `<h4>Heading 4</h4>`;
          break;
        case "h5":
          htmlTemplate = `<h5>Heading 5</h5>`;
          break;
        case "h6":
          htmlTemplate = `<h6>Heading 6</h6>`;
          break;
        case "blockquote":
          htmlTemplate = `<blockquote>Quoted text here</blockquote>`;
          break;
        case "pre":
          htmlTemplate = `<pre>Preformatted text here</pre>`;
          break;
        case "code":
          htmlTemplate = `<code>Code snippet here</code>`;
          break;

        // Media Tags
        case "img":
          htmlTemplate = `<img src="https://via.placeholder.com/150" alt="Placeholder Image" style="max-width: 100%;">`;
          break;
        case "video":
          htmlTemplate = `<video controls><source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4">Your browser does not support the video tag.</video>`;
          break;
        case "audio":
          htmlTemplate = `<audio controls><source src="https://www.w3schools.com/html/horse.ogg" type="audio/ogg">Your browser does not support the audio element.</audio>`;
          break;
        case "iframe":
          htmlTemplate = `<iframe src="https://example.com" width="100%" height="500px"></iframe>`;
          break;
        case "picture":
          htmlTemplate = `<picture><source srcset="https://via.placeholder.com/150" media="(max-width: 600px)"><img src="https://via.placeholder.com/300" alt="Responsive Image"></picture>`;
          break;
        case "source":
          htmlTemplate = `<source src="https://via.placeholder.com/300" type="image/jpeg">`;
          break;
        case "track":
          htmlTemplate = `<track src="subtitles_en.vtt" kind="subtitles" srclang="en" label="English">`;
          break;

        // List Tags
        case "ul":
          htmlTemplate = `<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>`;
          break;
        case "ol":
          htmlTemplate = `<ol><li>Item 1</li><li>Item 2</li><li>Item 3</li></ol>`;
          break;
        case "li":
          htmlTemplate = `<li>List item</li>`;
          break;
        case "dl":
          htmlTemplate = `<dl><dt>Term</dt><dd>Definition</dd></dl>`;
          break;
        case "dt":
          htmlTemplate = `<dt>Term</dt>`;
          break;
        case "dd":
          htmlTemplate = `<dd>Definition</dd>`;
          break;

        // Table Tags
        case "table":
          htmlTemplate = `<table border="1" style="width: 100%; border-collapse: collapse;">
            <tr><th>Header 1</th><th>Header 2</th></tr>
            <tr><td>Data 1</td><td>Data 2</td></tr>
          </table>`;
          break;
        case "thead":
          htmlTemplate = `<thead><tr><th>Header</th></tr></thead>`;
          break;
        case "tbody":
          htmlTemplate = `<tbody><tr><td>Body Content</td></tr></tbody>`;
          break;
        case "tr":
          htmlTemplate = `<tr><td>Row Content</td></tr>`;
          break;
        case "th":
          htmlTemplate = `<th>Header</th>`;
          break;
        case "td":
          htmlTemplate = `<td>Data</td>`;
          break;
        case "caption":
          htmlTemplate = `<caption>Table Caption</caption>`;
          break;
        case "col":
          htmlTemplate = `<col style="background-color: lightgrey;">`;
          break;
        case "colgroup":
          htmlTemplate = `<colgroup><col style="background-color: lightgrey;"></colgroup>`;
          break;

        // Forms and Inputs
        case "form":
          htmlTemplate = `<form><label for="input">Label:</label><input type="text" id="input" name="input" ></form>`;
          break;
        case "input":
          htmlTemplate = `<input type="text">`;
          break;
        case "textarea":
          htmlTemplate = `<textarea rows="4" cols="50"></textarea>`;
          break;
        case "button":
          htmlTemplate = `<button type="button">Click Me</button>`;
          break;
        case "select":
          htmlTemplate = `<select><option>Option 1</option><option>Option 2</option></select>`;
          break;
        case "option":
          htmlTemplate = `<option value="value">Option Text</option>`;
          break;
        case "label":
          htmlTemplate = `<label for="input">Label Text</label>`;
          break;
        case "fieldset":
          htmlTemplate = `<fieldset><legend>Legend Text</legend><p>Fieldset content here</p></fieldset>`;
          break;
        case "legend":
          htmlTemplate = `<legend>Legend Text</legend>`;
          break;

        // Interactive Tags
        case "a":
          htmlTemplate = `<a href="https://example.com" target="_blank">Click Here</a>`;
          break;
        case "details":
          htmlTemplate = `<details><summary>Details Summary</summary><p>Details content here</p></details>`;
          break;
        case "summary":
          htmlTemplate = `<summary>Summary content here</summary>`;
          break;
        case "dialog":
          htmlTemplate = `<dialog open><p>Dialog content here</p></dialog>`;
          break;

        // Semantic Tags
        case "abbr":
          htmlTemplate = `<abbr title="Abbreviation Title">Abbr</abbr>`;
          break;
        case "cite":
          htmlTemplate = `<cite>Citation Text</cite>`;
          break;
        case "mark":
          htmlTemplate = `<mark>Highlighted Text</mark>`;
          break;
        case "time":
          htmlTemplate = `<time datetime="2023-01-01">January 1, 2023</time>`;
          break;
        case "progress":
          htmlTemplate = `<progress value="50" max="100"></progress>`;
          break;
        case "meter":
          htmlTemplate = `<meter value="0.6">60%</meter>`;
          break;

        default:
          htmlTemplate = `<${selectedTag}>Your content here</${selectedTag}>`;
      }

      editorRef.current.insertContent(htmlTemplate);
      handleHtmlModalClose();
    }
  };

  // const showPreviewModal = () => {
  
  //   const escapedHtml = data.value
  //   setIsModalVisible(true);
  //   setPreviewHtml(escapedHtml); // Store the escaped HTML for display
  // };

  useEffect(()=>{
  setPreviewHtml(data.value)
  },[data.value])
  
  return (
    <Box mt={3} sx={{ width: "100%", margin: "20px auto", }}>
      <Editor
        apiKey='w1isolnpf1qqolaghurieom5wjtfym59k0ue9glbm341881f'
        onInit={(_, editor) => (editorRef.current = editor)}
        value={previewHtml}
        onEditorChange={handleEditorChange}
        init={{
          height: "60vh",
          width: "100%",
          menubar: true,
          plugins: [
            "advlist autolink lists link image charmap print preview anchor",
            "searchreplace visualblocks code fullscreen",
            "insertdatetime media table paste code help wordcount",
            "textcolor colorpicker emoticons",
          ],
          toolbar: `
            undo redo | 
            styleselect | 
            bold italic underline strikethrough | 
            alignleft aligncenter alignright alignjustify | 
            bullist numlist outdent indent | 
            forecolor backcolor | 
            fontsizeselect fontselect | 
            table link image media | 
              customFileUpload insertHtml linkImage | 
            fullscreen code
          `,
          menu: {
            file: { title: "File", items: "newdocument | customFileUpload" },
            format: {
              title: "Format",
              items: "bold italic underline strikethrough superscript subscript codeformat | formats blocks fontfamily fontsize align lineheight | removeformat"
            }
          },
          setup: (editor) => {

            editor.ui.registry.addButton("tabels", {
              text: "Add Table",
              onAction: () => setIsTableModalVisible(true),
            });
            editor.ui.registry.addButton("linkImage", {
              text:"Link Image",
              onAction: () => {
                setIsLinkImageModalVisible(!isLinkImageModalVisible);
              }
          });
          editor.ui.registry.addButton("linkImage", {
            text: "Link Image",
            onAction: () => {
              setIsLinkImageModalVisible(true);
            },
          });
            editor.ui.registry.addButton("insertHtml", {
              text: "Insert HTML",
              // icon: "code",
              onAction: () => {
                setIsHtmlModalVisible(!isHtmlModalVisible);
              },
            });

            editor.ui.registry.addButton("customFileUpload", {
              text: "Upload File",
              icon: "upload",
              onAction: () => {
                const input = document.createElement("input");
                input.setAttribute("type", "file");
                input.setAttribute("accept", "image/*, .pdf, .docx, .txt");
                input.click();

                input.onchange = function () {
                  const file = input.files?.[0];
                  if (file) {
                    const fileType = file.type;
                    const reader = new FileReader();

                    reader.onload = function (e) {
                      if (fileType.startsWith("image/")) {
                        const imageUrl = e.target?.result as string;
                        editor.insertContent(
                          `<img src="${imageUrl}" alt="${file.name}" style="max-width: 100%;">`
                        );
                      } else if (fileType === "application/pdf") {
                        const pdfUrl = e.target?.result as string;
                        editor.insertContent(
                          `<iframe src="${pdfUrl}" width="100%" height="500px"></iframe>`
                        );
                      } else {
                        const fileUrl = e.target?.result as string;
                        editor.insertContent(
                          `<a href="${fileUrl}" target="_blank">${file.name}</a>`
                        );
                      }
                    };

                    reader.readAsDataURL(file);
                  }
                };
              },
            });
          },
        }}
      />

      <Modal
        title="Add Table"
        visible={isTableModalVisible}
        onCancel={() => setIsTableModalVisible(false)}
        onOk={handleInsertTable}
      >
        <Form layout="vertical">
          <Form.Item label="Number of Rows">
            <Input
              type="number"
              value={rows}
              onChange={(e) => setRows(Number(e.target.value))}
              min={1}
            />
          </Form.Item>
          <Form.Item label="Number of Columns">
            <Input
              type="number"
              value={cols}
              onChange={(e) => {
                const value = Number(e.target.value);
                setCols(value);
                setHeaders(Array(value).fill("Header")); // Adjust headers dynamically
              }}
              min={1}
            />
          </Form.Item>
          {headers.map((header, index) => (
            <Form.Item key={index} label={`Header ${index + 1}`}>
              <Input
                value={header}
                onChange={(e) => updateHeaderValue(e.target.value, index)}
              />
            </Form.Item>
          ))}
        </Form>
      </Modal>

      

      <Modal
          title="Link Image"
          visible={isLinkImageModalVisible}
          onCancel={handleCloseLinkImageModal}
          footer={[
            <Button key="close" onClick={handleCloseLinkImageModal}>
              Close
            </Button>,
            <Button key="add" type="primary" onClick={handleAddImageFromModal}>
              Add Image
            </Button>,
          ]}
        >
          <Input
            placeholder="Enter image URL"
            value={imageLink}
            onChange={(e) => setImageLink(e.target.value)}
          />
        </Modal>
        <Modal
        title="Insert Image from URL"
        visible={isLinkImageModalVisible}
        onCancel={handleCloseLinkImageModal}
        footer={[
          <Button key="close" onClick={handleCloseLinkImageModal}>
            Close
          </Button>,
          <Button
            key="add"
            type="primary"
            onClick={handleAddImageFromModal}
            disabled={!imageLink}
          >
            Add Image
          </Button>,
        ]}
      >
        <Input
          placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
          value={imageLink}
          onChange={(e) => setImageLink(e.target.value)}
        />
      </Modal>

      {/* Modal for Selecting and Adding HTML Tags */}
      <Modal
        title="Insert HTML Tag"
        visible={isHtmlModalVisible}
        onCancel={handleHtmlModalClose}
        footer={[
          <Button key="cancel" onClick={handleHtmlModalClose}>
            Cancel
          </Button>,
          <Button key="insert" type="primary" onClick={handleInsertTag}>
            Insert
          </Button>,
        ]}
      >
        <Select
          style={{ width: "100%" }}
          placeholder="Select an HTML tag"
          onChange={(value) => setSelectedTag(value)}
          value={selectedTag}
        >
          {/* Structural Tags */}
          <Select.Option value="compare">Compare Code</Select.Option>
          <Select.Option  value="Html Try Yourself">Html Try Yourself</Select.Option>
          <Select.Option value="Sql Try Yourself">Sql Try Yourself</Select.Option>
          <Select.Option value="div">Div</Select.Option>
          <Select.Option value="section">Section</Select.Option>
          <Select.Option value="article">Article</Select.Option>
          <Select.Option value="header">Header</Select.Option>
          <Select.Option value="footer">Footer</Select.Option>
          <Select.Option value="nav">Nav</Select.Option>
          <Select.Option value="aside">Aside</Select.Option>
          <Select.Option value="main">Main</Select.Option>

          {/* Text and Inline Tags */}
          <Select.Option value="p">Paragraph</Select.Option>
          <Select.Option value="span">Span</Select.Option>
          <Select.Option value="strong">Strong (Bold)</Select.Option>
          <Select.Option value="em">Emphasis (Italic)</Select.Option>
          <Select.Option value="h1">Heading 1</Select.Option>
          <Select.Option value="h2">Heading 2</Select.Option>
          <Select.Option value="h3">Heading 3</Select.Option>
          <Select.Option value="h4">Heading 4</Select.Option>
          <Select.Option value="h5">Heading 5</Select.Option>
          <Select.Option value="h6">Heading 6</Select.Option>
          <Select.Option value="blockquote">Blockquote</Select.Option>
          <Select.Option value="pre">Preformatted Text</Select.Option>
          <Select.Option value="code">Code</Select.Option>

          {/* Media Tags */}
          <Select.Option value="img">Image</Select.Option>
          <Select.Option value="video">Video</Select.Option>
          <Select.Option value="audio">Audio</Select.Option>
          <Select.Option value="iframe">Iframe</Select.Option>
          <Select.Option value="picture">Picture</Select.Option>
          <Select.Option value="source">Source</Select.Option>
          <Select.Option value="track">Track</Select.Option>

          {/* List Tags */}
          <Select.Option value="ul">Unordered List</Select.Option>
          <Select.Option value="ol">Ordered List</Select.Option>
          <Select.Option value="li">List Item</Select.Option>
          <Select.Option value="dl">Definition List</Select.Option>
          <Select.Option value="dt">Definition Term</Select.Option>
          <Select.Option value="dd">Definition Description</Select.Option>

          {/* Table Tags */}
          <Select.Option value="table">Table</Select.Option>
          <Select.Option value="thead">Table Head</Select.Option>
          <Select.Option value="tbody">Table Body</Select.Option>
          <Select.Option value="tr">Table Row</Select.Option>
          <Select.Option value="th">Table Header</Select.Option>
          <Select.Option value="td">Table Data</Select.Option>
          <Select.Option value="caption">Caption</Select.Option>
          <Select.Option value="col">Column</Select.Option>
          <Select.Option value="colgroup">Column Group</Select.Option>

          {/* Forms and Inputs */}
          <Select.Option value="form">Form</Select.Option>
          <Select.Option value="input">Input</Select.Option>
          <Select.Option value="textarea">Textarea</Select.Option>
          <Select.Option value="button">Button</Select.Option>
          <Select.Option value="select">Select</Select.Option>
          <Select.Option value="option">Option</Select.Option>
          <Select.Option value="label">Label</Select.Option>
          <Select.Option value="fieldset">Fieldset</Select.Option>
          <Select.Option value="legend">Legend</Select.Option>

          {/* Interactive Tags */}
          <Select.Option value="a">Anchor (Link)</Select.Option>
          <Select.Option value="details">Details</Select.Option>
          <Select.Option value="summary">Summary</Select.Option>
          <Select.Option value="dialog">Dialog</Select.Option>

          {/* Semantic Tags */}
          <Select.Option value="abbr">Abbreviation</Select.Option>
          <Select.Option value="cite">Citation</Select.Option>
          <Select.Option value="mark">Mark</Select.Option>
          <Select.Option value="time">Time</Select.Option>
          <Select.Option value="progress">Progress</Select.Option>
          <Select.Option value="meter">Meter</Select.Option>
        </Select>
      </Modal>
     
     
    </Box>
  );
}
