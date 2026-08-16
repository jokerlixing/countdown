// 生成项目资源：应用图标 (PNG/ICO) 与结束提示音 (WAV)，纯 Node 实现，无第三方依赖
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// ---------- PNG 编码 ----------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeBuf = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([len, typeBuf, data, crc])
}

function encodePng(size, pixelAt) {
  const raw = Buffer.alloc(size * (size * 4 + 1))
  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1)
    raw[rowStart] = 0 // filter: none
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixelAt(x, y, size)
      const o = rowStart + 1 + x * 4
      raw[o] = r
      raw[o + 1] = g
      raw[o + 2] = b
      raw[o + 3] = a
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ])
}

// 图标设计：圆角蓝底 + 白色表盘刻度的时钟
function iconPixel(x, y, size) {
  const cx = size / 2
  const cy = size / 2
  const r = size * 0.46
  const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy)
  // 背景：圆角方块
  const rr = size * 0.2
  const dx = Math.max(rr - (x + 0.5), (x + 0.5) - (size - rr), 0)
  const dy = Math.max(rr - (y + 0.5), (y + 0.5) - (size - rr), 0)
  const inBg = dx * dx + dy * dy <= rr * rr
  if (!inBg) return [0, 0, 0, 0]

  // 时钟元素
  const ringOuter = r
  const ringInner = r * 0.82
  if (d > ringOuter) return [79, 124, 255, 255]
  if (d > ringInner) {
    // 刻度：12/3/6/9 点加粗
    const ang = Math.atan2(y + 0.5 - cy, x + 0.5 - cx)
    const near = (a) => Math.abs(Math.atan2(Math.sin(ang - a), Math.cos(ang - a))) < 0.09
    if (near(0) || near(Math.PI / 2) || near(Math.PI) || near(-Math.PI / 2)) return [255, 255, 255, 255]
    return [79, 124, 255, 255]
  }
  // 指针：指向 10 点 10 分方向的白色指针
  const px = x + 0.5 - cx
  const py = y + 0.5 - cy
  const inHand = (angle, len, w) => {
    const ca = Math.cos(angle)
    const sa = Math.sin(angle)
    const t = px * ca + py * sa
    if (t < 0 || t > len) return false
    const perp = Math.abs(-px * sa + py * ca)
    return perp < w
  }
  if (inHand(-Math.PI * 0.75, r * 0.55, size * 0.045)) return [255, 255, 255, 255]
  if (inHand(-Math.PI * 0.1, r * 0.8, size * 0.035)) return [255, 255, 255, 255]
  if (d < size * 0.05) return [255, 255, 255, 255]
  return [79, 124, 255, 255]
}

function makeIco(png) {
  // PNG-in-ICO（单张 256x256）
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(1, 4)
  const entry = Buffer.alloc(16)
  entry[0] = 0 // 256 -> 0
  entry[1] = 0
  entry[2] = 0
  entry[3] = 0
  entry.writeUInt16LE(1, 4) // 1 color plane
  entry.writeUInt16LE(32, 6) // 32 bpp
  entry.writeUInt32LE(png.length, 8)
  entry.writeUInt32LE(22, 12) // data offset
  return Buffer.concat([header, entry, png])
}

// ---------- WAV 编码 ----------
function makeWav() {
  const rate = 44100
  const seconds = 1.2
  const n = Math.floor(rate * seconds)
  const data = Buffer.alloc(n * 2)
  for (let i = 0; i < n; i++) {
    const t = i / rate
    const seg = Math.min(2, Math.floor(t / 0.18)) // 快速三连音
    const freq = [880, 1108.73, 1318.51][seg] // A5 C#6 E6
    const dur = t - seg * 0.18
    const env = Math.min(1, dur * 60) * Math.exp(-dur * 5)
    const s = Math.sin(2 * Math.PI * freq * t) * env * 0.55
    data.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(s * 32767))), i * 2)
  }
  const header = Buffer.alloc(44)
  header.write('RIFF', 0)
  header.writeUInt32LE(36 + data.length, 4)
  header.write('WAVE', 8)
  header.write('fmt ', 12)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20) // PCM
  header.writeUInt16LE(1, 22) // mono
  header.writeUInt32LE(rate, 24)
  header.writeUInt32LE(rate * 2, 28)
  header.writeUInt16LE(2, 32)
  header.writeUInt16LE(16, 34)
  header.write('data', 36)
  header.writeUInt32LE(data.length, 40)
  return Buffer.concat([header, data])
}

// ---------- 输出 ----------
for (const dir of ['resources/icons', 'resources/sounds', 'public']) {
  mkdirSync(resolve(root, dir), { recursive: true })
}

const png256 = encodePng(256, iconPixel)
writeFileSync(resolve(root, 'resources/icons/icon.png'), png256)
writeFileSync(resolve(root, 'resources/icons/icon.ico'), makeIco(png256))

const wav = makeWav()
writeFileSync(resolve(root, 'resources/sounds/finish.wav'), wav)
writeFileSync(resolve(root, 'public/finish.wav'), wav)

console.log('Assets generated: icon.png, icon.ico, finish.wav')
