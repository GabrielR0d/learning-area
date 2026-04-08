export type CardReadCallback = (uid: string) => void | Promise<void>

export interface BaseReader {
  start(): Promise<void>
  stop(): Promise<void>
  onCardRead(callback: CardReadCallback): void
}
