import { Container } from "../components/controls/container.tsx";
import { useTranslation } from "react-i18next";
import { Button } from "../components/controls/button.tsx";
import { Input } from "../components/controls/input.tsx";
import { usePeerShare } from "../services/use-peer-share.ts";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Copy, Upload } from "lucide-react";
import { Divider } from "../components/controls/divider.tsx";
import { FileRequestCard } from "../components/file-request-card.tsx";
import QRCode from "react-qr-code";

const peerConnectionConfig = {
  iceServers: [
    { urls: "stun:stun.stunprotocol.org:3478" },
    { urls: "stun:stun.l.google.com:19302" },
  ],
};

export function StartPage() {
  const { t } = useTranslation();

  // The file input used for uploading.
  const inputFile = useRef<HTMLInputElement | null>(null);

  const {
    state,
    hostId,
    files,
    host,
    connect,
    offerFiles,
    acceptFile,
    downloadFile,
  } = usePeerShare(peerConnectionConfig);

  // Builds the sharable URL.
  const shareUrl = useMemo(() => {
    if (!hostId) return "";
    return `${window.location}#${hostId}`;
  }, [hostId]);

  // Copies the shareable URL.
  const copyShareUrl = useCallback(async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
  }, [shareUrl]);

  // Shows the file selector to upload.
  const showFileUpload = useCallback(async () => {
    if (!inputFile.current) return;
    inputFile.current.click();
  }, []);

  // Uploads a file and shares it to the RTC connection.
  const uploadFile = useCallback(async () => {
    if (!inputFile.current) return;
    if (!inputFile.current.files) return;
    await offerFiles(inputFile.current.files);
  }, []);

  useEffect(() => {
    if (state !== "ready") return;
    if (window.location.hash) {
      console.log("CONNECT", window.location.hash);
      const hash = window.location.hash.substring(1);
      connect(hash).then();
    } else {
      console.log("HOST");
      host().then();
    }
  }, [state]);

  return (
    <>
      <Container variant={"dark"}>
        <h3 className="text-3xl">{t("peer_share")}</h3>
      </Container>

      <Container className="m-2 px-2 py-1 text-sm rounded border border-neutral-800">
        <strong>{t("status")}</strong>: {t(`connectionStatus.${state}`)}
      </Container>

      {state === "listing" && shareUrl && (
        <>
          <Container className="flex flex-row gap-2">
            <Input readOnly value={shareUrl} />
            <Button onClick={() => copyShareUrl()}>
              <Copy />
            </Button>
          </Container>

          <Container>
            <QRCode value={shareUrl} className="p-4 bg-white" />
          </Container>
        </>
      )}

      <Divider />

      <Container className="flex flex-row gap-2">
        <input
          type="file"
          multiple
          className="hidden"
          ref={inputFile}
          onChange={() => uploadFile()}
        />
        <Button
          disabled={state !== "connected"}
          onClick={() => showFileUpload()}
        >
          <Upload />
          {t("uploadFiles")}
        </Button>
      </Container>

      <Container className="flex flex-row flex-wrap justify-stretch gap-2">
        {files.map((file) => (
          <FileRequestCard
            key={file.id}
            file={file}
            accept={acceptFile}
            download={downloadFile}
          />
        ))}
      </Container>
    </>
  );
}
