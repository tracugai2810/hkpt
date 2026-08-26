// ============================================================
// Huyền Không Phi Tinh - Main UI Controller
// ============================================================

(function() {
  'use strict';

  // Grid layout: visual row/col to Lo Shu palace mapping
  // Traditional Feng Shui chart: South on top, North at bottom
  // Grid positions (row, col) → Palace number
  // Original array not used directly anymore due to dynamic rotation
  // const GRID_MAP = [
  //   [4, 9, 2],
  //   [3, 5, 7],
  //   [8, 1, 6],
  // ];

  // DOM Elements
  let inputDegree;
  let inputYear;
  let inputVan;
  let inputCurrentYear;
  let inputCurrentMonth;
  let inputCurrentDay;
  let inputCurrentHour;
  let inputOwnerYear;
  let inputOwnerGender;
  let btnCalculate;
  let btnCopyText;
  let warningBox;
  let ownerInfo;
  let chartInfo;
  let infoMain;
  let chartContainer;
  let chartGrid;
  let infoPanel;
  let legendSection;
  let actionContainer;
  let btnDownload;
  let exportArea;
  let imageResultContainer;
  let finalImage;
  
  let currentResult = null; // Store result for copy functionality

  // Set current real-time survey date & hour
  function setCurrentTime() {
    const now = new Date();
    inputCurrentYear = inputCurrentYear || document.getElementById('inputCurrentYear');
    inputCurrentMonth = inputCurrentMonth || document.getElementById('inputCurrentMonth');
    inputCurrentDay = inputCurrentDay || document.getElementById('inputCurrentDay');
    inputCurrentHour = inputCurrentHour || document.getElementById('inputCurrentHour');

    if (inputCurrentYear) inputCurrentYear.value = now.getFullYear();
    if (inputCurrentMonth) inputCurrentMonth.value = now.getMonth() + 1;
    if (inputCurrentDay) inputCurrentDay.value = now.getDate();
    
    // Calculate 12 Can Chi hours: Tý=1, Sửu=2...
    const h = now.getHours();
    let hourIdx = 1;
    if (h >= 23 || h < 1) hourIdx = 1;
    else if (h >= 1 && h < 3) hourIdx = 2;
    else if (h >= 3 && h < 5) hourIdx = 3;
    else if (h >= 5 && h < 7) hourIdx = 4;
    else if (h >= 7 && h < 9) hourIdx = 5;
    else if (h >= 9 && h < 11) hourIdx = 6;
    else if (h >= 11 && h < 13) hourIdx = 7;
    else if (h >= 13 && h < 15) hourIdx = 8;
    else if (h >= 15 && h < 17) hourIdx = 9;
    else if (h >= 17 && h < 19) hourIdx = 10;
    else if (h >= 19 && h < 21) hourIdx = 11;
    else if (h >= 21 && h < 23) hourIdx = 12;
    if (inputCurrentHour) inputCurrentHour.value = hourIdx;
  }

  // Initialize
  function init() {
    // Resolve all DOM elements
    inputDegree = document.getElementById('inputDegree');
    inputYear = document.getElementById('inputYear');
    inputVan = document.getElementById('inputVan');
    inputCurrentYear = document.getElementById('inputCurrentYear');
    inputCurrentMonth = document.getElementById('inputCurrentMonth');
    inputCurrentDay = document.getElementById('inputCurrentDay');
    inputCurrentHour = document.getElementById('inputCurrentHour');
    inputOwnerYear = document.getElementById('inputOwnerYear');
    inputOwnerGender = document.getElementById('inputOwnerGender');
    btnCalculate = document.getElementById('btnCalculate');
    btnCopyText = document.getElementById('btnCopyText');
    warningBox = document.getElementById('warningKhongVong');
    ownerInfo = document.getElementById('ownerInfo');
    chartInfo = document.getElementById('chartInfo');
    infoMain = document.getElementById('infoMain');
    chartContainer = document.getElementById('chartContainer');
    chartGrid = document.getElementById('chartGrid');
    infoPanel = document.getElementById('infoPanel');
    legendSection = document.getElementById('legendSection');
    actionContainer = document.getElementById('actionContainer');
    btnDownload = document.getElementById('btnDownload');
    exportArea = document.getElementById('exportArea');
    imageResultContainer = document.getElementById('imageResultContainer');
    finalImage = document.getElementById('finalImage');

    // Set real-time survey date/time automatically
    setCurrentTime();
    
    // Auto-calculate Van on any input/change/keyup/paste/blur
    if (inputYear) {
      ['input', 'change', 'keyup', 'paste', 'blur'].forEach(evt => {
        inputYear.addEventListener(evt, updateVan);
      });
    }
    
    // Handle decimal comma → dot
    if (inputDegree) {
      ['input', 'change', 'keyup', 'paste'].forEach(evt => {
        inputDegree.addEventListener(evt, function() {
          this.value = this.value.replace(',', '.');
        });
      });
    }
    
    // Calculate button
    if (btnCalculate) {
      btnCalculate.addEventListener('click', function(e) {
        if (e) e.preventDefault();
        calculate(true);
      });
    }
    
    // Also calc on Enter key
    document.querySelectorAll('.input-field').forEach(el => {
      el.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          if (e) e.preventDefault();
          calculate(true);
        }
      });
    });
    
    // Download button event
    if (btnDownload) {
      btnDownload.addEventListener('click', handleDownloadButtonClick);
    }
    
    if (btnCopyText) {
      btnCopyText.addEventListener('click', copyChartToText);
    }
    
    // Initial Van calculation
    updateVan();
    
    // Do not calculate automatically on load; calculate only when user clicks 'Lập Tinh Bàn'
    
    // Initialize FloorPlan module
    if (window.FloorPlan && window.FloorPlan.init) {
      window.FloorPlan.init();
    }
  }

  function updateVan() {
    inputYear = inputYear || document.getElementById('inputYear');
    inputVan = inputVan || document.getElementById('inputVan');
    if (!inputYear || !inputVan) return;
    const rawVal = (inputYear.value || '').trim();
    const year = parseInt(rawVal, 10);
    if (!isNaN(year) && year >= 1864) {
      const van = FlyingStar.getVan(year);
      if (van !== undefined && van !== null) {
        inputVan.value = van;
      }
    }
  }

  function calculate(shouldScroll) {
    try {
      // Button press visual feedback
      if (btnCalculate) {
        btnCalculate.style.transform = 'scale(0.96)';
        setTimeout(() => { btnCalculate.style.transform = ''; }, 120);
      }

      // Parse and sanitize inputs
      let degreeStr = (inputDegree.value || '').replace(',', '.').trim();
      let degree = parseFloat(degreeStr);
      if (isNaN(degree)) degree = 180;
      degree = ((degree % 360) + 360) % 360;

      let year = parseInt((inputYear.value || '').trim(), 10);
      if (isNaN(year) || year < 1864) {
        year = 2024;
      }
      
      // Update and synchronize Van input
      const currentVan = FlyingStar.getVan(year);
      if (inputVan && currentVan) {
        inputVan.value = currentVan;
      }

      const now = new Date();
      let currentYear = parseInt(inputCurrentYear.value, 10);
      if (isNaN(currentYear)) currentYear = now.getFullYear();

      let currentMonth = parseInt(inputCurrentMonth.value, 10);
      if (isNaN(currentMonth) || currentMonth < 1 || currentMonth > 12) currentMonth = now.getMonth() + 1;

      let currentDay = parseInt(inputCurrentDay.value, 10);
      if (isNaN(currentDay) || currentDay < 1) currentDay = 1;
      if (currentDay > 31) {
        currentDay = 26; // Sanitized from typos like 261
        inputCurrentDay.value = 26;
      }

      let currentHour = parseInt(inputCurrentHour.value, 10);
      if (isNaN(currentHour) || currentHour < 1 || currentHour > 12) currentHour = 1;

      const ownerYear = parseInt(inputOwnerYear ? inputOwnerYear.value : '', 10);
      const ownerGender = parseInt(inputOwnerGender ? inputOwnerGender.value : '1', 10);
      
      // Calculate
      const result = FlyingStar.calculateChart(year, degree, currentYear, currentMonth, currentDay, currentHour);
      currentResult = result; // Save to global
      window._currentChartResult = result; // Expose for FloorPlan module
      
      let menhQuai = null;
      if (!isNaN(ownerYear) && ownerYear >= 1900) {
        menhQuai = FlyingStar.getMenhQuai(ownerYear, ownerGender);
        menhQuai.year = ownerYear;
        menhQuai.genderName = ownerGender === 1 ? 'Nam' : 'Nữ';
      }
      
      // Display
      renderResult(result, currentYear, currentMonth, currentDay, currentHour, menhQuai);

      if (shouldScroll && exportArea) {
        setTimeout(() => {
          exportArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 30);
      }
    } catch (err) {
      console.error('Calculate execution error:', err);
    }
  }

  function renderResult(result, currentYear, currentMonth, currentDay, currentHour, menhQuai) {
    if (!result) return;
    if (imageResultContainer) imageResultContainer.classList.add('hidden');
    
    // Display exportArea directly on screen
    if (exportArea) {
      exportArea.classList.remove('hidden');
      exportArea.classList.remove('export-mode');
      exportArea.style.position = '';
      exportArea.style.left = '';
      exportArea.style.top = '';
    }
    
    if (actionContainer) actionContainer.classList.remove('hidden');
    
    // Warning
    if (warningBox) {
      if (result.chartType === 'KHONG_VONG') {
        warningBox.classList.remove('hidden');
      } else {
        warningBox.classList.add('hidden');
      }
    }
    
    // Owner info
    if (ownerInfo) {
      if (menhQuai) {
        ownerInfo.innerHTML = `Gia chủ: ${menhQuai.genderName} ${menhQuai.year} - Mệnh quái: ${menhQuai.number} - ${menhQuai.element}`;
        ownerInfo.classList.remove('hidden');
      } else {
        ownerInfo.classList.add('hidden');
        ownerInfo.innerHTML = '';
      }
    }
    
    // Chart info
    const infoMain = document.getElementById('infoMain');
    if (infoMain) {
      let infoHTML = '';
      const toaName = result.sittingMountain.name;
      const huongName = result.facingMountain.name;
      
      infoHTML += `<div>Tọa <strong>${toaName}</strong> - Hướng <strong>${huongName}</strong>`;
      
      if (result.chartType === 'THE_QUAI' && result.kiemInfo) {
        infoHTML += ` - <strong>${result.kiemInfo.label}</strong>`;
      }
      
      // Badge
      let badgeClass, badgeText;
      if (result.chartType === 'HA_QUAI') {
        badgeClass = 'badge-ha-quai';
        badgeText = 'Hạ Quái';
      } else if (result.chartType === 'THE_QUAI') {
        badgeClass = 'badge-the-quai';
        badgeText = 'Thế Quái';
      } else {
        badgeClass = 'badge-khong-vong';
        badgeText = 'Không Vong';
      }
      
      infoHTML += ` <span class="chart-type-badge ${badgeClass}">${badgeText}</span>`;
      infoHTML += `</div>`;
      
      infoMain.innerHTML = infoHTML;
    }
    
    // Render Grid
    if (chartContainer) chartContainer.classList.remove('hidden');
    if (chartGrid) {
      chartGrid.innerHTML = '';
      
      const directionShort = {
        1: 'B', 2: 'TN', 3: 'Đ', 4: 'ĐN', 5: '', 6: 'TB', 7: 'T', 8: 'ĐB', 9: 'N'
      };
      
      // Standard ring starting from South (Top-Center) clockwise
      const ring = [9, 2, 7, 6, 1, 8, 3, 4];
      const visualIndices = [1, 2, 5, 8, 7, 6, 3, 0];
      const facingPalace = result.facingMountain.palace;
      
      let rotatedRing = ring;
      if (facingPalace && facingPalace !== 5) {
        const idx = ring.indexOf(facingPalace);
        if (idx !== -1) {
          rotatedRing = ring.slice(idx).concat(ring.slice(0, idx));
        }
      }
      
      const displayGrid = new Array(9);
      displayGrid[4] = 5; // Center
      for (let i = 0; i < 8; i++) {
        displayGrid[visualIndices[i]] = rotatedRing[i];
      }

      // Analyze Thanh Mon (Castle Gate)
      const tmAnalysis = (window.ThanhMonRules && window.ThanhMonRules.analyze) ? window.ThanhMonRules.analyze(result) : null;
      
      for (let i = 0; i < 9; i++) {
        const palace = displayGrid[i];
        const data = result.palaces[palace];
        if (!data) continue;
          
        const cell = document.createElement('div');
        cell.className = 'chart-cell';
        if (i === 4) cell.classList.add('center-cell');
          
        // Direction label inside cell (bottom-left area)
        const dirHTML = directionShort[palace] ? `<div class="dir-label-cell">${directionShort[palace]}</div>` : '';
        
        // Top row: Niên - Nguyệt - Nhật - Thời
        const topDiv = document.createElement('div');
        topDiv.className = 'cell-top-horizontal';
        
        let starsHTML = '';
        if (data.nien) starsHTML += `<span class="star-nien circle">${data.nien}</span>`;
        if (data.nguyet) starsHTML += `<span class="star-nguyet circle">${data.nguyet}</span>`;
        if (data.nhat) starsHTML += `<span class="star-nhat circle">${data.nhat}</span>`;
        if (data.thoi) starsHTML += `<span class="star-thoi circle">${data.thoi}</span>`;
        
        topDiv.innerHTML = starsHTML;
        
        // Check if this palace has Dac Thanh Mon Vuong Khi
        const tmInfo = (tmAnalysis && tmAnalysis.dacThanhMonDetails) ? tmAnalysis.dacThanhMonDetails[palace] : null;
        let tmIconHTML = '';
        if (tmInfo) {
          tmIconHTML = `<span class="tm-icon-inline" title="Đắc Thành Môn Vượng Khí: Cung ${tmInfo.palaceName} - Sơn ${tmInfo.mountainName} (${tmInfo.typeShort})">🚪</span>`;
        }

        // Middle: Vận tinh + icon TM nhỏ đặt ngang cạnh số Vận
        const midDiv = document.createElement('div');
        midDiv.className = 'cell-middle';
        midDiv.innerHTML = `<span class="star-van">${data.van}</span>${tmIconHTML}`;
        
        // Bottom: Sơn (left) & Hướng (right)
        const botDiv = document.createElement('div');
        botDiv.className = 'cell-bottom';
        botDiv.innerHTML = `
          <span class="star-son">${data.son}</span>
          <span class="star-huong">${data.huong}</span>
        `;
        
        cell.innerHTML = dirHTML;
        cell.appendChild(topDiv);
        cell.appendChild(midDiv);
        cell.appendChild(botDiv);

        chartGrid.appendChild(cell);
      }
    }
    
    // Update floorplan overlay if active
    try {
      if (window.FloorPlan && window.FloorPlan.update) {
        window.FloorPlan.update();
      }
    } catch (e) {
      console.error('FloorPlan update error:', e);
    }
    
    // Info values
    const infoVan = document.getElementById('infoVan');
    if (infoVan) infoVan.textContent = result.van;
    
    const infoDegree = document.getElementById('infoDegree');
    if (infoDegree) infoDegree.textContent = `${result.facingDegree}°`;
    
    const infoYear = document.getElementById('infoYear');
    if (infoYear) infoYear.textContent = currentYear || '-';
    
    const infoMonth = document.getElementById('infoMonth');
    if (infoMonth) infoMonth.textContent = currentMonth || '-';
    
    const infoDay = document.getElementById('infoDay');
    if (infoDay) infoDay.textContent = currentDay || '-';
    
    const hourmap = {1:'Tý', 2:'Sửu', 3:'Dần', 4:'Mão', 5:'Thìn', 6:'Tỵ', 7:'Ngọ', 8:'Mùi', 9:'Thân', 10:'Dậu', 11:'Tuất', 12:'Hợi'};
    const infoHour = document.getElementById('infoHour');
    if (infoHour) infoHour.textContent = hourmap[currentHour] || '-';

    // Render Loan Dau (Exterior landscape) recommendation
    try {
      const loanDauSection = document.getElementById('loanDauSection');
      if (loanDauSection && window.LoanDauRules) {
        const loanDauAnalysis = window.LoanDauRules.analyze(result);
        if (loanDauAnalysis) {
          loanDauSection.innerHTML = window.LoanDauRules.renderHTML(loanDauAnalysis);
          loanDauSection.classList.remove('hidden');
          window.LoanDauRules.initTabs();
        }
      }
    } catch (e) {
      console.error('LoanDauRules error:', e);
    }

    // Render Thanh Mon (Castle Gate) recommendation
    try {
      const thanhMonSection = document.getElementById('thanhMonSection');
      if (thanhMonSection && window.ThanhMonRules) {
        const tmAnalysis = window.ThanhMonRules.analyze(result);
        if (tmAnalysis) {
          thanhMonSection.innerHTML = window.ThanhMonRules.renderHTML(tmAnalysis);
          thanhMonSection.classList.remove('hidden');
        } else {
          thanhMonSection.classList.add('hidden');
        }
      }
    } catch (e) {
      console.error('ThanhMonRules error:', e);
    }

    // Render Feng Shui interpretation if module available
    try {
      const interpretationSection = document.getElementById('interpretationSection');
      if (interpretationSection && window.FengShuiRules) {
        const analysis = window.FengShuiRules.analyze(result);
        if (analysis) {
          interpretationSection.innerHTML = window.FengShuiRules.renderHTML(analysis);
          interpretationSection.classList.remove('hidden');
          window.FengShuiRules.initTabs();
        }
      }
    } catch (e) {
      console.error('FengShuiRules error:', e);
    }

    // Automatically update image snapshot for right-click copy & instant share sheet
    updateImageSnapshot();
  }

  let cachedChartFile = null;
  let cachedChartBlob = null;
  let snapshotTimer = null;

  function updateImageSnapshot() {
    clearTimeout(snapshotTimer);
    snapshotTimer = setTimeout(() => {
      const exportAreaEl = document.getElementById('exportArea');
      const imgOverlay = document.getElementById('exportAreaImgOverlay');
      if (!exportAreaEl || typeof html2canvas === 'undefined') return;

      if (imgOverlay) imgOverlay.style.display = 'none';

      html2canvas(exportAreaEl, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      }).then(canvas => {
        const dataUrl = canvas.toDataURL('image/png');
        if (imgOverlay) {
          imgOverlay.src = dataUrl;
          imgOverlay.style.display = 'block';
        }
        canvas.toBlob(blob => {
          if (blob) {
            cachedChartBlob = blob;
            const van = (document.getElementById('inputVan') && document.getElementById('inputVan').value) || '8';
            const deg = (document.getElementById('inputDegree') && document.getElementById('inputDegree').value) || '180';
            const filename = `tinhban_van${van}_${deg}deg.png`;
            try {
              cachedChartFile = new File([blob], filename, { type: 'image/png', lastModified: Date.now() });
            } catch(e) {
              console.warn('File constructor fallback:', e);
            }
          }
        }, 'image/png');
      }).catch(err => {
        console.warn('Image snapshot generation error:', err);
      });
    }, 80);
  }

  async function handleDownloadButtonClick(e) {
    if (e) e.preventDefault();

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    // 1. On iPhone / iPad: IMMEDIATELY trigger native iOS Share Sheet!
    if (isIOS && cachedChartFile && typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [cachedChartFile] }) && navigator.share) {
      try {
        await navigator.share({
          files: [cachedChartFile],
          title: 'Tinh Bàn Phong Thủy'
        });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return; // User closed share sheet
        console.warn('iOS Share sheet failed, downloading directly...', err);
      }
    }

    // 2. On PC, Android, Mac: Direct file download
    downloadChart();
  }

  function dataURItoBlob(dataURI) {
    try {
      const parts = dataURI.split(',');
      const byteString = atob(parts[1]);
      const mimeString = parts[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      return new Blob([ab], { type: mimeString });
    } catch (e) {
      console.warn('dataURItoBlob error:', e);
      return null;
    }
  }

  /**
   * Universal Image Save / Share:
   * - On iOS: Native Share Sheet (Save to Photos).
   * - On Android, PC, Mac: Direct file download.
   */
  async function saveOrShareImage(canvasOrDataUrl, filename, title) {
    let blob = null;
    let dataUrl = '';

    try {
      if (typeof canvasOrDataUrl === 'string') {
        dataUrl = canvasOrDataUrl;
        blob = dataURItoBlob(dataUrl);
      } else if (canvasOrDataUrl) {
        if (canvasOrDataUrl.toBlob) {
          blob = await new Promise(r => canvasOrDataUrl.toBlob(r, 'image/png'));
        }
        if (canvasOrDataUrl.toDataURL) {
          dataUrl = canvasOrDataUrl.toDataURL('image/png', 1.0);
        }
        if (!blob && dataUrl) {
          blob = dataURItoBlob(dataUrl);
        }
      }
    } catch (e) {
      console.warn('Blob conversion error:', e);
    }

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    // 1. For iOS (iPhone / iPad): Try Native Share Sheet
    if (isIOS && blob && typeof navigator !== 'undefined' && navigator.canShare && navigator.share) {
      try {
        const file = new File([blob], filename || 'tinhban.png', { type: 'image/png', lastModified: Date.now() });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: title || 'Tinh Bàn Phong Thủy',
          });
          return;
        }
      } catch (err) {
        if (err.name === 'AbortError') return; // User closed share sheet normally
        console.warn('iOS Native share failed, downloading file directly...', err);
      }
    }

    // 2. Direct File Download for Android, PC, Mac
    const downloadUrl = blob ? URL.createObjectURL(blob) : dataUrl;
    const link = document.createElement('a');
    link.download = filename || 'tinhban.png';
    link.href = downloadUrl;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) document.body.removeChild(link);
      if (blob) URL.revokeObjectURL(downloadUrl);
    }, 500);
  }

  window.saveOrShareImage = saveOrShareImage;

  function downloadChart() {
    if (!exportArea) return;
    const origHTML = btnDownload.innerHTML;
    btnDownload.innerText = 'Đang tạo ảnh...';
    btnDownload.disabled = true;

    // Direct snapshot with high quality
    setTimeout(() => {
      html2canvas(exportArea, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      }).then(canvas => {
        btnDownload.innerHTML = origHTML;
        btnDownload.disabled = false;
        const filename = `tinhban_${document.getElementById('inputVan').value}_${document.getElementById('inputDegree').value}.png`;
        saveOrShareImage(canvas, filename, 'Tinh Bàn Huyền Không');
      }).catch(err => {
        btnDownload.innerHTML = origHTML;
        btnDownload.disabled = false;
        console.error('Download error:', err);
        alert('Có lỗi khi tạo ảnh tải về, vui lòng thử lại.');
      });
    }, 40);
  }

  function copyChartToText() {
    if (!currentResult) return;
    
    const r = currentResult;
    const p = r.palaces;
    
    let text = `I. THÔNG TIN CHUNG\n`;
    text += `• Vận: ${r.van}\n`;
    text += `• Số độ: ${r.facingDegree}°\n`;
    
    let huongType = '';
    if (r.chartType === 'HA_QUAI') huongType = 'Chính Hướng';
    else if (r.chartType === 'THE_QUAI') {
      huongType = r.kiemInfo ? r.kiemInfo.label : 'Kiêm Hướng';
    } else if (r.chartType === 'KHONG_VONG') huongType = 'Không Vong';
    
    text += `• Tọa/Hướng: Tọa ${r.sittingMountain.name} / Hướng ${r.facingMountain.name} (${huongType})\n\n`;
    
    text += `II. CHI TIẾT CÁC CUNG\n`;
    
    text += `• Cung Ly (Nam): Sơn: ${p[9].son}, Hướng: ${p[9].huong}, Vận: ${p[9].van}, Niên: ${p[9].nien || '-'}, Nguyệt: ${p[9].nguyet || '-'}, Nhật: ${p[9].nhat || '-'}, Thời: ${p[9].thoi || '-'}\n`;
    text += `• Cung Khôn (Tây Nam): Sơn: ${p[2].son}, Hướng: ${p[2].huong}, Vận: ${p[2].van}, Niên: ${p[2].nien || '-'}, Nguyệt: ${p[2].nguyet || '-'}, Nhật: ${p[2].nhat || '-'}, Thời: ${p[2].thoi || '-'}\n`;
    text += `• Cung Đoài (Tây): Sơn: ${p[7].son}, Hướng: ${p[7].huong}, Vận: ${p[7].van}, Niên: ${p[7].nien || '-'}, Nguyệt: ${p[7].nguyet || '-'}, Nhật: ${p[7].nhat || '-'}, Thời: ${p[7].thoi || '-'}\n`;
    text += `• Cung Càn (Tây Bắc): Sơn: ${p[6].son}, Hướng: ${p[6].huong}, Vận: ${p[6].van}, Niên: ${p[6].nien || '-'}, Nguyệt: ${p[6].nguyet || '-'}, Nhật: ${p[6].nhat || '-'}, Thời: ${p[6].thoi || '-'}\n`;
    text += `• Cung Khảm (Bắc): Sơn: ${p[1].son}, Hướng: ${p[1].huong}, Vận: ${p[1].van}, Niên: ${p[1].nien || '-'}, Nguyệt: ${p[1].nguyet || '-'}, Nhật: ${p[1].nhat || '-'}, Thời: ${p[1].thoi || '-'}\n`;
    text += `• Cung Cấn (Đông Bắc): Sơn: ${p[8].son}, Hướng: ${p[8].huong}, Vận: ${p[8].van}, Niên: ${p[8].nien || '-'}, Nguyệt: ${p[8].nguyet || '-'}, Nhật: ${p[8].nhat || '-'}, Thời: ${p[8].thoi || '-'}\n`;
    text += `• Cung Chấn (Đông): Sơn: ${p[3].son}, Hướng: ${p[3].huong}, Vận: ${p[3].van}, Niên: ${p[3].nien || '-'}, Nguyệt: ${p[3].nguyet || '-'}, Nhật: ${p[3].nhat || '-'}, Thời: ${p[3].thoi || '-'}\n`;
    text += `• Cung Tốn (Đông Nam): Sơn: ${p[4].son}, Hướng: ${p[4].huong}, Vận: ${p[4].van}, Niên: ${p[4].nien || '-'}, Nguyệt: ${p[4].nguyet || '-'}, Nhật: ${p[4].nhat || '-'}, Thời: ${p[4].thoi || '-'}\n`;
    text += `• Trung Cung: Sơn: ${p[5].son}, Hướng: ${p[5].huong}, Vận: ${p[5].van}, Niên: ${p[5].nien || '-'}, Nguyệt: ${p[5].nguyet || '-'}, Nhật: ${p[5].nhat || '-'}, Thời: ${p[5].thoi || '-'}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('Đã sao chép thành công!');
      }).catch(err => {
        console.error('Lỗi khi sao chép: ', err);
        fallbackCopyText(text);
      });
    } else {
      fallbackCopyText(text);
    }
  }

  function showToast(message) {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2000);
  }

  function fallbackCopyText(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      showToast('Đã sao chép thành công!');
    } catch (err) {
      showToast('Không thể tự động sao chép');
    }
    document.body.removeChild(textArea);
  }

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
