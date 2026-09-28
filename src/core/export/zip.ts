/** A plain (non-shared) byte view, which is what the Blob constructor accepts. */
type Bytes = Uint8Array<ArrayBuffer>

export type ZipEntry = {
  name: string
  data: Bytes
}

let crcTable: Int32Array | null = null

function getCrcTable(): Int32Array {
  if (crcTable) return crcTable
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  crcTable = table
  return table
}

function crc32(data: Uint8Array): number {
  const table = getCrcTable()
  let crc = -1
  for (let i = 0; i < data.length; i += 1) {
    crc = (table[(crc ^ data[i]!) & 0xff]! ^ (crc >>> 8)) | 0
  }
  return (crc ^ -1) >>> 0
}

function dosTime(date: Date): { time: number; date: number } {
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1),
    date:
      ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  }
}

const encoder = new TextEncoder()

/**
 * Minimal store-only ZIP writer. Exported PNG / JPG / WebP files are already
 * compressed, so storing them verbatim keeps this dependency-free and fast.
 */
export function createZip(entries: ZipEntry[], now = new Date()): Blob {
  const { time, date } = dosTime(now)
  const parts: Bytes[] = []
  const central: Bytes[] = []
  let offset = 0

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name)
    const crc = crc32(entry.data)
    const size = entry.data.length

    const local = new Uint8Array(30 + nameBytes.length)
    const localView = new DataView(local.buffer)
    localView.setUint32(0, 0x04034b50, true)
    localView.setUint16(4, 20, true)
    localView.setUint16(6, 0x0800, true)
    localView.setUint16(8, 0, true)
    localView.setUint16(10, time, true)
    localView.setUint16(12, date, true)
    localView.setUint32(14, crc, true)
    localView.setUint32(18, size, true)
    localView.setUint32(22, size, true)
    localView.setUint16(26, nameBytes.length, true)
    localView.setUint16(28, 0, true)
    local.set(nameBytes, 30)

    parts.push(local, entry.data)

    const header = new Uint8Array(46 + nameBytes.length)
    const headerView = new DataView(header.buffer)
    headerView.setUint32(0, 0x02014b50, true)
    headerView.setUint16(4, 20, true)
    headerView.setUint16(6, 20, true)
    headerView.setUint16(8, 0x0800, true)
    headerView.setUint16(10, 0, true)
    headerView.setUint16(12, time, true)
    headerView.setUint16(14, date, true)
    headerView.setUint32(16, crc, true)
    headerView.setUint32(20, size, true)
    headerView.setUint32(24, size, true)
    headerView.setUint16(28, nameBytes.length, true)
    headerView.setUint32(42, offset, true)
    header.set(nameBytes, 46)
    central.push(header)

    offset += local.length + size
  }

  const centralSize = central.reduce((sum, header) => sum + header.length, 0)
  const end = new Uint8Array(22)
  const endView = new DataView(end.buffer)
  endView.setUint32(0, 0x06054b50, true)
  endView.setUint16(8, entries.length, true)
  endView.setUint16(10, entries.length, true)
  endView.setUint32(12, centralSize, true)
  endView.setUint32(16, offset, true)

  return new Blob([...parts, ...central, end], { type: 'application/zip' })
}
