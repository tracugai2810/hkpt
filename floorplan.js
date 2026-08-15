(function() {
  'use strict';

  // State variables
  let isInitialized = false;
  let currentRotation = 0; // degrees
  let centerX = 0; // center position relative to container
  let centerY = 0;
  let isDragging = false;
  let isResizing = false;
  let isMovingCenter = false;
  let startAngle = 0;
  let isAdjustingCenter = false;
  let overlaySize = 240; // px
  let overlayOpacity = 0.7;

  // Touch tracking for pinch-to-zoom & two-finger rotate
  let touchStartDist = 0;
  let touchStartSize = 0;
  let touchStartAngle = 0;
  let touchStartRotation = 0;

  // DOM Elements
  let btnUploadPlan, floorplanFileInput, floorplanSection, floorplanContainer;
  let floorplanImage, floorplanOverlay, floorplanCompass, floorplanGrid;
  let floorplanResizeHandle, centerMarker, sizeSlider, opacitySlider, rotationDisplay;
  let btnAdjustCenter, btnResetFloorplan, btnExportFloorplan, transparentBgCheckbox;

  function init() {
    if (isInitialized) return;

    // Get DOM elements
    btnUploadPlan = document.getElementById('btnUploadPlan');
    floorplanFileInput = document.getElementById('floorplanFileInput');
    floorplanSection = document.getElementById('floorplanSection');
    floorplanContainer = document.getElementById('floorplanContainer');
    floorplanImage = document.getElementById('floorplanImage');
    floorplanOverlay = document.getElementById('floorplanOverlay');
    floorplanCompass = document.getElementById('floorplanCompass');
    floorplanGrid = document.getElementById('floorplanGrid');
    floorplanResizeHandle = document.getElementById('floorplanResizeHandle');
    centerMarker = document.getElementById('centerMarker');
    sizeSlider = document.getElementById('sizeSlider');
    opacitySlider = document.getElementById('opacitySlider');
    transparentBgCheckbox = document.getElementById('transparentBgCheckbox');
    rotationDisplay = document.getElementById('rotationDisplay');
    btnAdjustCenter = document.getElementById('btnAdjustCenter');
    btnResetFloorplan = document.getElementById('btnResetFloorplan');
    btnExportFloorplan = document.getElementById('btnExportFloorplan');

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

    // 3. Size slider
    if (sizeSlider) {
      sizeSlider.addEventListener('input', function(e) {
        overlaySize = parseInt(e.target.value, 10);
        updateOverlayPosition();
      });
    }

    // 4. Opacity slider
    if (opacitySlider) {
      overlayOpacity = parseInt(opacitySlider.value, 10) / 100;
      opacitySlider.addEventListener('input', function(e) {
        overlayOpacity = parseInt(e.target.value, 10) / 100;
        if (floorplanOverlay) {
          floorplanOverlay.style.opacity = overlayOpacity;
        }
      });
    }

    // 4b. Transparent BG checkbox
    if (transparentBgCheckbox) {
      transparentBgCheckbox.addEventListener('change', function() {
        const clonedGrid = document.getElementById('clonedGrid');
        if (clonedGrid) {
          clonedGrid.style.background = this.checked ? 'transparent' : 'rgba(255, 255, 255, 0.85)';
        }
      });
    }

    // 5. Adjust center button toggle
    if (btnAdjustCenter) {
      btnAdjustCenter.addEventListener('click', toggleAdjustCenter);
    }

    // 6. Reset button
    if (btnResetFloorplan) {
      btnResetFloorplan.addEventListener('click', function() {
        currentRotation = 0;
        updateOverlayPosition();
      });
    }

    // 7. Export button
    if (btnExportFloorplan) {
      btnExportFloorplan.addEventListener('click', exportFloorplan);
    }

    // 8. Mouse Wheel Zoom on floor plan container
    floorplanContainer.addEventListener('wheel', handleWheelZoom, { passive: false });

    // 9. Resize handle drag
    if (floorplanResizeHandle) {
      setupResizeHandle();
    }

    // 10. Core gesture handling (Rotate, Move Center, Pinch Zoom)
    setupInteractionHandlers();

    isInitialized = true;
  }

  function toggleAdjustCenter() {
    isAdjustingCenter = !isAdjustingCenter;
    if (isAdjustingCenter) {
      btnAdjustCenter.textContent = '✓ Xong';
      btnAdjustCenter.classList.add('active');
      floorplanContainer.classList.add('adjusting-center');
      if (centerMarker) centerMarker.style.display = 'block';
    } else {
      btnAdjustCenter.textContent = '📍 Chỉnh Tâm';
      btnAdjustCenter.classList.remove('active');
      floorplanContainer.classList.remove('adjusting-center');
      if (centerMarker) centerMarker.style.display = 'none';
    }
  }

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
      const img = new Image();
      img.onload = function() {
        if (floorplanSection) floorplanSection.classList.remove('hidden');
        floorplanImage.src = img.src;
        
        // Wait a bit for the image to render in DOM and get actual display dimensions
        setTimeout(() => {
          detectCenter(floorplanImage);
          setupOverlay();
          // Scroll smoothly to floorplan section
          floorplanSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 120);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

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
    
    let computedCenterX, computedCenterY;
    const rect = imgElement.getBoundingClientRect();
    const displayW = rect.width || imgElement.offsetWidth || 400;
    const displayH = rect.height || imgElement.offsetHeight || 300;

    if (imageData) {
      const data = imageData.data;
      let minX = naturalW, maxX = 0, minY = naturalH, maxY = 0;
      let foundDark = false;
      
      for (let y = 0; y < naturalH; y += 2) {
        for (let x = 0; x < naturalW; x += 2) {
          const i = (y * naturalW + x) * 4;
          const a = data[i + 3];
          if (a < 128) continue;
          
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          if (gray < 128) {
            foundDark = true;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      
      if (foundDark && maxX > minX && maxY > minY) {
        const centerNaturalX = (minX + maxX) / 2;
        const centerNaturalY = (minY + maxY) / 2;
        computedCenterX = (centerNaturalX / naturalW) * displayW;
        computedCenterY = (centerNaturalY / naturalH) * displayH;
      } else {
        computedCenterX = displayW / 2;
        computedCenterY = displayH / 2;
      }
    } else {
      computedCenterX = displayW / 2;
      computedCenterY = displayH / 2;
    }
    
    centerX = computedCenterX;
    centerY = computedCenterY;
    
    // Center marker only visible during adjustment
    if (centerMarker) {
      centerMarker.style.display = isAdjustingCenter ? 'block' : 'none';
    }
    
    currentRotation = 0;
  }

  function setupOverlay() {
    if (!floorplanGrid || !floorplanCompass) return;

    // Clone the chart grid
    const chartGrid = document.getElementById('chartGrid');
    if (chartGrid) {
      floorplanGrid.innerHTML = '';
      const clone = chartGrid.cloneNode(true);
      clone.id = 'clonedGrid';
      const isTransparent = transparentBgCheckbox && transparentBgCheckbox.checked;
      clone.style.background = isTransparent ? 'transparent' : 'rgba(255, 255, 255, 0.85)';
      floorplanGrid.appendChild(clone);
    }

    updateOverlayPosition();
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
    
    if (result) {
      facingDegree = result.facingDegree || 0;
      if (result.facingMountain && result.facingMountain.palace) {
        facingPalace = result.facingMountain.palace;
      }
    }
    
    window.Compass.render(floorplanCompass, facingDegree, facingPalace);
  }

  function setOverlaySize(newSize) {
    overlaySize = Math.max(60, Math.min(800, newSize));
    updateOverlayPosition();
  }

  function handleWheelZoom(e) {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 15 : -15;
    setOverlaySize(overlaySize + zoomDelta);
  }

  function setupResizeHandle() {
    const onHandleDown = function(e) {
      e.stopPropagation();
      e.preventDefault();
      isResizing = true;

      const getDistance = function(evt) {
        const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
        const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
        const rect = floorplanContainer.getBoundingClientRect();
        const mouseX = clientX - rect.left;
        const mouseY = clientY - rect.top;
        return Math.hypot(mouseX - centerX, mouseY - centerY);
      };

      const onHandleMove = function(evt) {
        if (!isResizing) return;
        const dist = getDistance(evt);
        // Radius to square dimension
        const newSize = dist * 2;
        setOverlaySize(newSize);
      };

      const onHandleUp = function() {
        isResizing = false;
        document.removeEventListener('mousemove', onHandleMove);
        document.removeEventListener('mouseup', onHandleUp);
        document.removeEventListener('touchmove', onHandleMove);
        document.removeEventListener('touchend', onHandleUp);
      };

      document.addEventListener('mousemove', onHandleMove);
      document.addEventListener('mouseup', onHandleUp);
      document.addEventListener('touchmove', onHandleMove, { passive: false });
      document.addEventListener('touchend', onHandleUp);
    };

    floorplanResizeHandle.addEventListener('mousedown', onHandleDown);
    floorplanResizeHandle.addEventListener('touchstart', onHandleDown, { passive: false });
  }

  function getAngleFromCenter(clientX, clientY) {
    const rect = floorplanContainer.getBoundingClientRect();
    const x = clientX - rect.left - centerX;
    const y = clientY - rect.top - centerY;
    return Math.atan2(y, x) * 180 / Math.PI;
  }

  function updateCenterFromEvent(e) {
    const rect = floorplanContainer.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    centerX = Math.max(0, Math.min(rect.width, clientX - rect.left));
    centerY = Math.max(0, Math.min(rect.height, clientY - rect.top));
    updateOverlayPosition();
  }

  function setupInteractionHandlers() {
    // Pointer down on container or overlay
    const onStart = function(e) {
      if (isResizing) return;

      // Handle Pinch to Zoom (2 fingers)
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
        return;
      }

      // 1-pointer interaction:
      if (isAdjustingCenter) {
        // Mode 1: Moving center
        e.preventDefault();
        isMovingCenter = true;
        updateCenterFromEvent(e);
      } else {
        // Mode 2: Rotating overlay (only if clicking on overlay)
        const target = e.target;
        if (floorplanOverlay.contains(target) || target === floorplanOverlay) {
          e.preventDefault();
          isDragging = true;
          const clientX = e.touches ? e.touches[0].clientX : e.clientX;
          const clientY = e.touches ? e.touches[0].clientY : e.clientY;
          startAngle = getAngleFromCenter(clientX, clientY) - currentRotation;
        }
      }
    };

    const onMove = function(e) {
      // 2-finger pinch zoom & rotation
      if (e.touches && e.touches.length === 2 && touchStartDist > 0) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        
        // Pinch zoom
        const currentDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const scale = currentDist / touchStartDist;
        setOverlaySize(touchStartSize * scale);

        // 2-finger rotation
        const currentAngle = Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) * 180 / Math.PI;
        currentRotation = touchStartRotation + (currentAngle - touchStartAngle);
        updateOverlayPosition();
        return;
      }

      // Center moving mode
      if (isMovingCenter && isAdjustingCenter) {
        e.preventDefault();
        updateCenterFromEvent(e);
        return;
      }

      // Single-finger / mouse rotation drag
      if (isDragging) {
        e.preventDefault();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        currentRotation = getAngleFromCenter(clientX, clientY) - startAngle;
        updateOverlayPosition();
      }
    };

    const onEnd = function() {
      isDragging = false;
      isMovingCenter = false;
      touchStartDist = 0;
    };

    // Attach listeners
    floorplanContainer.addEventListener('mousedown', onStart);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);

    floorplanContainer.addEventListener('touchstart', onStart, { passive: false });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
    document.addEventListener('touchcancel', onEnd);
  }

  function exportFloorplan() {
    if (!floorplanContainer || typeof html2canvas === 'undefined') {
      console.error('FloorPlan: html2canvas not found or container missing');
      return;
    }

    // Hide adjustment UI during export
    const wasAdjusting = isAdjustingCenter;
    if (isAdjustingCenter) {
      toggleAdjustCenter();
    }
    if (floorplanResizeHandle) floorplanResizeHandle.style.display = 'none';

    html2canvas(floorplanContainer, {
      scale: 2,
      useCORS: true,
      logging: false
    }).then(canvas => {
      const link = document.createElement('a');
      link.download = 'tinhban_banve.png';
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
      
      // Restore state
      if (wasAdjusting) {
        toggleAdjustCenter();
      }
      if (floorplanResizeHandle) floorplanResizeHandle.style.display = '';
    }).catch(err => {
      console.error('FloorPlan: Error exporting floorplan:', err);
      if (floorplanResizeHandle) floorplanResizeHandle.style.display = '';
    });
  }

  // Export module
  window.FloorPlan = {
    init: init,
    update: setupOverlay
  };

})();
