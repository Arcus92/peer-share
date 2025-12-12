import { useCallback, useEffect, useRef, useState } from "react";
import type {
  AnswerResponseMessageDto,
  ConnectionResponseMessageDto,
  MessageDto,
  OfferResponseMessageDto,
} from "../api/dto/messages.ts";

export function usePeerShare(peerConnectionConfig: RTCConfiguration) {
  type Status =
    | "idle"
    | "listing"
    | "connecting"
    | "connected"
    | "disconnected"
    | "failed";
  const [state, setState] = useState<Status>("idle");

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

  // A new RTC channel was created.
  const handleRtcChannelOpen = useCallback(() => {
    setState("connected");

    if (!rtcDataChannel.current) return;
    rtcDataChannel.current.send("I am server");
  }, [setState]);

  // The current RTC channel was closed.
  const handleRtcChannelClose = useCallback(() => {
    setState("disconnected");
  }, [setState]);

  // A message was received on the current RTC channel.
  const handleRtcChannelMessage = useCallback((ev: MessageEvent) => {
    console.log("handleRtcChannelMessage", ev);
  }, []);

  // Receiving a new RTC channel.
  const handleRtcChannelAdd = useCallback(
    (ev: RTCDataChannelEvent) => {
      rtcDataChannel.current = ev.channel;
      rtcDataChannel.current.onmessage = handleRtcChannelMessage;
      rtcDataChannel.current.onclose = handleRtcChannelClose;

      setState("connected");

      rtcDataChannel.current.send("I am client");
    },
    [setState],
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
    channel.onopen = handleRtcChannelOpen;
    channel.onclose = handleRtcChannelClose;
    channel.onmessage = handleRtcChannelMessage;
    rtcDataChannel.current = channel;

    const offer = await rtcConnection.current.createOffer();
    await rtcConnection.current.setLocalDescription(offer);

    setState("listing");

    sendWebSocketMessage({
      $type: "offerRequest",
      localDescription: JSON.stringify(offer),
    });
  }, [sendWebSocketMessage, setState]);

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

  return {
    state,
    hostId,
    host,
    connect,
  };
}
