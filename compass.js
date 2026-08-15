(function() {
  'use strict';

  const MOUNTAINS_24 = [
    { name: 'Nhâm', center: 345 },
    { name: 'Tý',   center: 0   },
    { name: 'Quý',  center: 15  },
    { name: 'Sửu',  center: 30  },
    { name: 'Cấn',  center: 45  },
    { name: 'Dần',  center: 60  },
    { name: 'Giáp', center: 75  },
    { name: 'Mão',  center: 90  },
    { name: 'Ất',   center: 105 },
    { name: 'Thìn', center: 120 },
    { name: 'Tốn',  center: 135 },
    { name: 'Tỵ',   center: 150 },
    { name: 'Bính', center: 165 },
    { name: 'Ngọ',  center: 180 },
    { name: 'Đinh', center: 195 },
    { name: 'Mùi',  center: 210 },
    { name: 'Khôn', center: 225 },
    { name: 'Thân', center: 240 },
    { name: 'Canh', center: 255 },
    { name: 'Dậu',  center: 270 },
    { name: 'Tân',  center: 285 },
    { name: 'Tuất', center: 300 },
    { name: 'Càn',  center: 315 },
    { name: 'Hợi',  center: 330 },
  ];

  const DIRECTIONS_8 = [
    { name: 'BẮC',  center: 0   },
    { name: 'ĐB',   center: 45  },
    { name: 'ĐÔNG', center: 90  },
    { name: 'ĐN',   center: 135 },
    { name: 'NAM',  center: 180 },
    { name: 'TN',   center: 225 },
    { name: 'TÂY',  center: 270 },
    { name: 'TB',   center: 315 },
  ];

  const PALACE_CENTER_DEG = {
    1: 0, 2: 225, 3: 90, 4: 135, 6: 315, 7: 270, 8: 45, 9: 180
  };

  /**
   * Converts a compass degree to a canvas API angle (in radians).
   * 0° (North) is at BOTTOM, 90° (East) at LEFT, 180° (South) at TOP, 270° (West) at RIGHT.
   */
  function compassToCanvasAngle(compassDeg) {
    return (compassDeg + 90) * Math.PI / 180;
  }

  /**
   * Returns the absolute {x,y} coordinates on a circle given center, radius, and compass degree.
   */
  function getXY(cx, cy, radius, compassDeg) {
    const angle = compassToCanvasAngle(compassDeg);
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle)
    };
  }

  /**
   * Draws an enclosed band (ring) using an outer and inner radius.
   */
  function drawBand(ctx, cx, cy, outerR, innerR, fillColor) {
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, 2 * Math.PI, false);
    ctx.arc(cx, cy, innerR, 2 * Math.PI, 0, true);
    ctx.fillStyle = fillColor;
    ctx.fill();
  }

  /**
   * Draws the outline of a circle.
   */
  function drawCircle(ctx, cx, cy, radius, strokeColor, lineWidth) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }

  /**
   * Draws a radial line between two radii at a specified compass degree.
   */
  function drawRadialLine(ctx, cx, cy, r1, r2, compassDeg, color, lineWidth, dashArray) {
    const p1 = getXY(cx, cy, r1, compassDeg);
    const p2 = getXY(cx, cy, r2, compassDeg);
    ctx.save();
    if (dashArray) ctx.setLineDash(dashArray);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Draws tangential text (readable from outside the circle) at the specified position.
   */
  function drawText(ctx, cx, cy, radius, compassDeg, text, font, color) {
    const pos = getXY(cx, cy, radius, compassDeg);
    const textRotation = (compassDeg + 180) * Math.PI / 180;
    
    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(textRotation);
    ctx.fillStyle = color;
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }

  /**
   * Draws an arrowhead pointing radially outward along the given compass degree.
   */
  function drawArrowhead(ctx, cx, cy, radius, compassDeg, size, color) {
    const pos = getXY(cx, cy, radius, compassDeg);
    const angle = compassToCanvasAngle(compassDeg);
    
    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-size, -size * 0.45);
    ctx.lineTo(-size * 0.65, 0);
    ctx.lineTo(-size, size * 0.45);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  /**
   * Renders the La Bàn (compass) to the given canvas.
   * @param {HTMLCanvasElement} canvas
   * @param {number} facingDegree
   * @param {number} facingPalace
   * @param {Object} options - { showGuideLines: boolean }
   */
  function render(canvas, facingDegree, facingPalace, options) {
    options = options || {};
    const showGuideLines = options.showGuideLines !== false;

    // 1. Set canvas resolution to 1000x1000
    canvas.width = 1000;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d');
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const s = 1000 / 600; // Scale factor

    // 2. Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 3. Calculate rotation so that the facing palace is at the TOP (180° on canvas compass map)
    const palaceDeg = (PALACE_CENTER_DEG && PALACE_CENTER_DEG[facingPalace] !== undefined) ? PALACE_CENTER_DEG[facingPalace] : 180;
    const rotDeg = -(palaceDeg - 180);

    // 4. Apply main rotation
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotDeg * Math.PI / 180);
    ctx.translate(-cx, -cy);

    // Radii in scaled units
    const R_OUTER = 290 * s;
    const R_TICK_OUT = 288 * s;
    const R_TICK_IN_MINOR = 281 * s;
    const R_TICK_IN_MAJOR = 276 * s;
    const R_DEG_TEXT = 266 * s;
    const R_MTN_OUT = 258 * s;
    const R_MTN_TEXT = 237 * s;
    const R_MTN_IN = 216 * s;
    const R_DIR_OUT = 216 * s;
    const R_DIR_TEXT = 198 * s;
    const R_DIR_IN = 180 * s;
    const R_LINE_IN = 120 * s;

    // 5. Background bands
    drawBand(ctx, cx, cy, R_OUTER, R_MTN_OUT, '#f5ead0');
    drawBand(ctx, cx, cy, R_MTN_OUT, R_MTN_IN, '#faf0dc');
    drawBand(ctx, cx, cy, R_DIR_OUT, R_DIR_IN, '#f0e4ca');
    
    // Inner circle
    ctx.beginPath();
    ctx.arc(cx, cy, R_DIR_IN, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fill();

    // Ring borders
    drawCircle(ctx, cx, cy, R_OUTER, '#8B4513', 2 * s);
    drawCircle(ctx, cx, cy, R_MTN_OUT, '#a0522d', 1 * s);
    drawCircle(ctx, cx, cy, R_MTN_IN, '#a0522d', 1 * s);
    drawCircle(ctx, cx, cy, R_DIR_IN, '#8B4513', 1.5 * s);

    // Degree ticks (every 5°, numbers every 10°)
    for (let d = 0; d < 360; d++) {
      if (d % 5 === 0) {
        const isMajor = d % 10 === 0;
        const tickInR = isMajor ? R_TICK_IN_MAJOR : R_TICK_IN_MINOR;
        const tickColor = d === 0 ? '#CC0000' : '#5c3a1e';
        const tickWidth = isMajor ? 1.5 * s : 0.7 * s;
        drawRadialLine(ctx, cx, cy, R_TICK_OUT, tickInR, d, tickColor, tickWidth);

        if (isMajor) {
          const textColor = (d === 0 || d === 90 || d === 180 || d === 270) ? '#CC0000' : '#333';
          const font = `${Math.round(8 * s)}px "Inter", "Noto Sans", sans-serif`;
          drawText(ctx, cx, cy, R_DEG_TEXT, d, d.toString(), font, textColor);
        }
      }
    }

    // 24 Mountain boundaries and names
    for (let i = 0; i < 24; i++) {
      const boundDeg = i * 15 - 7.5;
      drawRadialLine(ctx, cx, cy, R_MTN_OUT, R_MTN_IN, boundDeg, '#a0522d', 0.7 * s);

      const mtn = MOUNTAINS_24[i];
      const font = `bold ${Math.round(10 * s)}px "Inter", "Noto Sans", sans-serif`;
      drawText(ctx, cx, cy, R_MTN_TEXT, mtn.center, mtn.name, font, '#1a1a1a');
    }

    // 8 Direction boundaries and names
    for (let i = 0; i < 8; i++) {
      const boundDeg = i * 45 + 22.5;
      drawRadialLine(ctx, cx, cy, R_DIR_OUT, R_DIR_IN, boundDeg, '#8B4513', 1.2 * s);

      const dir = DIRECTIONS_8[i];
      const font = `bold ${Math.round(13 * s)}px "Inter", "Noto Sans", sans-serif`;
      drawText(ctx, cx, cy, R_DIR_TEXT, dir.center, dir.name, font, '#CC0000');
    }

    // Divider lines toward center (from R_DIR_IN to R_LINE_IN)
    for (let i = 0; i < 24; i++) {
      const boundDeg = i * 15 - 7.5;
      if (i % 3 === 0) {
        drawRadialLine(ctx, cx, cy, R_DIR_IN, R_LINE_IN, boundDeg, 'rgba(180,50,50,0.5)', 1 * s);
      } else {
        drawRadialLine(ctx, cx, cy, R_DIR_IN, R_LINE_IN, boundDeg, 'rgba(180,50,50,0.25)', 0.5 * s, [3 * s, 3 * s]);
      }
    }

    // 6. Optional Extended Direction Guide Lines & Arrows (Trục & Tia phân cung)
    if (showGuideLines) {
      // 8 Sector Division Lines (22.5, 67.5, 112.5...) with outer arrows
      for (let i = 0; i < 8; i++) {
        const boundDeg = i * 45 + 22.5;
        // Radial ray from inner grid out to outer ring
        drawRadialLine(ctx, cx, cy, R_LINE_IN, R_OUTER, boundDeg, 'rgba(220, 38, 38, 0.45)', 1.2 * s, [4 * s, 4 * s]);
        drawArrowhead(ctx, cx, cy, R_OUTER - 2 * s, boundDeg, 10 * s, '#dc2626');
      }

      // 8 Cardinal/Ordinal Center Axis Lines
      for (let i = 0; i < 8; i++) {
        const dirDeg = DIRECTIONS_8[i].center;
        drawRadialLine(ctx, cx, cy, R_LINE_IN, R_OUTER, dirDeg, 'rgba(37, 99, 235, 0.35)', 1 * s, [5 * s, 5 * s]);
      }

      // Special Prominent Axis: HƯỚNG (Facing) - Red
      const sittingDegree = (facingDegree + 180) % 360;

      // Draw HƯỚNG Line & Arrow
      drawRadialLine(ctx, cx, cy, R_LINE_IN, R_OUTER + 10 * s, facingDegree, '#dc2626', 2.8 * s);
      drawArrowhead(ctx, cx, cy, R_OUTER + 12 * s, facingDegree, 16 * s, '#dc2626');

      // Draw HƯỚNG Label Badge
      const huongPos = getXY(cx, cy, R_OUTER - 26 * s, facingDegree);
      ctx.save();
      ctx.translate(huongPos.x, huongPos.y);
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.roundRect(-22 * s, -8 * s, 44 * s, 16 * s, 4 * s);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(8.5 * s)}px "Inter", "Noto Sans", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('HƯỚNG', 0, 0);
      ctx.restore();

      // Draw TỌA Line & Arrow - Blue (Màu khác)
      drawRadialLine(ctx, cx, cy, R_LINE_IN, R_OUTER + 10 * s, sittingDegree, '#2563eb', 2.8 * s);
      drawArrowhead(ctx, cx, cy, R_OUTER + 12 * s, sittingDegree, 16 * s, '#2563eb');

      // Draw TỌA Label Badge
      const toaPos = getXY(cx, cy, R_OUTER - 26 * s, sittingDegree);
      ctx.save();
      ctx.translate(toaPos.x, toaPos.y);
      ctx.fillStyle = '#2563eb';
      ctx.beginPath();
      ctx.roundRect(-18 * s, -8 * s, 36 * s, 16 * s, 4 * s);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(8.5 * s)}px "Inter", "Noto Sans", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('TỌA', 0, 0);
      ctx.restore();
    }

    // 7. Restore to original non-rotated context
    ctx.restore();

    // 8. Outer indicator triangle (if guide lines are not showing, keep standard outer arrow)
    if (!showGuideLines) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotDeg * Math.PI / 180);
      ctx.translate(-cx, -cy);

      const tip = getXY(cx, cy, R_OUTER + 2 * s, facingDegree);
      const baseL = getXY(cx, cy, R_OUTER + 14 * s, facingDegree - 2.5);
      const baseR = getXY(cx, cy, R_OUTER + 14 * s, facingDegree + 2.5);

      ctx.beginPath();
      ctx.moveTo(tip.x, tip.y);
      ctx.lineTo(baseL.x, baseL.y);
      ctx.lineTo(baseR.x, baseR.y);
      ctx.closePath();
      ctx.fillStyle = '#CC0000';
      ctx.fill();

      ctx.restore();
    }
  }

  // Expose module functionality
  window.Compass = {
    render: render,
    PALACE_CENTER_DEG: PALACE_CENTER_DEG
  };

})();
