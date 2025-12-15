import { Container } from "../components/controls/container.tsx";
import { useTranslation } from "react-i18next";
import { Button } from "../components/controls/button.tsx";
import { Input } from "../components/controls/input.tsx";
import { usePeerShare } from "../services/use-peer-share.ts";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Cable, Copy, QrCode, Upload } from "lucide-react";
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

  // Handling pasting files from clipboard.
  const handlePaste = useCallback(
    async (ev: ClipboardEvent) => {
      ev.stopImmediatePropagation();
      console.log("handlePaste:", state, ev.clipboardData?.files);
      if (state !== "connected") return;
      if (!ev.clipboardData?.files) return;
      await offerFiles(ev.clipboardData.files);
    },
    [state, offerFiles],
  );

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [handlePaste]);

  const clientId = useMemo<string | undefined>(() => {
    if (window.location.hash) {
      return window.location.hash.substring(1);
    }
  }, []);

  return (
    <>
      <Container variant={"dark"}>
        <h3 className="text-3xl">{t("peer_share")}</h3>
      </Container>

      <Container className="m-2 px-2 py-1 text-sm rounded border border-neutral-800">
        <strong>{t("status")}</strong>: {t(`connectionStatus.${state}`)}
      </Container>

      {state === "ready" && (
        <Container>
          {!clientId && (
            <Button onClick={() => host()}>
              <QrCode /> {t("createSession")}
            </Button>
          )}
          {clientId && (
            <Button onClick={() => connect(clientId)}>
              <Cable /> {t("joinSession")}
            </Button>
          )}
        </Container>
      )}

      {state === "listing" && shareUrl && (
        <>
          <Container className="flex flex-row gap-2 w-full">
            <Input readOnly value={shareUrl} className="grow" />
            <Button onClick={() => copyShareUrl()}>
              <Copy />
            </Button>
          </Container>

          <Container>
            <QRCode value={shareUrl} className="p-4 bg-white" />
          </Container>
        </>
      )}

      {state === "connected" && (
        <Container className="flex flex-row gap-2">
          <input
            type="file"
            multiple
            className="hidden"
            ref={inputFile}
            onChange={() => uploadFile()}
          />
          <Button onClick={() => showFileUpload()}>
            <Upload />
            {t("uploadFiles")}
          </Button>
        </Container>
      )}

      {files.length > 0 && (
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
      )}
    </>
  );
}
