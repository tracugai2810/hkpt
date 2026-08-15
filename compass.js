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
   * Draws the outline of a circle.
   */
  function drawCircle(ctx, cx, cy, radius, strokeColor, lineWidth, dashArray) {
    ctx.save();
    if (dashArray) ctx.setLineDash(dashArray);
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
    ctx.restore();
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
   * Renders the La Bàn (compass) to the given canvas with clean modern styling
   * and connecting lines extending all the way into the center (tận tâm la bàn).
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

    // 2. Clear canvas with transparency
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 3. Calculate rotation so that the facing palace is at the TOP (180° on canvas compass map)
    const palaceDeg = (PALACE_CENTER_DEG && PALACE_CENTER_DEG[facingPalace] !== undefined) ? PALACE_CENTER_DEG[facingPalace] : 180;
    const rotDeg = -(palaceDeg - 180);

    // 4. Apply main rotation
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotDeg * Math.PI / 180);
    ctx.translate(-cx, -cy);

    // Radii in scaled units matching the reference visual style
    const R_OUTER = 290 * s;
    const R_TICK_OUT = 288 * s;
    const R_TICK_IN_MINOR = 282 * s;
    const R_TICK_IN_MAJOR = 276 * s;
    const R_DEG_TEXT = 264 * s;
    const R_RING_1 = 252 * s;
    const R_MTN_TEXT = 230 * s;
    const R_RING_2 = 208 * s;
    const R_DIR_TEXT = 186 * s;
    const R_RING_3 = 164 * s;

    // 5. Subtle concentric guide circles (clean modern look)
    drawCircle(ctx, cx, cy, R_TICK_OUT, 'rgba(220, 38, 38, 0.35)', 1 * s);
    drawCircle(ctx, cx, cy, R_RING_1, 'rgba(220, 38, 38, 0.2)', 0.8 * s, [4 * s, 4 * s]);
    drawCircle(ctx, cx, cy, R_RING_2, 'rgba(220, 38, 38, 0.2)', 0.8 * s, [4 * s, 4 * s]);
    drawCircle(ctx, cx, cy, R_RING_3, 'rgba(220, 38, 38, 0.25)', 0.8 * s);

    // 6. Connecting radial lines extending ALL THE WAY TO THE VERY CENTER (tận tâm 0,0)
    if (showGuideLines) {
      // 24 Mountains rays: connecting from center (0) out to R_TICK_OUT
      for (let i = 0; i < 24; i++) {
        const boundDeg = i * 15 - 7.5;
        drawRadialLine(ctx, cx, cy, 0, R_TICK_OUT, boundDeg, 'rgba(220, 38, 38, 0.22)', 0.7 * s, [3 * s, 3 * s]);
      }

      // 8 Palaces boundary rays: connecting from center (0) out to R_OUTER in solid light red
      for (let i = 0; i < 8; i++) {
        const boundDeg = i * 45 + 22.5;
        drawRadialLine(ctx, cx, cy, 0, R_OUTER, boundDeg, 'rgba(220, 38, 38, 0.5)', 1.2 * s);
        drawArrowhead(ctx, cx, cy, R_OUTER - 2 * s, boundDeg, 9 * s, '#dc2626');
      }

      // 8 Direction center rays: from center (0) out to R_RING_1
      for (let i = 0; i < 8; i++) {
        const dirDeg = DIRECTIONS_8[i].center;
        drawRadialLine(ctx, cx, cy, 0, R_RING_1, dirDeg, 'rgba(220, 38, 38, 0.35)', 1 * s, [4 * s, 4 * s]);
      }
    }

    // 7. Degree ticks (every 5°, numbers every 10°)
    for (let d = 0; d < 360; d++) {
      if (d % 5 === 0) {
        const isMajor = d % 10 === 0;
        const tickInR = isMajor ? R_TICK_IN_MAJOR : R_TICK_IN_MINOR;
        const isCardinal = (d === 0 || d === 90 || d === 180 || d === 270);
        const tickColor = isCardinal ? '#dc2626' : 'rgba(220, 38, 38, 0.5)';
        const tickWidth = isMajor ? 1.4 * s : 0.7 * s;
        drawRadialLine(ctx, cx, cy, R_TICK_OUT, tickInR, d, tickColor, tickWidth);

        if (isMajor) {
          const textColor = isCardinal ? '#dc2626' : '#64748b';
          const font = isCardinal 
            ? `bold ${Math.round(9 * s)}px "Inter", "Noto Sans", sans-serif`
            : `${Math.round(8 * s)}px "Inter", "Noto Sans", sans-serif`;
          drawText(ctx, cx, cy, R_DEG_TEXT, d, d.toString(), font, textColor);
        }
      }
    }

    // 8. 24 Mountains text
    for (let i = 0; i < 24; i++) {
      const mtn = MOUNTAINS_24[i];
      const font = `500 ${Math.round(10 * s)}px "Noto Sans", "Inter", sans-serif`;
      drawText(ctx, cx, cy, R_MTN_TEXT, mtn.center, mtn.name, font, '#475569');
    }

    // 9. 8 Directions text (bold red)
    for (let i = 0; i < 8; i++) {
      const dir = DIRECTIONS_8[i];
      const font = `800 ${Math.round(13 * s)}px "Inter", "Noto Sans", sans-serif`;
      drawText(ctx, cx, cy, R_DIR_TEXT, dir.center, dir.name, font, '#dc2626');
    }

    // 10. Distinct HƯỚNG & TỌA rays & badges (connecting from center to outer ring)
    if (showGuideLines) {
      const sittingDegree = (facingDegree + 180) % 360;

      // HƯỚNG (Facing) - Bold Red ray into center
      drawRadialLine(ctx, cx, cy, 0, R_OUTER + 10 * s, facingDegree, '#dc2626', 2.8 * s);
      drawArrowhead(ctx, cx, cy, R_OUTER + 12 * s, facingDegree, 16 * s, '#dc2626');

      // HƯỚNG badge
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

      // TỌA (Sitting) - Bold Blue ray into center (màu khác phân biệt)
      drawRadialLine(ctx, cx, cy, 0, R_OUTER + 10 * s, sittingDegree, '#2563eb', 2.8 * s);
      drawArrowhead(ctx, cx, cy, R_OUTER + 12 * s, sittingDegree, 16 * s, '#2563eb');

      // TỌA badge
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

    // 11. Restore context
    ctx.restore();
  }

  // Expose module functionality
  window.Compass = {
    render: render,
    PALACE_CENTER_DEG: PALACE_CENTER_DEG
  };

})();
