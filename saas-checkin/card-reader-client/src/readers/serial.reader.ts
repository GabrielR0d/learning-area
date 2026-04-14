import { SerialPort } from 'serialport'
import { ReadlineParser } from '@serialport/parser-readline'
import { BaseReader, CardReadCallback } from './base.reader'
import { logger } from '../utils/logger'

export class SerialReader implements BaseReader {
  private port: SerialPort | null = null
  private callback: CardReadCallback | null = null

  constructor(
    private readonly portPath: string,
    private readonly baudRate: number
  ) {}

  onCardRead(callback: CardReadCallback): void {
    this.callback = callback
  }

  async start(): Promise<void> {
    this.port = new SerialPort({
      path: this.portPath,
      baudRate: this.baudRate,
      autoOpen: false,
    })

    const parser = this.port.pipe(new ReadlineParser({ delimiter: '\r\n' }))

    parser.on('data', (data: string) => {
      const uid = data.trim().toUpperCase()
      if (uid && this.callback) {
        logger.debug({ uid }, 'Card read via serial')
        this.callback(uid)
      }
    })

    this.port.on('error', (err) => {
      logger.error({ err }, 'Serial port error')
    })

    await new Promise<void>((resolve, reject) => {
      this.port!.open((err) => {
        if (err) return reject(err)
        logger.info({ port: this.portPath, baud: this.baudRate }, 'Serial port opened')
        resolve()
      })
    })
  }

  async stop(): Promise<void> {
    if (this.port?.isOpen) {
      await new Promise<void>((resolve) => this.port!.close(() => resolve()))
    }
  }
}
