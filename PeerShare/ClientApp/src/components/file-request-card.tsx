import * as React from "react";
import { Check, Download, Upload } from "lucide-react";
import { fileSize } from "../utils/file-size";
import { useTranslation } from "react-i18next";
import { Progress } from "./controls/progress";
import type { FileRequest } from "../models/file-request";
import { Button } from "./controls/button";

type Props = React.HTMLAttributes<HTMLDivElement> & {
  file: FileRequest;
  accept: (id: string) => void;
  download: (id: string) => void;
};

export function FileRequestCard({ file, accept, download, ...props }: Props) {
  const { t } = useTranslation();

  return (
    <div
      key={file.id}
      className="p-4 w-full md:w-96 border bg-neutral-800 border-neutral-700 rounded-xl"
      {...props}
    >
      <p className="font-bold flex flex-row gap-1 items-center">
        {file.direction === "incoming" && <Download />}
        {file.direction === "outgoing" && <Upload />}
        {file.name}
      </p>

      <Progress value={file.offset} max={file.length} />

      <div className="my-2 text-sm">
        <p>
          {t("fileType")}: {file.type}
        </p>
        <p>
          {t("fileSize")}: {fileSize(file.length)}
        </p>
        <p>
          {t("loaded")}: {fileSize(file.offset)}
        </p>
      </div>

      {file.direction === "incoming" && (
        <p>
          {file.state === "ready" && (
            <Button onClick={() => accept(file.id)}>
              <Check />
              {t("accept")}
            </Button>
          )}

          {file.state === "completed" && (
            <Button onClick={() => download(file.id)}>
              <Download />
              {t("saveFile")}
            </Button>
          )}
        </p>
      )}
    </div>
  );
}
