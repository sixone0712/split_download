import { css } from "@emotion/react/macro";
import React from "react";
import "./App.css";
import FileDownloadGenerator from "./FileDownload/FileDownloadGenerator";

function App() {
  return (
    <div className="App" css={style}>
      <h2>Split File Download</h2>
      <FileDownloadGenerator />
    </div>
  );
}

export default App;

const style = css`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-left: 2rem;
`;
