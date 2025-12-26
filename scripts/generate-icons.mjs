/**
 * PWA Icon Generator Script
 * Generates multiple icon sizes from the source logo
 */

import sharp from 'sharp'
import { mkdir, copyFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')

const SOURCE_LOGO = join(projectRoot, 'public', 'A symbol BLUE-02.png')
const OUTPUT_DIR = join(projectRoot, 'public', 'icons')

const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512]

async function generateIcons() {
  console.log('Generating PWA icons...')

  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    await mkdir(OUTPUT_DIR, { recursive: true })
  }

  // Check if source exists
  if (!existsSync(SOURCE_LOGO)) {
    console.error(`Source logo not found: ${SOURCE_LOGO}`)
    process.exit(1)
  }

  // Generate icons for each size
  for (const size of ICON_SIZES) {
    const outputPath = join(OUTPUT_DIR, `icon-${size}x${size}.png`)

    try {
      await sharp(SOURCE_LOGO)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath)

      console.log(`Generated: icon-${size}x${size}.png`)
    } catch (error) {
      console.error(`Failed to generate ${size}x${size}: ${error.message}`)
    }
  }

  // Copy original as apple-touch-icon
  const appleTouchIcon = join(OUTPUT_DIR, 'apple-touch-icon.png')
  await sharp(SOURCE_LOGO)
    .resize(180, 180, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .png()
    .toFile(appleTouchIcon)
  console.log('Generated: apple-touch-icon.png')

  console.log('Icon generation complete!')
}

generateIcons().catch(console.error)
