// Client -> Server: Starts an RTC session with the given description.
export type OfferRequestMessageDto = {
  $type: "offerRequest";
  localDescription: string;
};

// Server -> Client: Shares the offer connection id with the client.
export type OfferResponseMessageDto = {
  $type: "offerResponse";
  connectionId: string;
};

// Client -> Server: Sends a ICE candidate to the server.
export type AddIceCandidateMessageDto = {
  $type: "addIceCandidate";
  iceCandidate: string;
};

// Client -> Server: Requests an RTC description with the given client id.
export type ConnectionRequestMessageDto = {
  $type: "connectionRequest";
  connectionId: string;
};

// Server -> Client: Shares the remote description with the client.
export type ConnectionResponseMessageDto = {
  $type: "connectionResponse";
  remoteDescription: string;
  iceCandidates: string[];
};

// Client -> Server: Shares the local description with the server.
export type AnswerRequestMessageDto = {
  $type: "answerRequest";
  localDescription: string;
};

// Server -> Client: Shares the remote description with the host.
export type AnswerResponseMessageDto = {
  $type: "answerResponse";
  remoteDescription: string;
};

export type MessageDto =
  | OfferRequestMessageDto
  | OfferResponseMessageDto
  | AddIceCandidateMessageDto
  | ConnectionRequestMessageDto
  | ConnectionResponseMessageDto
  | AnswerRequestMessageDto
  | AnswerResponseMessageDto;
