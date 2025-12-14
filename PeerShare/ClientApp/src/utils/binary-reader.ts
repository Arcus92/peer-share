export class BinaryReader {
  private readonly buffer: Uint8Array;
  private readonly view: DataView;
  private offset: number = 0;

  public constructor(buffer: Uint8Array) {
    this.buffer = buffer;
    this.view = new DataView(buffer.buffer);
  }

  // Reads a one byte integer from the buffer.
  public readUint8(): number {
    const value = this.buffer[this.offset];
    this.offset++;
    return value;
  }

  // Reads a two bytes integer from the buffer.
  public readUint16(littleEndian = true): number {
    const value = this.view.getUint16(this.offset, littleEndian);
    this.offset += 2;
    return value;
  }

  // Reads a four bytes integer from the buffer.
  public readUint32(littleEndian = true): number {
    const value = this.view.getUint32(this.offset, littleEndian);
    this.offset += 4;
    return value;
  }

  // Reads an eight bytes integer from the buffer.
  public readUint64(littleEndian = true): bigint {
    const value = this.view.getBigUint64(this.offset, littleEndian);
    this.offset += 8;
    return value;
  }

  // Reads the given number of bytes from the buffer.
  public readBytes(length: number): Uint8Array {
    const value = this.buffer.slice(this.offset, this.offset + length);
    this.offset += length;
    return value;
  }

  // Reads a length-prefixed UTF-8 string from the buffer.
  public readString(): string {
    const length = this.readUint32();
    const bytes = this.readBytes(length);

    const decoder = new TextDecoder();
    return decoder.decode(bytes);
  }
}
