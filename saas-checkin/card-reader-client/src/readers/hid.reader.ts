import HID from 'node-hid'
import { BaseReader, CardReadCallback } from './base.reader'
import { logger } from '../utils/logger'

export class HidReader implements BaseReader {
  private device: HID.HID | null = null
  private callback: CardReadCallback | null = null
  private buffer = ''

  constructor(
    private readonly vendorId: number,
    private readonly productId: number
  ) {}

  onCardRead(callback: CardReadCallback): void {
    this.callback = callback
  }

  async start(): Promise<void> {
    this.device = new HID.HID(this.vendorId, this.productId)
    logger.info({ vendorId: this.vendorId, productId: this.productId }, 'HID device opened')

    this.device.on('data', (data: Buffer) => {
      // HID keyboard emulation: each byte is a HID key code
      // Key codes 4-13 correspond to a-z and 0-9
      for (const byte of data) {
        if (byte === 0) continue
        if (byte === 40) {
          // Enter key — card read complete
          const uid = this.buffer.trim().toUpperCase()
          if (uid && this.callback) {
            logger.debug({ uid }, 'Card read via HID')
            this.callback(uid)
          }
          this.buffer = ''
        } else if (byte >= 4 && byte <= 13) {
          this.buffer += String.fromCharCode(byte + 93)
        } else if (byte >= 30 && byte <= 38) {
          this.buffer += String(byte - 29)
        } else if (byte === 39) {
          this.buffer += '0'
        }
      }
    })

    this.device.on('error', (err: Error) => {
      logger.error({ err }, 'HID device error')
    })
  }

  async stop(): Promise<void> {
    this.device?.close()
  }
}
