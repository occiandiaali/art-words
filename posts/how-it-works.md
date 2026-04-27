# Technical Details

## Binary Conversion Process

Each character in your input text is converted to its ASCII code, which is then converted to an 8-bit binary string. For example:

- 'A' → 65 → '01000001'
- ' ' (space) → 32 → '00100000'

## Image Generation

The binary string is divided into 24-bit segments (8 bits each for Red, Green, and Blue channels). These values determine the color of each pixel in the generated image.

### Example:

Binary segment: `010000010010000001100001`

- Red: `01000001` → 65
- Green: `00100000` → 32
- Blue: `01100001` → 97

This would create a pixel with RGB(65, 32, 97)
