import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type {
  AnswerResponseMessageDto,
  ConnectionResponseMessageDto,
  MessageDto,
  OfferResponseMessageDto,
} from "../models/messages.ts";
import { v4 as uuidv4 } from "uuid";
import type {
  FileRequest,
  FileRequestDirection,
  FileRequestStatie,
} from "../models/file-request.ts";
import { BinaryWriter } from "../utils/binary-writer.ts";
import { BinaryReader } from "../utils/binary-reader.ts";

export type Status =
  | "idle"
  | "listing"
  | "connecting"
  | "connected"
  | "disconnected"
  | "failed";

export function usePeerShare(peerConnectionConfig: RTCConfiguration) {
  const [state, setState] = useState<Status>("idle");

  type FileTransfer = {
    id: string;
    state: FileRequestStatie;
    direction: FileRequestDirection;
    file?: File;
    buffer?: Uint8Array;
    name: string;
    length: number;
    type: string;
    offset: number;
  };
  const fileTransfers = useRef<{ [id: string]: FileTransfer }>({});

  // The UI file list.
  const [files, fileDispatch] = useReducer<
    FileRequest[],
    [{ type: "add" | "update"; id: string }]
  >((state, action) => {
    const fileTransfer = fileTransfers.current[action.id];
    if (!fileTransfer) return state;
    switch (action.type) {
      case "add":
        return [
          ...state,
          {
            id: fileTransfer.id,
            state: fileTransfer.state,
            direction: fileTransfer.direction,
            name: fileTransfer.name,
            length: fileTransfer.length,
            offset: fileTransfer.offset,
            type: fileTransfer.type,
          },
        ];
      case "update":
        return state.map((file) => {
          if (file.id !== action.id) return file;
          return {
            ...file,
            state: fileTransfer.state,
            offset: fileTransfer.offset,
          };
        });
    }
  }, []);

  const [hostId, setHostId] = useState<string>("");
  const rtcConnection = useRef<RTCPeerConnection | undefined>(undefined);
  const rtcDataChannel = useRef<RTCDataChannel | undefined>(undefined);

  // Receiving an ICE candidate.
  const handleIceCandidate = useCallback(
    async (ev: RTCPeerConnectionIceEvent) => {
      if (!ev.candidate) return;

      sendWebSocketMessage({
        $type: "addIceCandidate",
        iceCandidate: JSON.stringify(ev.candidate),
      });
    },
    [],
  );

  // Sends an RTC message to the data channel.
  const sendRtcMessage = useCallback((data: ArrayBuffer) => {
    if (!rtcDataChannel.current) return;
    rtcDataChannel.current.send(data);
  }, []);

  const RTCMessageFileOffer = 1;
  const RTCMessageFileAccept = 2;
  const RTCMessageFileTransfer = 3;

  const RTCChunkBufferSize = 64 * 1024;
  const RTCMaxBufferSize = 512 * 1024;
  const RTCMinBufferSize = 32 * 1024;

  const rtcIsSending = useRef(false);

  // Send the next chunk of data to the RTC channel.
  const sendFileTransferChunk = useCallback(
    (fileTransfer: FileTransfer) => {
      return new Promise<void>((resolve, reject) => {
        if (!fileTransfer.file) {
          reject();
          return;
        }

        const chunkStart = fileTransfer.offset;
        const chunkEnd = Math.min(
          fileTransfer.offset + RTCChunkBufferSize,
          fileTransfer.file.size,
        );

        if (chunkStart === chunkEnd) {
          fileTransfer.state = "completed";
          fileDispatch({ type: "update", id: fileTransfer.id });
          resolve();
          return;
        }

        const chunk = fileTransfer.file.slice(chunkStart, chunkEnd);

        const fileReader = new FileReader();
        fileReader.onload = () => {
          const chunkData = fileReader.result as ArrayBuffer;
          if (!chunkData) return;

          const writer = new BinaryWriter();
          writer.writeUint8(RTCMessageFileTransfer);
          writer.writeString(fileTransfer.id);
          writer.writeUint32(fileTransfer.offset);
          writer.writeUint32(chunkData.byteLength);
          writer.writeBytes(new Uint8Array(chunkData));
          sendRtcMessage(writer.toArrayBuffer());

          fileTransfer.offset += chunkData.byteLength;
          fileDispatch({ type: "update", id: fileTransfer.id });
          resolve();
        };
        fileReader.onerror = (e) => {
          console.error(e);
          reject();
        };
        fileReader.readAsArrayBuffer(chunk);
      });
    },
    [sendRtcMessage, fileDispatch],
  );

  // Tires to start the message loop if the RTC buffer is not filled and there are files to send.
  const trySendFileTransfer = useCallback(async () => {
    if (!rtcDataChannel.current) return;
    if (rtcIsSending.current) return;

    rtcIsSending.current = true;

    while (rtcDataChannel.current.bufferedAmount < RTCMaxBufferSize) {
      const fileTransfer = Object.values(fileTransfers.current).find(
        (f) => f.state === "active",
      );
      if (!fileTransfer) break;

      await sendFileTransferChunk(fileTransfer);
    }

    rtcIsSending.current = false;
  }, [sendFileTransferChunk]);

  // Handles incoming file request.
  const handleRtcFileOfferMessage = useCallback(
    async (reader: BinaryReader) => {
      const id = reader.readString();

      const fileName = reader.readString();
      const fileSize = reader.readUint32();
      const mimeType = reader.readString();
      fileTransfers.current[id] = {
        id: id,
        direction: "incoming",
        state: "ready",
        name: fileName,
        length: fileSize,
        type: mimeType,
        offset: 0,
      };

      fileDispatch({ type: "add", id: id });
    },
    [fileDispatch],
  );

  // A new RTC channel was created.
  const handleRtcChannelOpen = useCallback(() => {
    setState("connected");
  }, [setState]);

  // The RTC channel buffer is ready to send more data.
  const handleRtcChannelBufferedAmountLow = useCallback(async () => {
    console.log("bufferedAmountLow");
    await trySendFileTransfer();
  }, [trySendFileTransfer]);

  // The current RTC channel was closed.
  const handleRtcChannelClose = useCallback(() => {
    setState("disconnected");
  }, [setState]);

  // Handles file acceptance.
  const handleRtcFileAcceptMessage = useCallback(
    async (reader: BinaryReader) => {
      const id = reader.readString();

      const fileTransfer = fileTransfers.current[id];
      if (!fileTransfer || !fileTransfer.file) return;

      fileTransfer.state = "active";
      fileDispatch({ type: "update", id: id });

      await trySendFileTransfer();
    },
    [fileDispatch],
  );

  // Handles an incoming file transfer.
  const handleRtcFileTransferMessage = useCallback(
    async (reader: BinaryReader) => {
      const id = reader.readString();
      const offset = reader.readUint32();
      const length = reader.readUint32();
      const data = reader.readBytes(length);

      const fileTransfer = fileTransfers.current[id];
      if (!fileTransfer || !fileTransfer.buffer) return;
      if (fileTransfer.state !== "active") return;

      fileTransfer.buffer.set(data, offset);
      fileTransfer.offset = offset + length;

      if (fileTransfer.offset === fileTransfer.length) {
        fileTransfer.state = "completed";
      }

      fileDispatch({ type: "update", id: fileTransfer.id });
    },
    [],
  );

  // A message was received on the current RTC channel.
  const handleRtcChannelMessage = useCallback(
    async (ev: MessageEvent) => {
      const buffer = ev.data as ArrayBuffer;
      const reader = new BinaryReader(new Uint8Array(buffer));
      const type = reader.readUint8();

      switch (type) {
        case RTCMessageFileOffer:
          await handleRtcFileOfferMessage(reader);
          break;
        case RTCMessageFileAccept:
          await handleRtcFileAcceptMessage(reader);
          break;
        case RTCMessageFileTransfer:
          await handleRtcFileTransferMessage(reader);
          break;
        default:
          console.error("Unknown RTC message type:", type);
          break;
      }
    },
    [
      handleRtcFileOfferMessage,
      handleRtcFileAcceptMessage,
      handleRtcFileTransferMessage,
    ],
  );

  // Uses the given RTC and adds the event handlers.
  const setupRtcChannel = useCallback(
    (channel: RTCDataChannel) => {
      channel.binaryType = "arraybuffer";
      channel.bufferedAmountLowThreshold = RTCMinBufferSize;
      channel.onopen = handleRtcChannelOpen;
      channel.onmessage = handleRtcChannelMessage;
      channel.onclose = handleRtcChannelClose;
      channel.onbufferedamountlow = handleRtcChannelBufferedAmountLow;
      rtcDataChannel.current = channel;
    },
    [handleRtcChannelMessage, handleRtcChannelClose],
  );

  // Receiving a new RTC channel.
  const handleRtcChannelAdd = useCallback(
    (ev: RTCDataChannelEvent) => {
      setupRtcChannel(ev.channel);
      setState("connected");
    },
    [setState, setupRtcChannel],
  );

  // Creating an RTC connection.
  useEffect(() => {
    const connection = new RTCPeerConnection(peerConnectionConfig);
    connection.onicecandidate = handleIceCandidate;
    connection.ondatachannel = handleRtcChannelAdd;
    rtcConnection.current = connection;

    return () => {
      connection.close();
    };
  }, []);

  // The web socket connection handles the RTC handshake and pairing.
  const webSocket = useRef<WebSocket | undefined>(undefined);

  // Sets a message to the web-socket server.
  const sendWebSocketMessage = useCallback((message: MessageDto) => {
    if (!webSocket.current) return;
    webSocket.current.send(JSON.stringify(message));
  }, []);

  // Callback when the web-socket connection was opened.
  const handleWebSocketOpen = useCallback(() => {
    console.log("Connected to web-socket!");
  }, []);

  // Callback when the web-socket connection was closed.
  const handleWebSocketClose = useCallback(() => {
    setHostId("");
    //webSocket.current = undefined;
    console.error("Web socket closed");
  }, [setHostId]);

  // Handles the offer response from the server.
  const handleOfferResponseMessage = useCallback(
    async (message: OfferResponseMessageDto) => {
      setHostId(message.connectionId);
    },
    [setHostId],
  );

  // Handles the response message from the server.
  const handleConnectionResponseMessage = useCallback(
    async (message: ConnectionResponseMessageDto) => {
      if (!rtcConnection.current) return;

      const offer = new RTCSessionDescription(
        JSON.parse(message.remoteDescription),
      );
      await rtcConnection.current.setRemoteDescription(offer);

      for (const iceCandidateText of message.iceCandidates) {
        const iceCandidate = new RTCIceCandidate(JSON.parse(iceCandidateText));
        await rtcConnection.current.addIceCandidate(iceCandidate);
      }

      const answer = await rtcConnection.current.createAnswer();
      await rtcConnection.current.setLocalDescription(answer);

      sendWebSocketMessage({
        $type: "answerRequest",
        localDescription: JSON.stringify(answer),
      });
    },
    [sendWebSocketMessage],
  );

  // Handles the answer response message from the server.
  const handleAnswerResponseMessage = useCallback(
    async (message: AnswerResponseMessageDto) => {
      if (!rtcConnection.current) return;

      const description = new RTCSessionDescription(
        JSON.parse(message.remoteDescription),
      );
      await rtcConnection.current.setRemoteDescription(description);
    },
    [],
  );

  // Handles the web-socket message from the server.
  const handleWebSocketMessage = useCallback(
    async (event: MessageEvent) => {
      const message = JSON.parse(event.data) as MessageDto;
      switch (message.$type) {
        case "offerResponse":
          await handleOfferResponseMessage(message as OfferResponseMessageDto);
          break;
        case "connectionResponse":
          await handleConnectionResponseMessage(
            message as ConnectionResponseMessageDto,
          );
          break;
        case "answerResponse":
          await handleAnswerResponseMessage(
            message as AnswerResponseMessageDto,
          );
          break;
        default:
          console.error("Unknown web socket message:", message);
          break;
      }
    },
    [
      handleOfferResponseMessage,
      handleConnectionResponseMessage,
      handleAnswerResponseMessage,
    ],
  );

  // Opening the web-socket connection
  useEffect(() => {
    const ws = new WebSocket(
      `${location.protocol === "https:" ? "wss" : "ws"}://${location.hostname}:${location.port}/ws`,
    );
    ws.onopen = handleWebSocketOpen;
    ws.onclose = handleWebSocketClose;
    ws.onmessage = handleWebSocketMessage;
    webSocket.current = ws;
    return () => {
      ws.close();
    };
  }, []);

  // Starts listing and receiving a serverId
  const host = useCallback(async () => {
    if (!rtcConnection.current) return;

    const channel = rtcConnection.current.createDataChannel("data");
    setupRtcChannel(channel);

    const offer = await rtcConnection.current.createOffer();
    await rtcConnection.current.setLocalDescription(offer);

    setState("listing");

    sendWebSocketMessage({
      $type: "offerRequest",
      localDescription: JSON.stringify(offer),
    });
  }, [sendWebSocketMessage, setState, setupRtcChannel]);

  // Connects to the given connection id
  const connect = useCallback(
    async (connectinId: string) => {
      if (!connectinId) return;

      setState("connecting");

      sendWebSocketMessage({
        $type: "connectionRequest",
        connectionId: connectinId,
      });
    },
    [sendWebSocketMessage],
  );

  const offerFiles = useCallback(
    async (fileList: FileList) => {
      for (const file of fileList) {
        const id = uuidv4();
        const fileTransfer: FileTransfer = {
          id: id,
          direction: "outgoing",
          state: "ready",
          file: file,
          name: file.name,
          length: file.size,
          type: file.type,
          offset: 0,
        };
        fileTransfers.current[id] = fileTransfer;

        // Update the file list.
        fileDispatch({ type: "add", id: id });

        const writer = new BinaryWriter();
        writer.writeUint8(RTCMessageFileOffer);
        writer.writeString(fileTransfer.id);
        writer.writeString(fileTransfer.name);
        writer.writeUint32(fileTransfer.length);
        writer.writeString(fileTransfer.type);
        sendRtcMessage(writer.toArrayBuffer());
      }
    },
    [fileDispatch, sendRtcMessage],
  );

  // Accepts a file to download
  const acceptFile = useCallback(
    async (id: string) => {
      const fileTransfer = fileTransfers.current[id];
      if (!fileTransfer) return;

      fileTransfer.state = "active";
      fileTransfer.buffer = new Uint8Array(fileTransfer.length);
      fileDispatch({ type: "update", id: id });

      const writer = new BinaryWriter();
      writer.writeUint8(RTCMessageFileAccept);
      writer.writeString(id);
      sendRtcMessage(writer.toArrayBuffer());
    },
    [sendRtcMessage],
  );

  // Downloads a completed file from the buffer.
  const downloadFile = useCallback((id: string) => {
    const fileTransfer = fileTransfers.current[id];
    if (!fileTransfer) return;
    if (fileTransfer.state !== "completed" || !fileTransfer.buffer) return;

    const blob = new Blob([fileTransfer.buffer], {
      type: fileTransfer.type,
    });

    const a = document.createElement("a");
    a.download = fileTransfer.name;
    a.href = URL.createObjectURL(blob);
    a.click();
  }, []);

  return {
    state,
    hostId,
    files,
    host,
    connect,
    offerFiles,
    acceptFile,
    downloadFile,
  };
}
