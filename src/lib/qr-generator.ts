import QRCode from 'qrcode'

export interface QRCodeOptions {
  width?: number
  margin?: number
  color?: {
    dark?: string
    light?: string
  }
}

export const generateQRCode = async (
  text: string, 
  options: QRCodeOptions = {}
): Promise<string> => {
  const defaultOptions = {
    width: 256,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    ...options
  }

  try {
    return await QRCode.toDataURL(text, defaultOptions)
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw new Error('Failed to generate QR code')
  }
}

export const generateTableQRCode = async (
  tableNumber: number,
  baseUrl: string = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
): Promise<string> => {
  const tableUrl = `${baseUrl}/table/${tableNumber}`
  return generateQRCode(tableUrl, {
    width: 300,
    margin: 3,
    color: {
      dark: '#8B4513', // Brown color for cafe theme
      light: '#FFFFFF'
    }
  })
}

export const generateTableQRCodeSVG = async (
  tableNumber: number,
  baseUrl: string = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
): Promise<string> => {
  const tableUrl = `${baseUrl}/table/${tableNumber}`
  
  try {
    return await QRCode.toString(tableUrl, {
      type: 'svg',
      width: 300,
      margin: 3,
      color: {
        dark: '#8B4513',
        light: '#FFFFFF'
      }
    })
  } catch (error) {
    console.error('Error generating QR code SVG:', error)
    throw new Error('Failed to generate QR code SVG')
  }
}