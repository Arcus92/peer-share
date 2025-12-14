export type FileRequestDirection = "outgoing" | "incoming";
export type FileRequestStatie = "ready" | "active" | "completed";

export type FileRequest = {
  id: string;
  direction: FileRequestDirection;
  state: FileRequestStatie;
  name: string;
  type: string;
  length: number;
  offset: number;
};
