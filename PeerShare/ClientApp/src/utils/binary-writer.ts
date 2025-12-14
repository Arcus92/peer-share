export class BinaryWriter {
  private buffer: Uint8Array;
  private view: DataView;
  private offset: number = 0;

  public constructor(capacity: number = 128) {
    this.buffer = new Uint8Array(capacity);
    this.view = new DataView(this.buffer.buffer);
    this.offset = 0;
  }

  private ensureCapacity(additionalBytes: number) {
    const needed = this.offset + additionalBytes;
    let capacity = this.buffer.length;
    if (capacity > needed) return;
    while (capacity < needed) {
      capacity *= 2;
    }

    // Re-create a new buffer
    const newArrayBuffer = new Uint8Array(capacity);
    newArrayBuffer.set(this.buffer);
    this.buffer = newArrayBuffer;
    this.view = new DataView(newArrayBuffer.buffer);
  }

  // Writes a single byte integer to the buffer.
  writeUint8(value: number) {
    this.ensureCapacity(1);
    this.buffer[this.offset++] = value;
  }

  // Writes a two bytes integer to the buffer.
  writeUint16(value: number, littleEndian = true) {
    this.ensureCapacity(2);
    this.view.setUint16(this.offset, value, littleEndian);
    this.offset += 2;
  }

  // Writes a four bytes integer to the buffer.
  writeUint32(value: number, littleEndian = true) {
    this.ensureCapacity(4);
    this.view.setUint32(this.offset, value, littleEndian);
    this.offset += 4;
  }

  // Writes an eight bytes integer to the buffer.
  writeUint64(value: bigint, littleEndian = true) {
    this.ensureCapacity(8);
    this.view.setBigUint64(this.offset, value, littleEndian);
    this.offset += 8;
  }

  // Writes binary data to the buffer.
  writeBytes(value: Uint8Array) {
    this.ensureCapacity(value.length);
    this.buffer.set(value, this.offset);
    this.offset += value.length;
  }

  // Writes a length-prefixed string with UTF8 encoding to the buffer.
  writeString(value: string) {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(value);
    this.writeUint32(bytes.length);
    this.writeBytes(bytes);
  }

  // Returns the UInt8Array of the currently written data.
  public toUint8Array() {
    return this.buffer.slice(0, this.offset);
  }

  // Returns the ArrayBuffer of the currently written data.
  public toArrayBuffer() {
    return this.toUint8Array().buffer;
  }
}
