import 'dotenv/config'

function required(name: string): string {
  const val = process.env[name]
  if (!val) throw new Error(`Missing required env variable: ${name}`)
  return val
}

export const config = {
  BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:3001',
  DEVICE_API_KEY: required('DEVICE_API_KEY'),
  READER_TYPE: (process.env.READER_TYPE || 'SERIAL') as 'SERIAL' | 'HID',
  SERIAL_PORT: process.env.SERIAL_PORT || '/dev/ttyUSB0',
  SERIAL_BAUD_RATE: Number(process.env.SERIAL_BAUD_RATE) || 9600,
  HID_VENDOR_ID: parseInt(process.env.HID_VENDOR_ID || '0x0403', 16),
  HID_PRODUCT_ID: parseInt(process.env.HID_PRODUCT_ID || '0x6001', 16),
  FIXED_DIRECTION: (process.env.FIXED_DIRECTION || 'IN') as 'IN' | 'OUT',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
}
