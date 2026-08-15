(function() {
  'use strict';

  // State variables
  let isInitialized = false;
  let currentRotation = 0; // degrees
  let centerX = 0; // center position relative to container
  let centerY = 0;
  let isDragging = false;
  let startAngle = 0;
  let isAdjustingCenter = false;
  let overlaySize = 200; // px
  let overlayOpacity = 0.6;

  // DOM Elements
  let btnUploadPlan, floorplanFileInput, floorplanSection, floorplanContainer;
  let floorplanImage, floorplanOverlay, floorplanCompass, floorplanGrid;
  let centerMarker, sizeSlider, opacitySlider, rotationDisplay;
  let btnAdjustCenter, btnResetFloorplan, btnExportFloorplan;

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
    opacitySlider = document.getElementById('opacitySlider');
    const transparentBgCheckbox = document.getElementById('transparentBgCheckbox');
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

    // Center adjustment click
    floorplanContainer.addEventListener('click', function(e) {
      if (isAdjustingCenter) {
        const rect = floorplanContainer.getBoundingClientRect();
        centerX = e.clientX - rect.left;
        centerY = e.clientY - rect.top;
        updateOverlayPosition();
      }
    });

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

    // 8. Rotation drag
    setupRotationDrag();

    isInitialized = true;
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
        }, 100);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    
    // Reset input so the same file can be uploaded again if needed
    e.target.value = '';
  }

  function detectCenter(imgElement) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    // Use natural dimensions for accurate analysis
    const naturalW = imgElement.naturalWidth;
    const naturalH = imgElement.naturalHeight;
    canvas.width = naturalW;
    canvas.height = naturalH;
    
    ctx.drawImage(imgElement, 0, 0, naturalW, naturalH);
    const imageData = ctx.getImageData(0, 0, naturalW, naturalH);
    const data = imageData.data;
    
    let minX = naturalW, maxX = 0, minY = naturalH, maxY = 0;
    let foundDark = false;
    
    // Process pixels to find dark areas (lines/walls)
    for (let y = 0; y < naturalH; y++) {
      for (let x = 0; x < naturalW; x++) {
        const i = (y * naturalW + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        
        // Skip transparent pixels
        if (a < 128) continue;
        
        // Convert to grayscale
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        
        // Check if dark pixel
        if (gray < 128) {
          foundDark = true;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    
    // Calculate display dimensions ratio
    const rect = imgElement.getBoundingClientRect();
    const displayW = rect.width;
    const displayH = rect.height;
    
    let computedCenterX, computedCenterY;
    
    if (foundDark) {
      // Scale natural center to display dimensions
      const centerNaturalX = (minX + maxX) / 2;
      const centerNaturalY = (minY + maxY) / 2;
      computedCenterX = (centerNaturalX / naturalW) * displayW;
      computedCenterY = (centerNaturalY / naturalH) * displayH;
    } else {
      // Fallback to center of image
      computedCenterX = displayW / 2;
      computedCenterY = displayH / 2;
    }
    
    centerX = computedCenterX;
    centerY = computedCenterY;
    
    if (centerMarker) {
      centerMarker.style.display = 'block';
    }
    
    // Reset rotation when new image is loaded
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
      clone.style.background = 'rgba(255, 255, 255, 0.85)';
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
      // Normalize angle for display
      let displayAng = Math.round(currentRotation) % 360;
      if (displayAng < 0) displayAng += 360;
      rotationDisplay.textContent = displayAng + '°';
    }

    renderCompass();
  }

  function renderCompass() {
    if (!floorplanCompass || !window.Compass) return;
    
    const result = window._currentChartResult;
    let facingDegree = 0;
    let facingPalace = '';
    
    if (result) {
      facingDegree = result.facingDegree || 0;
      if (result.facingMountain && result.facingMountain.palace) {
        facingPalace = result.facingMountain.palace;
      }
    }
    
    // Render the compass on the canvas
    window.Compass.render(floorplanCompass, facingDegree, facingPalace);
  }

  function getAngle(e, container) {
    const rect = container.getBoundingClientRect();
    const cx = centerX;
    const cy = centerY;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const x = clientX - rect.left - cx;
    const y = clientY - rect.top - cy;
    
    return Math.atan2(y, x) * 180 / Math.PI;
  }

  function setupRotationDrag() {
    if (!floorplanOverlay) return;

    const startDrag = function(e) {
      if (isAdjustingCenter) return;
      
      isDragging = true;
      startAngle = getAngle(e, floorplanContainer) - currentRotation;
      e.preventDefault(); // Prevent scrolling on touch
    };

    const drag = function(e) {
      if (!isDragging) return;
      
      currentRotation = getAngle(e, floorplanContainer) - startAngle;
      updateOverlayPosition();
    };

    const stopDrag = function() {
      isDragging = false;
    };

    // Mouse events
    floorplanOverlay.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);

    // Touch events
    floorplanOverlay.addEventListener('touchstart', startDrag, { passive: false });
    document.addEventListener('touchmove', drag, { passive: false });
    document.addEventListener('touchend', stopDrag);
  }

  function exportFloorplan() {
    if (!floorplanContainer || typeof html2canvas === 'undefined') {
      console.error('FloorPlan: html2canvas not found or container missing');
      return;
    }

    // Temporarily hide the adjust center UI if active
    const wasAdjusting = isAdjustingCenter;
    if (isAdjustingCenter && btnAdjustCenter) {
      btnAdjustCenter.click(); // toggle off
    }

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
      if (wasAdjusting && btnAdjustCenter) {
        btnAdjustCenter.click();
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
