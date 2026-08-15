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

  // Touch tracking for pinch-to-zoom & two-finger rotate
  let touchStartDist = 0;
  let touchStartSize = 0;
  let touchStartAngle = 0;
  let touchStartRotation = 0;

  // DOM Elements
  let btnUploadPlan, floorplanFileInput, floorplanSection, floorplanContainer;
  let floorplanImage, floorplanOverlay, floorplanCompass, floorplanGrid;
  let centerMarker, sizeSlider, imageZoomSlider, opacitySlider, rotationDisplay;
  let btnAdjustCenter, btnResetFloorplan, btnExportFloorplan;
  let transparentBgCheckbox, guideLinesCheckbox;

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
        const clonedGrid = document.getElementById('clonedGrid');
        if (clonedGrid) {
          clonedGrid.style.background = this.checked ? 'transparent' : 'rgba(255, 255, 255, 0.85)';
        }
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
        if (imageZoomSlider) imageZoomSlider.value = 100;
        updateImageZoom();
        updateOverlayPosition();
      });
    }

    // 10. Export button
    if (btnExportFloorplan) {
      btnExportFloorplan.addEventListener('click', exportFloorplan);
    }

    // 11. Mouse Wheel Zoom on star chart (or on image if Ctrl is held)
    floorplanContainer.addEventListener('wheel', handleWheelZoom, { passive: false });

    // 12. Core interaction handlers (Rotate, Move Center, Pinch Zoom, Pan)
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
        imageZoom = 100;
        if (imageZoomSlider) imageZoomSlider.value = 100;
        floorplanImage.style.width = '100%';
        
        setTimeout(() => {
          detectCenter(floorplanImage);
          setupOverlay();
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

  function updateImageZoom() {
    if (!floorplanImage) return;
    floorplanImage.style.width = imageZoom + '%';
    floorplanImage.style.maxWidth = 'none';
    
    // Recalculate pixel center position anchored to normalized coordinates
    calculateCenterPx();
    updateOverlayPosition();
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

    calculateCenterPx();
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
    
    window.Compass.render(floorplanCompass, facingDegree, facingPalace, {
      showGuideLines: showGuideLines
    });
  }

  function setOverlaySize(newSize) {
    overlaySize = Math.max(60, Math.min(800, newSize));
    updateOverlayPosition();
  }

  function handleWheelZoom(e) {
    e.preventDefault();
    if (e.ctrlKey) {
      // Ctrl + Wheel: Zoom floorplan image
      imageZoom = Math.max(50, Math.min(300, imageZoom + (e.deltaY < 0 ? 10 : -10)));
      if (imageZoomSlider) imageZoomSlider.value = imageZoom;
      updateImageZoom();
    } else {
      // Normal Wheel: Zoom star chart
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

  function updateCenterFromEvent(e) {
    const imgRect = floorplanImage.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const clickX = clientX - imgRect.left;
    const clickY = clientY - imgRect.top;
    
    const curW = floorplanImage.offsetWidth || 1;
    const curH = floorplanImage.offsetHeight || 1;
    
    normalizedCenterX = Math.max(0, Math.min(1, clickX / curW));
    normalizedCenterY = Math.max(0, Math.min(1, clickY / curH));
    
    calculateCenterPx();
    updateOverlayPosition();
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
        // Mode 1: Moving center
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

      // Moving center mode
      if (isMovingCenter && isAdjustingCenter) {
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

  function exportFloorplan() {
    if (!floorplanContainer || typeof html2canvas === 'undefined') {
      console.error('FloorPlan: html2canvas not found or container missing');
      return;
    }

    const wasAdjusting = isAdjustingCenter;
    if (isAdjustingCenter) {
      toggleAdjustCenter();
    }

    // Capture the image and overlay element directly
    html2canvas(floorplanContainer, {
      scale: 2,
      useCORS: true,
      logging: false,
      scrollX: 0,
      scrollY: 0
    }).then(canvas => {
      const link = document.createElement('a');
      link.download = 'tinhban_banve.png';
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
      
      if (wasAdjusting) {
        toggleAdjustCenter();
      }
    }).catch(err => {
      console.error('FloorPlan: Error exporting floorplan:', err);
    });
  }

  // Export module
  window.FloorPlan = {
    init: init,
    update: setupOverlay
  };

})();
