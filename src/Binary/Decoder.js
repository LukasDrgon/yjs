import utf8 from 'utf-8'
import ID from '../Util/ID.js'
import { default as RootID, RootFakeUserID } from '../Util/RootID.js'

export default class BinaryDecoder {
  constructor (buffer) {
    if (buffer instanceof ArrayBuffer) {
      this.uint8arr = new Uint8Array(buffer)
    } else if (buffer instanceof Uint8Array || (typeof Buffer !== 'undefined' && buffer instanceof Buffer)) {
      this.uint8arr = buffer
    } else {
      throw new Error('Expected an ArrayBuffer or Uint8Array!')
    }
    this.pos = 0
  }
  /**
   * Clone this decoder instance
   * Optionally set a new position parameter
   */
  clone (newPos = this.pos) {
    let decoder = new BinaryDecoder(this.uint8arr)
    decoder.pos = newPos
    return decoder
  }
  /**
   * Number of bytes
   */
  get length () {
    return this.uint8arr.length
  }
  /**
   * Skip one byte, jump to the next position
   */
  skip8 () {
    this.pos++
  }
  /**
   * Read one byte as unsigned integer
   */
  readUint8 () {
    return this.uint8arr[this.pos++]
  }
  /**
   * Read 4 bytes as unsigned integer
   */
  readUint32 () {
    let uint =
      this.uint8arr[this.pos] +
      (this.uint8arr[this.pos + 1] << 8) +
      (this.uint8arr[this.pos + 2] << 16) +
      (this.uint8arr[this.pos + 3] << 24)
    this.pos += 4
    return uint
  }
  /**
   * Look ahead without incrementing position
   * to the next byte and read it as unsigned integer
   */
  peekUint8 () {
    return this.uint8arr[this.pos]
  }
  /**
   * Read unsigned integer (32bit) with variable length
   * 1/8th of the storage is used as encoding overhead
   *  - numbers < 2^7 is stored in one byte
   *  - numbers < 2^14 is stored in two bytes
   *  ..
   */
  readVarUint () {
    let num = 0
    let len = 0
    while (true) {
      let r = this.uint8arr[this.pos++]
      num = num | ((r & 0b1111111) << len)
      len += 7
      if (r < 1 << 7) {
        return num >>> 0 // return unsigned number!
      }
      if (len > 35) {
        throw new Error('Integer out of range!')
      }
    }
  }
  /**
   * Read string of variable length
   * - varUint is used to store the length of the string
   */
  readVarString () {
    let len = this.readVarUint()
    let bytes = new Array(len)
    for (let i = 0; i < len; i++) {
      bytes[i] = this.uint8arr[this.pos++]
    }
    return utf8.getStringFromBytes(bytes)
  }
  /**
   *  Look ahead and read varString without incrementing position
   */
  peekVarString () {
    let pos = this.pos
    let s = this.readVarString()
    this.pos = pos
    return s
  }
  /**
   * Read ID
   * - If first varUint read is 0xFFFFFF a RootID is returned
   * - Otherwise an ID is returned
   */
  readID () {
    let user = this.readVarUint()
    if (user === RootFakeUserID) {
      // read property name and type id
      const rid = new RootID(this.readVarString(), null)
      rid.type = this.readVarUint()
      return rid
    }
    return new ID(user, this.readVarUint())
  }
}
