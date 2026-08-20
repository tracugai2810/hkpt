(function() {
  'use strict';

  // State variables
  let isInitialized = false;
  let currentRotation = 0; // degrees
  let normalizedCenterX = 0.5; // ratio [0, 1] relative to image
  let normalizedCenterY = 0.5;
  let centerX = 0; // px relative to image
  let centerY = 0;
  let isDragging = false;
  let isMovingCenter = false;
  let isPanning = false;
  let panStartX = 0;
  let panStartY = 0;
  let scrollStartX = 0;
  let scrollStartY = 0;
  let startAngle = 0;
  let isAdjustingCenter = false;
  let overlaySize = 240; // px
  let overlayOpacity = 0.7;
  let imageZoom = 100; // percent (50 - 300)
  let showGuideLines = true;
  let isFullscreen = false;

  // Centering modes: 'free' | 'box' | 'polygon' | 'auto'
  let centerMode = 'free';
  let boxPoints = []; // [{x, y}] normalized ratios (max 2 points)
  let polygonPoints = []; // [{x, y}] normalized ratios

  // Touch tracking for pinch-to-zoom & two-finger rotate
  let touchStartDist = 0;
  let touchStartSize = 0;
  let touchStartAngle = 0;
  let touchStartRotation = 0;

  // DOM Elements
  let btnUploadPlan, floorplanFileInput, floorplanSection, floorplanContainer, floorplanWrapper;
  let floorplanImage, floorplanHelperCanvas, floorplanOverlay, floorplanCompass;
  let centerMarker, sizeSlider, imageZoomSlider, opacitySlider, rotationDisplay;
  let btnAdjustCenter, btnResetFloorplan, btnExportFloorplan, btnToggleFullscreen;
  let transparentBgCheckbox, guideLinesCheckbox;
  let centerToolsPanel, centerToolDesc;
  let centerBoxActions, centerPolyActions, centerFreeActions;
  let btnModeFree, btnModeBox, btnModePolygon, btnModeAuto;
  let btnBoxDone, btnBoxClear, btnPolyDone, btnPolyUndo, btnPolyClear, btnFreeDone;

  function init() {
    if (isInitialized) return;

    // Get DOM elements
    btnUploadPlan = document.getElementById('btnUploadPlan');
    floorplanFileInput = document.getElementById('floorplanFileInput');
    floorplanSection = document.getElementById('floorplanSection');
    floorplanContainer = document.getElementById('floorplanContainer');
    floorplanWrapper = document.getElementById('floorplanWrapper');
    floorplanImage = document.getElementById('floorplanImage');
    floorplanHelperCanvas = document.getElementById('floorplanHelperCanvas');
    floorplanOverlay = document.getElementById('floorplanOverlay');
    floorplanCompass = document.getElementById('floorplanCompass');
    centerMarker = document.getElementById('centerMarker');
    sizeSlider = document.getElementById('sizeSlider');
    imageZoomSlider = document.getElementById('imageZoomSlider');
    opacitySlider = document.getElementById('opacitySlider');
    transparentBgCheckbox = document.getElementById('transparentBgCheckbox');
    guideLinesCheckbox = document.getElementById('guideLinesCheckbox');
    rotationDisplay = document.getElementById('rotationDisplay');
    btnAdjustCenter = document.getElementById('btnAdjustCenter');
    btnResetFloorplan = document.getElementById('btnResetFloorplan');
    btnExportFloorplan = document.getElementById('btnExportFloorplan');
    btnToggleFullscreen = document.getElementById('btnToggleFullscreen');

    // Center Tools elements
    centerToolsPanel = document.getElementById('centerToolsPanel');
    centerToolDesc = document.getElementById('centerToolDesc');
    centerBoxActions = document.getElementById('centerBoxActions');
    centerPolyActions = document.getElementById('centerPolyActions');
    centerFreeActions = document.getElementById('centerFreeActions');
    btnModeFree = document.getElementById('btnModeFree');
    btnModeBox = document.getElementById('btnModeBox');
    btnModePolygon = document.getElementById('btnModePolygon');
    btnModeAuto = document.getElementById('btnModeAuto');
    
    btnBoxDone = document.getElementById('btnBoxDone');
    btnBoxClear = document.getElementById('btnBoxClear');
    btnPolyDone = document.getElementById('btnPolyDone');
    btnPolyUndo = document.getElementById('btnPolyUndo');
    btnPolyClear = document.getElementById('btnPolyClear');
    btnFreeDone = document.getElementById('btnFreeDone');

    if (!btnUploadPlan || !floorplanFileInput || !floorplanImage || !floorplanContainer) {
      console.warn('FloorPlan: Missing required DOM elements');
      return;
    }

    // 1. Upload button
    btnUploadPlan.addEventListener('click', function() {
      floorplanFileInput.click();
    });

    // 2. File input change
    floorplanFileInput.addEventListener('change', handleFileUpload);

    // 3. Star Chart Size slider
    if (sizeSlider) {
      sizeSlider.addEventListener('input', function(e) {
        overlaySize = parseInt(e.target.value, 10);
        updateOverlayPosition();
      });
    }

    // 4. Floorplan Image Zoom slider
    if (imageZoomSlider) {
      imageZoomSlider.addEventListener('input', function(e) {
        imageZoom = parseInt(e.target.value, 10);
        updateImageZoom();
      });
    }

    // 5. Opacity slider
    if (opacitySlider) {
      overlayOpacity = parseInt(opacitySlider.value, 10) / 100;
      opacitySlider.addEventListener('input', function(e) {
        overlayOpacity = parseInt(e.target.value, 10) / 100;
        if (floorplanOverlay) {
          floorplanOverlay.style.opacity = overlayOpacity;
        }
      });
    }

    // 6. Transparent BG checkbox
    if (transparentBgCheckbox) {
      transparentBgCheckbox.addEventListener('change', function() {
        updateTransparentState();
      });
    }

    // 7. Guide lines & Sitting/Facing axis checkbox
    if (guideLinesCheckbox) {
      guideLinesCheckbox.addEventListener('change', function() {
        showGuideLines = this.checked;
        renderCompass();
      });
    }

    // 8. Adjust center button toggle
    if (btnAdjustCenter) {
      btnAdjustCenter.addEventListener('click', toggleAdjustCenter);
    }

    // 9. Reset button
    if (btnResetFloorplan) {
      btnResetFloorplan.addEventListener('click', function() {
        currentRotation = 0;
        imageZoom = 100;
        boxPoints = [];
        polygonPoints = [];
        if (imageZoomSlider) imageZoomSlider.value = 100;
        updateImageZoom();
        updateOverlayPosition();
        renderHelperCanvas();
      });
    }

    // 10. Export button
    if (btnExportFloorplan) {
      btnExportFloorplan.addEventListener('click', exportFloorplan);
    }

    // 11. Fullscreen / Wide mode toggle
    if (btnToggleFullscreen) {
      btnToggleFullscreen.addEventListener('click', toggleFullscreen);
    }

    // 12. Center Tool Modes
    if (btnModeFree) btnModeFree.addEventListener('click', () => switchCenterMode('free'));
    if (btnModeBox) btnModeBox.addEventListener('click', () => switchCenterMode('box'));
    if (btnModePolygon) btnModePolygon.addEventListener('click', () => switchCenterMode('polygon'));
    if (btnModeAuto) btnModeAuto.addEventListener('click', () => {
      detectCenter(floorplanImage);
      setupOverlay();
      switchCenterMode('auto');
    });

    // 13. Center Confirmation and Action Buttons
    if (btnBoxDone) btnBoxDone.addEventListener('click', confirmAndLockCenter);
    if (btnBoxClear) btnBoxClear.addEventListener('click', clearBoxPoints);

    if (btnPolyDone) btnPolyDone.addEventListener('click', finishPolygonAndLock);
    if (btnPolyUndo) btnPolyUndo.addEventListener('click', undoPolygonPoint);
    if (btnPolyClear) btnPolyClear.addEventListener('click', clearPolygon);

    if (btnFreeDone) btnFreeDone.addEventListener('click', confirmAndLockCenter);

    // 14. Mouse Wheel Zoom on star chart (or on image if Ctrl is held)
    floorplanContainer.addEventListener('wheel', handleWheelZoom, { passive: false });

    // 15. Core interaction handlers (Rotate, Move Center, Pinch Zoom, Pan)
    setupInteractionHandlers();

    // 16. Window resize listener to keep overlay and canvas aligned
    window.addEventListener('resize', debounce(() => {
      calculateCenterPx();
      updateOverlayPosition();
      renderHelperCanvas();
    }, 150));

    isInitialized = true;
  }

  function toggleFullscreen() {
    isFullscreen = !isFullscreen;
    if (floorplanSection) {
      floorplanSection.classList.toggle('fullscreen-mode', isFullscreen);
    }
    if (btnToggleFullscreen) {
      const iconExp = btnToggleFullscreen.querySelector('.icon-expand');
      const iconComp = btnToggleFullscreen.querySelector('.icon-compress');
      const btnText = btnToggleFullscreen.querySelector('.btn-text');
      if (iconExp && iconComp) {
        iconExp.classList.toggle('hidden', isFullscreen);
        iconComp.classList.toggle('hidden', !isFullscreen);
      }
      if (btnText) {
        btnText.textContent = isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình';
      }
    }
    setTimeout(() => {
      calculateCenterPx();
      updateOverlayPosition();
      renderHelperCanvas();
      scrollToCenter();
    }, 100);
  }

  function toggleAdjustCenter() {
    isAdjustingCenter = !isAdjustingCenter;
    if (isAdjustingCenter) {
      btnAdjustCenter.textContent = '✓ Xong';
      btnAdjustCenter.classList.add('active');
      floorplanContainer.classList.add('adjusting-center');
      if (centerMarker) centerMarker.style.display = 'block';
      if (centerToolsPanel) centerToolsPanel.classList.remove('hidden');
      switchCenterMode(centerMode);
    } else {
      btnAdjustCenter.textContent = '📍 Chỉnh Tâm';
      btnAdjustCenter.classList.remove('active');
      floorplanContainer.classList.remove('adjusting-center');
      if (centerMarker) centerMarker.style.display = 'none';
      if (centerToolsPanel) centerToolsPanel.classList.add('hidden');
      renderHelperCanvas();
    }
  }

  function confirmAndLockCenter() {
    // If in box mode with 2 points, ensure center is calculated
    if (centerMode === 'box' && boxPoints.length === 2) {
      normalizedCenterX = (boxPoints[0].x + boxPoints[1].x) / 2;
      normalizedCenterY = (boxPoints[0].y + boxPoints[1].y) / 2;
    }
    calculateCenterPx();
    updateOverlayPosition();

    // Permanently exit center adjusting mode to lock the center
    if (isAdjustingCenter) {
      toggleAdjustCenter();
    }
  }

  function clearBoxPoints() {
    boxPoints = [];
    renderHelperCanvas();
    if (centerToolDesc) {
      centerToolDesc.innerHTML = '📐 <strong>Lập cực 2 góc chéo:</strong> Hãy click <strong>Góc thứ 1</strong> (ví dụ: góc trên-trái tường bao nhà).';
    }
  }

  function switchCenterMode(mode) {
    centerMode = mode;
    const modeBtns = [btnModeFree, btnModeBox, btnModePolygon, btnModeAuto];
    modeBtns.forEach(btn => {
      if (btn) btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    if (centerBoxActions) centerBoxActions.classList.toggle('hidden', mode !== 'box');
    if (centerPolyActions) centerPolyActions.classList.toggle('hidden', mode !== 'polygon');
    if (centerFreeActions) centerFreeActions.classList.toggle('hidden', mode !== 'free' && mode !== 'auto');

    if (centerToolDesc) {
      if (mode === 'free') {
        centerToolDesc.innerHTML = '💡 <strong>Kéo / Chấm Tâm:</strong> Click hoặc kéo thả trực tiếp điểm tâm đỏ đến vị trí trung tâm mong muốn. Sau đó nhấn <strong>✓ Xác Nhận & Khóa Tâm</strong>.';
      } else if (mode === 'box') {
        boxPoints = [];
        centerToolDesc.innerHTML = '📐 <strong>Lập cực 2 góc chéo (Nhà vuông / chữ nhật):</strong> Hãy click <strong>Góc thứ 1</strong> (ví dụ: góc trên-trái tường bao nhà).';
      } else if (mode === 'polygon') {
        polygonPoints = [];
        centerToolDesc.innerHTML = '⬡ <strong>Đa giác (Nhà chữ L / khuyết góc / đất xéo):</strong> Click lần lượt từng góc tường bao của ngôi nhà (tối thiểu 3 góc).';
      } else if (mode === 'auto') {
        centerToolDesc.innerHTML = '⚡ <strong>Tự động quét:</strong> Đã tự động phân tích và xác định tâm khối kiến trúc chính của bản vẽ. Nhấn <strong>✓ Xác Nhận & Khóa Tâm</strong> để hoàn tất.';
      }
    }
    renderHelperCanvas();
  }

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
      const img = new Image();
      img.onload = function() {
        if (floorplanSection) floorplanSection.classList.remove('hidden');
        document.body.classList.add('has-floorplan');
        const appContainer = document.querySelector('.app-container');
        if (appContainer) appContainer.classList.add('has-floorplan');

        floorplanImage.src = img.src;
        imageZoom = 100;
        boxPoints = [];
        polygonPoints = [];
        if (imageZoomSlider) imageZoomSlider.value = 100;
        floorplanImage.style.width = '100%';
        
        setTimeout(() => {
          detectCenter(floorplanImage);
          setupOverlay();
          scrollToCenter();
          renderHelperCanvas();
          floorplanSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 120);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  // Smart Architectural Structural Bounds Detection
  function detectCenter(imgElement) {
    const naturalW = imgElement.naturalWidth;
    const naturalH = imgElement.naturalHeight;
    if (!naturalW || !naturalH) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = naturalW;
    canvas.height = naturalH;
    
    ctx.drawImage(imgElement, 0, 0, naturalW, naturalH);
    let imageData;
    try {
      imageData = ctx.getImageData(0, 0, naturalW, naturalH);
    } catch(err) {
      console.warn('Cannot read image data, fallback to geometric center', err);
    }
    
    if (imageData) {
      const data = imageData.data;
      
      // Trim outer 4% margins to remove border lines
      const marginX = Math.floor(naturalW * 0.04);
      const marginY = Math.floor(naturalH * 0.04);
      
      // 1D Line Density Histograms
      const rowDensity = new Float32Array(naturalH);
      const colDensity = new Float32Array(naturalW);
      
      const step = 2; // performance sampling
      for (let y = marginY; y < naturalH - marginY; y += step) {
        for (let x = marginX; x < naturalW - marginX; x += step) {
          const i = (y * naturalW + x) * 4;
          const a = data[i + 3];
          if (a < 128) continue;
          
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          if (gray < 160) {
            // Dark pixel detected
            const weight = (160 - gray) / 160;
            rowDensity[y] += weight;
            colDensity[x] += weight;
          }
        }
      }
      
      // Find peak densities
      let maxRowD = 0, maxColD = 0;
      for (let y = 0; y < naturalH; y++) if (rowDensity[y] > maxRowD) maxRowD = rowDensity[y];
      for (let x = 0; x < naturalW; x++) if (colDensity[x] > maxColD) maxColD = colDensity[x];
      
      const rowThreshold = maxRowD * 0.08;
      const colThreshold = maxColD * 0.08;
      
      let minX = marginX, maxX = naturalW - marginX;
      let minY = marginY, maxY = naturalH - marginY;
      
      // Scan inward to find continuous structural boundaries
      for (let x = marginX; x < naturalW - marginX; x++) {
        if (colDensity[x] > colThreshold) { minX = x; break; }
      }
      for (let x = naturalW - marginX; x >= marginX; x--) {
        if (colDensity[x] > colThreshold) { maxX = x; break; }
      }
      for (let y = marginY; y < naturalH - marginY; y++) {
        if (rowDensity[y] > rowThreshold) { minY = y; break; }
      }
      for (let y = naturalH - marginY; y >= marginY; y--) {
        if (rowDensity[y] > rowThreshold) { maxY = y; break; }
      }
      
      // Check bottom 25% for a valley to remove title text block
      const bottomQuarter = Math.floor(naturalH * 0.75);
      if (maxY > bottomQuarter) {
        let valleyY = -1;
        let minValleyVal = Infinity;
        for (let y = bottomQuarter; y < maxY - 15; y++) {
          if (rowDensity[y] < minValleyVal) {
            minValleyVal = rowDensity[y];
            valleyY = y;
          }
        }
        if (minValleyVal < maxRowD * 0.05 && valleyY > 0) {
          maxY = valleyY;
        }
      }
      
      if (maxX > minX + 50 && maxY > minY + 50) {
        normalizedCenterX = ((minX + maxX) / 2) / naturalW;
        normalizedCenterY = ((minY + maxY) / 2) / naturalH;
      } else {
        normalizedCenterX = 0.5;
        normalizedCenterY = 0.5;
      }
    } else {
      normalizedCenterX = 0.5;
      normalizedCenterY = 0.5;
    }
    
    calculateCenterPx();
    if (centerMarker) {
      centerMarker.style.display = isAdjustingCenter ? 'block' : 'none';
    }
    currentRotation = 0;
  }

  function calculateCenterPx() {
    const curW = floorplanImage.offsetWidth || floorplanImage.width || 400;
    const curH = floorplanImage.offsetHeight || floorplanImage.height || 300;
    centerX = normalizedCenterX * curW;
    centerY = normalizedCenterY * curH;
  }

  function updateImageZoom(anchorClientX, anchorClientY) {
    if (!floorplanImage) return;
    
    const containerW = floorplanContainer.clientWidth;
    const containerH = floorplanContainer.clientHeight;
    const oldImgW = floorplanImage.offsetWidth || 1;
    const oldImgH = floorplanImage.offsetHeight || 1;
    
    // Determine the anchor point in image-ratio space
    let ratioX, ratioY;
    if (typeof anchorClientX === 'number' && typeof anchorClientY === 'number') {
      const containerRect = floorplanContainer.getBoundingClientRect();
      const localX = anchorClientX - containerRect.left + floorplanContainer.scrollLeft;
      const localY = anchorClientY - containerRect.top + floorplanContainer.scrollTop;
      ratioX = localX / oldImgW;
      ratioY = localY / oldImgH;
    } else {
      const viewCenterX = floorplanContainer.scrollLeft + containerW / 2;
      const viewCenterY = floorplanContainer.scrollTop + containerH / 2;
      ratioX = viewCenterX / oldImgW;
      ratioY = viewCenterY / oldImgH;
    }
    
    ratioX = Math.max(0, Math.min(1, ratioX));
    ratioY = Math.max(0, Math.min(1, ratioY));
    
    // Apply zoom
    floorplanImage.style.width = imageZoom + '%';
    floorplanImage.style.maxWidth = 'none';
    
    // Recalculate pixel center
    calculateCenterPx();
    
    // Scroll to preserve anchor
    const newImgW = floorplanImage.offsetWidth;
    const newImgH = floorplanImage.offsetHeight;
    
    if (typeof anchorClientX === 'number' && typeof anchorClientY === 'number') {
      const containerRect = floorplanContainer.getBoundingClientRect();
      const screenOffsetX = anchorClientX - containerRect.left;
      const screenOffsetY = anchorClientY - containerRect.top;
      floorplanContainer.scrollLeft = ratioX * newImgW - screenOffsetX;
      floorplanContainer.scrollTop = ratioY * newImgH - screenOffsetY;
    } else {
      floorplanContainer.scrollLeft = ratioX * newImgW - containerW / 2;
      floorplanContainer.scrollTop = ratioY * newImgH - containerH / 2;
    }
    
    updateOverlayPosition();
    renderHelperCanvas();
  }

  function setupOverlay() {
    calculateCenterPx();
    updateOverlayPosition();
    renderHelperCanvas();
  }

  function scrollToCenter() {
    if (!floorplanContainer || !floorplanImage) return;
    const containerW = floorplanContainer.clientWidth;
    const containerH = floorplanContainer.clientHeight;
    const targetScrollX = centerX - containerW / 2;
    const targetScrollY = centerY - containerH / 2;
    floorplanContainer.scrollLeft = Math.max(0, targetScrollX);
    floorplanContainer.scrollTop = Math.max(0, targetScrollY);
  }

  function updateOverlayPosition() {
    if (!floorplanOverlay) return;

    floorplanOverlay.style.left = centerX + 'px';
    floorplanOverlay.style.top = centerY + 'px';
    floorplanOverlay.style.width = overlaySize + 'px';
    floorplanOverlay.style.height = overlaySize + 'px';
    floorplanOverlay.style.transform = `translate(-50%, -50%) rotate(${currentRotation}deg)`;
    floorplanOverlay.style.opacity = overlayOpacity;

    if (centerMarker) {
      centerMarker.style.left = centerX + 'px';
      centerMarker.style.top = centerY + 'px';
    }

    if (rotationDisplay) {
      let displayAng = Math.round(currentRotation) % 360;
      if (displayAng < 0) displayAng += 360;
      rotationDisplay.textContent = displayAng + '°';
    }

    if (sizeSlider && parseInt(sizeSlider.value, 10) !== Math.round(overlaySize)) {
      sizeSlider.value = Math.round(overlaySize);
    }

    renderCompass();
  }

  function renderCompass() {
    if (!floorplanCompass || !window.Compass) return;
    
    const result = window._currentChartResult;
    let facingDegree = 0;
    let facingPalace = 180;
    let palaces = null;
    
    if (result) {
      facingDegree = result.facingDegree || 0;
      if (result.facingMountain && result.facingMountain.palace) {
        facingPalace = result.facingMountain.palace;
      }
      palaces = result.palaces || null;
    }
    
    window.Compass.render(floorplanCompass, facingDegree, facingPalace, {
      showGuideLines: showGuideLines,
      showSectorStars: true,
      palaces: palaces
    });
  }

  // Render Visual Guide Lines (Diagonals, Bounding Box, Polygon, Crosshairs)
  function renderHelperCanvas() {
    if (!floorplanHelperCanvas || !floorplanImage) return;
    const curW = floorplanImage.offsetWidth || 1;
    const curH = floorplanImage.offsetHeight || 1;

    floorplanHelperCanvas.width = curW;
    floorplanHelperCanvas.height = curH;
    floorplanHelperCanvas.style.width = curW + 'px';
    floorplanHelperCanvas.style.height = curH + 'px';

    const ctx = floorplanHelperCanvas.getContext('2d');
    ctx.clearRect(0, 0, curW, curH);

    if (!isAdjustingCenter) return;

    // 1. Box Mode: Draw 2 points, bounding box, and diagonal cross
    if (centerMode === 'box' && boxPoints.length > 0) {
      const p1 = { x: boxPoints[0].x * curW, y: boxPoints[0].y * curH };
      
      // Point 1 marker
      drawPin(ctx, p1.x, p1.y, '1', '#2563eb');

      if (boxPoints.length === 2) {
        const p2 = { x: boxPoints[1].x * curW, y: boxPoints[1].y * curH };
        drawPin(ctx, p2.x, p2.y, '2', '#2563eb');

        const xMin = Math.min(p1.x, p2.x);
        const xMax = Math.max(p1.x, p2.x);
        const yMin = Math.min(p1.y, p2.y);
        const yMax = Math.max(p1.y, p2.y);

        // Bounding Rectangle
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(xMin, yMin, xMax - xMin, yMax - yMin);
        ctx.fillStyle = 'rgba(37, 99, 235, 0.06)';
        ctx.fillRect(xMin, yMin, xMax - xMin, yMax - yMin);

        // Diagonals
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(xMin, yMin);
        ctx.lineTo(xMax, yMax);
        ctx.moveTo(xMax, yMin);
        ctx.lineTo(xMin, yMax);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // 2. Polygon Mode: Draw polygon outline and centroid lines
    if (centerMode === 'polygon' && polygonPoints.length > 0) {
      ctx.strokeStyle = '#8b5cf6';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      
      polygonPoints.forEach((pt, idx) => {
        const px = pt.x * curW;
        const py = pt.y * curH;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });

      if (polygonPoints.length >= 3) {
        ctx.closePath();
        ctx.fillStyle = 'rgba(139, 92, 246, 0.08)';
        ctx.fill();
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw pins
      polygonPoints.forEach((pt, idx) => {
        drawPin(ctx, pt.x * curW, pt.y * curH, (idx + 1).toString(), '#8b5cf6');
      });
    }

    // 3. Free Mode: Draw full crosshairs through center
    if (centerMode === 'free' || centerMode === 'auto') {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(curW, centerY);
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, curH);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function drawPin(ctx, x, y, label, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y);
    ctx.restore();
  }

  function setOverlaySize(newSize) {
    overlaySize = Math.max(60, Math.min(800, newSize));
    updateOverlayPosition();
  }

  function handleWheelZoom(e) {
    e.preventDefault();
    if (e.ctrlKey) {
      imageZoom = Math.max(50, Math.min(300, imageZoom + (e.deltaY < 0 ? 10 : -10)));
      if (imageZoomSlider) imageZoomSlider.value = imageZoom;
      updateImageZoom(e.clientX, e.clientY);
    } else {
      const zoomDelta = e.deltaY < 0 ? 15 : -15;
      setOverlaySize(overlaySize + zoomDelta);
    }
  }

  function getAngleFromCenter(clientX, clientY) {
    const imgRect = floorplanImage.getBoundingClientRect();
    const x = clientX - imgRect.left - centerX;
    const y = clientY - imgRect.top - centerY;
    return Math.atan2(y, x) * 180 / Math.PI;
  }

  // Exact 0px-offset Coordinate Calculation
  function updateCenterFromEvent(e) {
    if (!floorplanImage) return;
    const imgRect = floorplanImage.getBoundingClientRect();
    if (!imgRect.width || !imgRect.height) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const clickX = clientX - imgRect.left;
    const clickY = clientY - imgRect.top;
    
    const ratioX = Math.max(0, Math.min(1, clickX / imgRect.width));
    const ratioY = Math.max(0, Math.min(1, clickY / imgRect.height));

    if (centerMode === 'box') {
      if (boxPoints.length >= 2) boxPoints = [];
      boxPoints.push({ x: ratioX, y: ratioY });

      if (boxPoints.length === 1) {
        if (centerToolDesc) {
          centerToolDesc.innerHTML = '📐 <strong>Đã chọn Góc 1.</strong> Hãy click tiếp <strong>Góc đối diện (Góc 2)</strong> của tường bao nhà.';
        }
      } else if (boxPoints.length === 2) {
        normalizedCenterX = (boxPoints[0].x + boxPoints[1].x) / 2;
        normalizedCenterY = (boxPoints[0].y + boxPoints[1].y) / 2;
        calculateCenterPx();
        updateOverlayPosition();
        if (centerToolDesc) {
          centerToolDesc.innerHTML = '✓ <strong>Đã tính giao điểm 2 đường chéo!</strong> Nhấn nút <strong>✓ Xác Nhận & Khóa Tâm</strong> bên dưới để hoàn tất.';
        }
      }
      renderHelperCanvas();
      return;
    }

    if (centerMode === 'polygon') {
      polygonPoints.push({ x: ratioX, y: ratioY });
      if (polygonPoints.length >= 3) {
        computePolygonCentroid();
      }
      if (centerToolDesc) {
        centerToolDesc.innerHTML = `⬡ <strong>Đã chọn ${polygonPoints.length} góc.</strong> Tiếp tục click các góc khác hoặc nhấn <strong>✓ Xác Nhận & Khóa Tâm</strong> bên dưới.`;
      }
      renderHelperCanvas();
      return;
    }

    // Free mode
    normalizedCenterX = ratioX;
    normalizedCenterY = ratioY;
    calculateCenterPx();
    updateOverlayPosition();
    renderHelperCanvas();
  }

  // Polygon Centroid Formula: Cx = (1/6A) * sum((xi + xi+1)*(xi*yi+1 - xi+1*yi))
  function computePolygonCentroid() {
    const pts = polygonPoints;
    const n = pts.length;
    if (n < 3) return;

    let area = 0;
    let cx = 0;
    let cy = 0;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const factor = pts[i].x * pts[j].y - pts[j].x * pts[i].y;
      area += factor;
      cx += (pts[i].x + pts[j].x) * factor;
      cy += (pts[i].y + pts[j].y) * factor;
    }
    area = area / 2;

    if (Math.abs(area) > 0.0001) {
      normalizedCenterX = Math.max(0, Math.min(1, cx / (6 * area)));
      normalizedCenterY = Math.max(0, Math.min(1, cy / (6 * area)));
      calculateCenterPx();
      updateOverlayPosition();
    }
  }

  function finishPolygonAndLock() {
    if (polygonPoints.length >= 3) {
      computePolygonCentroid();
    }
    confirmAndLockCenter();
  }

  function undoPolygonPoint() {
    if (polygonPoints.length > 0) {
      polygonPoints.pop();
      if (polygonPoints.length >= 3) computePolygonCentroid();
      renderHelperCanvas();
      if (centerToolDesc) {
        centerToolDesc.innerHTML = `⬡ <strong>Đã xóa 1 điểm:</strong> Còn ${polygonPoints.length} điểm.`;
      }
    }
  }

  function clearPolygon() {
    polygonPoints = [];
    renderHelperCanvas();
    if (centerToolDesc) {
      centerToolDesc.innerHTML = '⬡ <strong>Làm lại:</strong> Hãy click lần lượt các góc tường bao quanh nhà.';
    }
  }

  function setupInteractionHandlers() {
    const onStart = function(e) {
      // 2-finger touch: Pinch zoom & twist rotation of the star chart
      if (e.touches && e.touches.length === 2) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        touchStartDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        touchStartSize = overlaySize;
        touchStartAngle = Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) * 180 / Math.PI;
        touchStartRotation = currentRotation;
        isDragging = false;
        isMovingCenter = false;
        isPanning = false;
        return;
      }

      // 1-pointer interaction:
      if (isAdjustingCenter) {
        // Mode 1: Moving center / picking corners
        e.preventDefault();
        isMovingCenter = true;
        updateCenterFromEvent(e);
      } else {
        const target = e.target;
        if (floorplanOverlay.contains(target) || target === floorplanOverlay) {
          // Mode 2: Rotating star chart
          e.preventDefault();
          isDragging = true;
          const clientX = e.touches ? e.touches[0].clientX : e.clientX;
          const clientY = e.touches ? e.touches[0].clientY : e.clientY;
          startAngle = getAngleFromCenter(clientX, clientY) - currentRotation;
        } else if (imageZoom > 100) {
          // Mode 3: Panning zoomed floor plan image
          isPanning = true;
          const clientX = e.touches ? e.touches[0].clientX : e.clientX;
          const clientY = e.touches ? e.touches[0].clientY : e.clientY;
          panStartX = clientX;
          panStartY = clientY;
          scrollStartX = floorplanContainer.scrollLeft;
          scrollStartY = floorplanContainer.scrollTop;
        }
      }
    };

    const onMove = function(e) {
      // 2-finger pinch zoom & rotation
      if (e.touches && e.touches.length === 2 && touchStartDist > 0) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        
        const currentDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const scale = currentDist / touchStartDist;
        setOverlaySize(touchStartSize * scale);

        const currentAngle = Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) * 180 / Math.PI;
        currentRotation = touchStartRotation + (currentAngle - touchStartAngle);
        updateOverlayPosition();
        return;
      }

      // Moving center mode (free drag)
      if (isMovingCenter && isAdjustingCenter && centerMode === 'free') {
        e.preventDefault();
        updateCenterFromEvent(e);
        return;
      }

      // Rotating overlay mode
      if (isDragging) {
        e.preventDefault();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        currentRotation = getAngleFromCenter(clientX, clientY) - startAngle;
        updateOverlayPosition();
        return;
      }

      // Panning container mode
      if (isPanning) {
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        floorplanContainer.scrollLeft = scrollStartX - (clientX - panStartX);
        floorplanContainer.scrollTop = scrollStartY - (clientY - panStartY);
      }
    };

    const onEnd = function() {
      isDragging = false;
      isMovingCenter = false;
      isPanning = false;
      touchStartDist = 0;
    };

    floorplanContainer.addEventListener('mousedown', onStart);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);

    floorplanContainer.addEventListener('touchstart', onStart, { passive: false });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
    document.addEventListener('touchcancel', onEnd);
  }

  function debounce(fn, ms) {
    let timer;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  function exportFloorplan() {
    if (!floorplanContainer || typeof html2canvas === 'undefined') {
      console.error('FloorPlan: html2canvas not found or container missing');
      return;
    }

    const wasAdjusting = isAdjustingCenter;
    if (isAdjustingCenter) {
      toggleAdjustCenter();
    }

    if (btnExportFloorplan) {
      btnExportFloorplan.innerText = 'Đang tạo...';
      btnExportFloorplan.disabled = true;
    }

    // Hide helper canvas during export for a clean picture
    if (floorplanHelperCanvas) floorplanHelperCanvas.style.display = 'none';

    html2canvas(floorplanContainer, {
      scale: 2,
      useCORS: true,
      logging: false,
      scrollX: 0,
      scrollY: 0
    }).then(async canvas => {
      if (floorplanHelperCanvas) floorplanHelperCanvas.style.display = 'block';

      if (window.saveOrShareImage) {
        await window.saveOrShareImage(canvas, 'tinhban_banve.png', 'Bản Vẽ Tinh Bàn Phong Thủy');
      } else {
        const link = document.createElement('a');
        link.download = 'tinhban_banve.png';
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
      }
      
      if (wasAdjusting) {
        toggleAdjustCenter();
      }
      if (btnExportFloorplan) {
        btnExportFloorplan.innerText = '💾 Tải Ảnh';
        btnExportFloorplan.disabled = false;
      }
    }).catch(err => {
      console.error('FloorPlan: Error exporting floorplan:', err);
      if (floorplanHelperCanvas) floorplanHelperCanvas.style.display = 'block';
      if (btnExportFloorplan) {
        btnExportFloorplan.innerText = '💾 Tải Ảnh';
        btnExportFloorplan.disabled = false;
      }
    });
  }

  // Export module
  window.FloorPlan = {
    init: init,
    update: setupOverlay
  };

})();
