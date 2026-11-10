import React from 'react';
import { Box, Typography } from '@mui/material';

// Standard Code 128 (Subset B) bar patterns (11 modules per character)
const CODE128_PATTERNS = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112' // 103: Start B, 106: Stop
];

export function generateCode128BPattern(text) {
  const clean = text || '000000';
  const codes = [104]; // Start Code B
  let checksum = 104;

  for (let i = 0; i < clean.length; i++) {
    const code = clean.charCodeAt(i) - 32;
    if (code >= 0 && code <= 95) {
      codes.push(code);
      checksum += code * (i + 1);
    }
  }

  const checkDigit = checksum % 103;
  codes.push(checkDigit);
  codes.push(106); // Stop pattern

  let pattern = '';
  for (const c of codes) {
    pattern += CODE128_PATTERNS[c] || CODE128_PATTERNS[0];
  }
  return pattern;
}

export const BarcodeSvg = ({ value, width = 160, height = 50 }) => {
  const pattern = generateCode128BPattern(value);
  const totalModules = pattern.split('').reduce((s, d) => s + parseInt(d, 10), 0);
  const moduleWidth = width / totalModules;

  let currentX = 0;
  const rects = [];
  let isBar = true;

  for (let i = 0; i < pattern.length; i++) {
    const count = parseInt(pattern[i], 10);
    const barWidth = count * moduleWidth;
    if (isBar) {
      rects.push(
        <rect
          key={i}
          x={currentX}
          y={0}
          width={barWidth}
          height={height}
          fill="#000000"
        />
      );
    }
    currentX += barWidth;
    isBar = !isBar;
  }

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {rects}
    </svg>
  );
};

const BarcodeLabelSheet = ({
  product,
  storeName = 'ExpenseManager Retail',
  copies = 12,
  sheetFormat = 'SHEET_24',
}) => {
  if (!product) return null;

  const barcodeVal = product.barcode || product.sku || '000000';
  const labelItems = Array.from({ length: Math.max(1, copies) });

  return (
    <Box className="barcode-print-sheet" sx={{ p: 2 }}>
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            .barcode-print-sheet, .barcode-print-sheet * {
              visibility: visible;
            }
            .barcode-print-sheet {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 0 !important;
              margin: 0 !important;
            }
            @page {
              size: ${sheetFormat === 'THERMAL_50X30' ? '50mm 30mm' : 'A4'};
              margin: ${sheetFormat === 'THERMAL_50X30' ? '0' : '8mm'};
            }
          }
        `}
      </style>

      {sheetFormat === 'THERMAL_50X30' ? (
        // Single Thermal Roll Format
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {labelItems.map((_, idx) => (
            <Box
              key={idx}
              sx={{
                width: '48mm',
                height: '28mm',
                border: '1px dashed #cbd5e1',
                borderRadius: '4px',
                p: '3mm',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: '#fff',
                pageBreakAfter: 'always',
              }}
            >
              <Typography variant="caption" sx={{ fontSize: '7pt', fontWeight: 700, textTransform: 'uppercase' }} noWrap>
                {storeName}
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '8pt', fontWeight: 800, textAlign: 'center', lineHeight: 1.1 }} noWrap>
                {product.name}
              </Typography>
              <Box my={0.5}>
                <BarcodeSvg value={barcodeVal} width={130} height={28} />
              </Box>
              <Box display="flex" justifyContent="space-between" width="100%" px={0.5}>
                <Typography variant="caption" sx={{ fontSize: '7pt', fontFamily: 'monospace' }}>
                  {barcodeVal}
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '8pt', fontWeight: 800, color: '#000' }}>
                  Rs. {Number(product.sellingPrice).toFixed(2)}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      ) : (
        // Standard A4 24-Up Sheet (3 Columns x 8 Rows)
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '3mm',
            width: '100%',
          }}
        >
          {labelItems.map((_, idx) => (
            <Box
              key={idx}
              sx={{
                border: '1px dashed #cbd5e1',
                borderRadius: '6px',
                p: 1.2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: '#ffffff',
                height: '32mm',
                overflow: 'hidden',
              }}
            >
              <Typography variant="caption" sx={{ fontSize: '7pt', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }} noWrap>
                {storeName}
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '8.5pt', fontWeight: 800, textAlign: 'center', maxWidth: '100%' }} noWrap>
                {product.name}
              </Typography>
              <Box my={0.6}>
                <BarcodeSvg value={barcodeVal} width={150} height={32} />
              </Box>
              <Box display="flex" justifyContent="space-between" width="100%" px={1}>
                <Typography variant="caption" sx={{ fontSize: '7.5pt', fontFamily: 'monospace', fontWeight: 600 }}>
                  {barcodeVal}
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '8.5pt', fontWeight: 800, color: '#0f172a' }}>
                  Rs. {Number(product.sellingPrice).toFixed(2)}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default BarcodeLabelSheet;
