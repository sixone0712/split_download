import { css } from "@emotion/react";
import { Button, Input, InputNumber, Modal, Progress } from "antd";
import saveAs from "file-saver";
import React, { useEffect, useRef, useState } from "react";
import { generatorChuck, getfileInfo } from "../util/download";

export default function FileDownloadGenerator() {
  const [url, setUrl] = useState("");
  const [chunkSize, setChunkSize] = useState(1024);
  const [isOpen, setOpen] = useState(false);
  const [persent, setPercent] = useState(0);
  const [totalSize, setTotalSize] = useState(0);
  const [curSize, setCurSize] = useState(0);
  const cancelRef = useRef(false);
  const doneRef = useRef(false);
  const [isError, setError] = useState(true);

  const download = async () => {
    try {
      const {
        name: fileName,
        size: fileSize,
        type: fileType,
      } = await getfileInfo(url);
      console.log("fileSize", fileSize);

      setTotalSize(fileSize);

      let dnSize = 0;
      const dnChuck: BlobPart[] = [];

      for await (const item of generatorChuck({ url, fileSize, chunkSize })) {
        console.log("cancelRef.current", cancelRef.current);
        if (cancelRef.current) {
          cancelRef.current = false;
          return;
        }
        dnChuck.push(item.data as Blob);
        dnSize += item.length;
        console.log(
          "dnSize",
          dnSize,
          "percent",
          Math.floor((dnSize / fileSize) * 100)
        );
        setCurSize(dnSize);
        setPercent(Math.floor((dnSize / fileSize) * 100));
      }

      const fileBlob = new Blob(dnChuck, { type: fileType });

      if (fileBlob.size !== fileSize) {
        throw Error(
          `file size is different.(fileSize:${fileSize} / blobSize:${fileBlob.size})`
        );
      }

      saveAs(fileBlob, fileName);
      doneRef.current = true;
    } catch (e) {
      console.error(e);
      setError(true);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setPercent(0);
      setTotalSize(0);
      setCurSize(0);
      setError(false);
    } else {
      cancelRef.current = false;
      download();
    }
  }, [isOpen]);

  return (
    <>
      <div css={style}>
        <div className="item">
          <div className="item-name">Chunk Size</div>
          <InputNumber
            addonAfter="Byte"
            value={chunkSize}
            onChange={(value) => setChunkSize(value)}
          />
        </div>
        <div className="item">
          <div className="item-name">Download Path</div>
          <Input
            css={css`
              width: 30rem;
            `}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <div className="item">
          <div className="item-name" />
          <Button
            onClick={() => {
              setOpen(true);
            }}
            disabled={!url}
          >
            File Download
          </Button>
        </div>
      </div>

      <Modal
        okButtonProps={{
          hidden: true,
        }}
        title="Download File"
        visible={isOpen}
        cancelText="Close"
        onCancel={() => {
          if (!cancelRef.current) {
            cancelRef.current = true;
          }
          setOpen(false);
        }}
      >
        <div
          css={css`
            display: flex;
            flex-direction: column;
            align-items: center;
          `}
        >
          <Progress type="circle" percent={persent} />
          {totalSize > 0 && (
            <div
              css={css`
                margin-top: 1rem;
              `}
            >{`${curSize} Byte / ${totalSize} Byte`}</div>
          )}
          {isError && (
            <div
              css={css`
                margin-top: 1rem;
                color: red;
              `}
            >
              Error Occured!
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}

const style = css`
  margin-left: 2rem;
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  .item {
    display: flex;
    align-items: center;
    margin-bottom: 2rem;
    .item-name {
      display: flex;
      align-items: center;
      width: 8rem;
      margin-right: 2rem;
    }
  }
`;
