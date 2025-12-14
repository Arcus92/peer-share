import { Container } from "../components/controls/container.tsx";
import { useTranslation } from "react-i18next";
import { Button } from "../components/controls/button.tsx";
import { Input } from "../components/controls/input.tsx";
import { usePeerShare } from "../services/use-peer-share.ts";
import { useCallback, useRef, useState } from "react";
import { Copy, Server, Share, Upload } from "lucide-react";
import { Divider } from "../components/controls/divider.tsx";
import { FileRequestCard } from "../components/file-request-card.tsx";

const peerConnectionConfig = {
  iceServers: [
    { urls: "stun:stun.stunprotocol.org:3478" },
    { urls: "stun:stun.l.google.com:19302" },
  ],
};

export function StartPage() {
  const { t } = useTranslation();

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

  const [connectionId, setConnectionId] = useState<string>("");

  const copyHostId = useCallback(async () => {
    if (!hostId) return;
    await navigator.clipboard.writeText(hostId);
  }, [hostId]);

  const showFileUpload = useCallback(async () => {
    if (!inputFile.current) return;

    inputFile.current.click();
  }, []);

  const uploadFile = useCallback(async () => {
    if (!inputFile.current) return;
    if (!inputFile.current.files) return;
    await offerFiles(inputFile.current.files);
  }, []);

  return (
    <>
      <Container variant={"dark"}>
        <h3>{t("peer_share")}</h3>
      </Container>

      <Container>State: {state}</Container>

      <Container className="flex flex-row gap-2">
        <Button disabled={state !== "idle"} onClick={() => host()}>
          <Server />
          {t("host")}
        </Button>

        {hostId && (
          <>
            <Input readOnly value={hostId} />
            <Button onClick={() => copyHostId()}>
              <Copy />
            </Button>
          </>
        )}
      </Container>

      <Container className="flex flex-row gap-2">
        <Input
          disabled={state !== "idle"}
          value={connectionId}
          placeholder={t("connectionId")}
          onChange={(ev) => setConnectionId(ev.target.value)}
        />
        <Button
          disabled={state !== "idle" || !connectionId}
          onClick={() => connect(connectionId)}
        >
          <Share />
          {t("connect")}
        </Button>
      </Container>

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
