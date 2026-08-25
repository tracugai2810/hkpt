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
  const inputDegree = document.getElementById('inputDegree');
  const inputYear = document.getElementById('inputYear');
  const inputVan = document.getElementById('inputVan');
  const inputCurrentYear = document.getElementById('inputCurrentYear');
  const inputCurrentMonth = document.getElementById('inputCurrentMonth');
  const inputCurrentDay = document.getElementById('inputCurrentDay');
  const inputCurrentHour = document.getElementById('inputCurrentHour');
  const inputOwnerYear = document.getElementById('inputOwnerYear');
  const inputOwnerGender = document.getElementById('inputOwnerGender');
  const btnCalculate = document.getElementById('btnCalculate');
  const btnCopyText = document.getElementById('btnCopyText');
  const warningBox = document.getElementById('warningKhongVong');
  const ownerInfo = document.getElementById('ownerInfo');
  const chartInfo = document.getElementById('chartInfo');
  const infoMain = document.getElementById('infoMain');
  const chartContainer = document.getElementById('chartContainer');
  const chartGrid = document.getElementById('chartGrid');
  const infoPanel = document.getElementById('infoPanel');
  const legendSection = document.getElementById('legendSection');
  const actionContainer = document.getElementById('actionContainer');
  const btnDownload = document.getElementById('btnDownload');
  const exportArea = document.getElementById('exportArea');
  const imageResultContainer = document.getElementById('imageResultContainer');
  const finalImage = document.getElementById('finalImage');
  
  let currentResult = null; // Store result for copy functionality

  // Initialize
  function init() {
    // Set current year/month/day/hour defaults
    const now = new Date();
    inputCurrentYear.value = now.getFullYear();
    inputCurrentMonth.value = now.getMonth() + 1;
    if (inputCurrentDay) inputCurrentDay.value = now.getDate();
    
    // Calculate hour index: Tý=1, Sửu=2...
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
    
    // Auto-calculate Van when year changes
    inputYear.addEventListener('input', updateVan);
    
    // Handle decimal comma → dot
    inputDegree.addEventListener('input', function() {
      this.value = this.value.replace(',', '.');
    });
    
    // Calculate button
    btnCalculate.addEventListener('click', calculate);
    
    // Also calc on Enter key
    document.querySelectorAll('.input-field').forEach(el => {
      el.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') calculate();
      });
    });
    
    // Download button event
    if (btnDownload) {
      btnDownload.addEventListener('click', downloadChart);
    }
    
    if (btnCopyText) {
      btnCopyText.addEventListener('click', copyChartToText);
    }
    
    // Initial Van calculation
    updateVan();
    
    // Do not auto-calculate on load
    // calculate();
    
    // Initialize FloorPlan module
    if (window.FloorPlan) {
      window.FloorPlan.init();
    }
  }

  function updateVan() {
    const year = parseInt(inputYear.value);
    if (year && year >= 1864) {
      const van = FlyingStar.getVan(year);
      inputVan.value = van;
    }
  }

  function calculate() {
    // Parse inputs
    let degreeStr = inputDegree.value.replace(',', '.');
    const degree = parseFloat(degreeStr);
    const year = parseInt(inputYear.value);
    const currentYear = parseInt(inputCurrentYear.value);
    const currentMonth = parseInt(inputCurrentMonth.value);
    const currentDay = parseInt(inputCurrentDay.value);
    const currentHour = parseInt(inputCurrentHour.value);
    const ownerYear = parseInt(inputOwnerYear ? inputOwnerYear.value : '');
    const ownerGender = parseInt(inputOwnerGender ? inputOwnerGender.value : '1');
    
    if (isNaN(degree) || degree < 0 || degree >= 360) {
      alert('Vui lòng nhập số độ hướng hợp lệ (0 - 359.9)');
      return;
    }
    
    if (isNaN(year) || year < 1864) {
      alert('Vui lòng nhập năm nhập trạch hợp lệ (từ 1864)');
      return;
    }
    
    // Calculate
    const result = FlyingStar.calculateChart(year, degree, currentYear, currentMonth, currentDay, currentHour);
    currentResult = result; // Save to global
    window._currentChartResult = result; // Expose for FloorPlan module
    
    let menhQuai = null;
    if (!isNaN(ownerYear)) {
      menhQuai = FlyingStar.getMenhQuai(ownerYear, ownerGender);
      menhQuai.year = ownerYear;
      menhQuai.genderName = ownerGender === 1 ? 'Nam' : 'Nữ';
    }
    
    // Display
    renderResult(result, currentYear, currentMonth, currentDay, currentHour, menhQuai);
  }

  function renderResult(result, currentYear, currentMonth, currentDay, currentHour, menhQuai) {
    // Hide image and actions initially
    if (imageResultContainer) imageResultContainer.classList.add('hidden');
    if (actionContainer) actionContainer.classList.add('hidden');
    
    // Prepare exportArea but keep it offscreen during capture
    exportArea.classList.remove('hidden');
    exportArea.style.position = 'absolute';
    exportArea.style.left = '-9999px';
    exportArea.style.top = '0';
    exportArea.classList.add('export-mode'); // Force high contrast always
    
    // Warning
    if (result.chartType === 'KHONG_VONG') {
      warningBox.classList.remove('hidden');
    } else {
      warningBox.classList.add('hidden');
    }
    
    // Owner info
    if (menhQuai && ownerInfo) {
      ownerInfo.innerHTML = `Gia chủ: ${menhQuai.genderName} ${menhQuai.year} - Mệnh quái: ${menhQuai.number} - ${menhQuai.element}`;
      ownerInfo.classList.remove('hidden');
    } else if (ownerInfo) {
      ownerInfo.classList.add('hidden');
      ownerInfo.innerHTML = '';
    }
    
    // Chart info
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
    
    document.getElementById('infoMain').innerHTML = infoHTML;
    
    // Render Grid
    chartContainer.classList.remove('hidden');
    chartGrid.innerHTML = '';
    
    const directionShort = {
      1: 'B', 2: 'TN', 3: 'Đ', 4: 'ĐN', 5: '', 6: 'TB', 7: 'T', 8: 'ĐB', 9: 'N'
    };
    
    // Rotate Grid Algorithm
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
    
    for (let i = 0; i < 9; i++) {
      const palace = displayGrid[i];
      const data = result.palaces[palace];
        
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
        
        // Middle: Vận tinh
        const midDiv = document.createElement('div');
        midDiv.className = 'cell-middle';
        midDiv.innerHTML = `<span class="star-van">${data.van}</span>`;
        
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
    
    // Render compass around the chart grid (standard view keeps 3x3 grid)
    const compassCanvas = document.getElementById('compassCanvas');
    if (compassCanvas && window.Compass) {
      window.Compass.render(compassCanvas, result.facingDegree, result.facingMountain.palace, { showSectorStars: false });
    }
    
    // Update floorplan overlay if active
    if (window.FloorPlan && window.FloorPlan.update) {
      window.FloorPlan.update();
    }
    
    // Info values
    document.getElementById('infoVan').textContent = result.van;
    
    // Degree display
    document.getElementById('infoDegree').textContent = `${result.facingDegree}°`;
    
    document.getElementById('infoYear').textContent = currentYear || '-';
    document.getElementById('infoMonth').textContent = currentMonth || '-';
    document.getElementById('infoDay').textContent = currentDay || '-';
    const hourmap = {1:'Tý', 2:'Sửu', 3:'Dần', 4:'Mão', 5:'Thìn', 6:'Tỵ', 7:'Ngọ', 8:'Mùi', 9:'Thân', 10:'Dậu', 11:'Tuất', 12:'Hợi'};
    document.getElementById('infoHour').textContent = hourmap[currentHour] || '-';

    // Render Feng Shui interpretation if module available
    const interpretationSection = document.getElementById('interpretationSection');
    if (interpretationSection && window.FengShuiRules) {
      const analysis = window.FengShuiRules.analyze(result);
      if (analysis) {
        interpretationSection.innerHTML = window.FengShuiRules.renderHTML(analysis);
        interpretationSection.classList.remove('hidden');
        window.FengShuiRules.initTabs();
      }
    }

    // Auto capture image
    autoCaptureImage();
  }

  function autoCaptureImage() {
    btnCalculate.innerText = 'Đang tạo ảnh tinh bàn...';
    btnCalculate.disabled = true;

    // Give browser a moment to apply styles
    setTimeout(() => {
      html2canvas(exportArea, {
        scale: 4, // Very high resolution (8x default)
        useCORS: true,
        logging: false,
        width: 580, // Match updated export-area width
      }).then(canvas => {
        // Revert UI positioning
        exportArea.classList.remove('export-mode');
        exportArea.style.position = '';
        exportArea.style.left = '';
        exportArea.style.top = '';
        exportArea.classList.add('hidden'); // Hide the DOM version
        
        // Show Image
        if (finalImage && imageResultContainer) {
          finalImage.src = canvas.toDataURL('image/png', 1.0);
          imageResultContainer.classList.remove('hidden');
        }

        if (actionContainer) actionContainer.classList.remove('hidden');

        btnCalculate.innerText = 'Lập Tinh Bàn';
        btnCalculate.disabled = false;
      }).catch(err => {
        console.error('Error generating image', err);
        btnCalculate.innerText = 'Lập Tinh Bàn';
        btnCalculate.disabled = false;
        
        // Fallback to DOM if image fails
        exportArea.classList.remove('export-mode');
        exportArea.style.position = '';
        exportArea.style.left = '';
        exportArea.style.top = '';
      });
    }, 150);
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
   * - On iOS (iPhone / iPad): Uses native Web Share Sheet (to choose "Save Image" / "Lưu hình ảnh" into Photos).
   * - On PC / Laptop / Android: Directly downloads the .png file to the device.
   */
  async function saveOrShareImage(canvasOrDataUrl, filename, title) {
    let blob = null;
    let dataUrl = '';

    try {
      if (typeof canvasOrDataUrl === 'string') {
        dataUrl = canvasOrDataUrl;
        blob = dataURItoBlob(dataUrl);
      } else if (canvasOrDataUrl && canvasOrDataUrl.toDataURL) {
        dataUrl = canvasOrDataUrl.toDataURL('image/png', 1.0);
        blob = dataURItoBlob(dataUrl);
      }
    } catch (e) {
      console.warn('Blob conversion error:', e);
    }

    // Check if user is on iOS (iPhone / iPad / iPod)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    // 1. FOR iOS (iPhone / iPad): Use native Share Sheet to save to Photos / Thư viện ảnh
    if (isIOS) {
      if (blob && typeof navigator !== 'undefined' && navigator.canShare && navigator.share) {
        try {
          const file = new File([blob], filename, { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: title || 'Tinh Bàn Phong Thủy',
            });
            return;
          }
        } catch (err) {
          if (err.name === 'AbortError') return; // User cancelled share sheet
          console.warn('iOS Share failed, showing modal preview fallback...', err);
        }
      }
      // Fallback for iOS if share sheet fails or unsupported
      showIOSImageModal(dataUrl, title);
      return;
    }

    // 2. FOR PC, LAPTOP & ANDROID: Direct file download
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function showIOSImageModal(dataUrl, title) {
    const existing = document.querySelector('.ios-save-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.className = 'ios-save-modal';
    modal.innerHTML = `
      <div class="ios-save-content">
        <div class="ios-save-hint">👉 Chạm và giữ vào ảnh để chọn "Lưu vào Ảnh"</div>
        <img src="${dataUrl}" class="ios-save-img" alt="${title || 'Tinh Bàn'}">
        <button class="ios-save-close">Đóng</button>
      </div>
    `;

    modal.querySelector('.ios-save-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    document.body.appendChild(modal);
  }

  window.saveOrShareImage = saveOrShareImage;

  function downloadChart() {
    if (!finalImage || !finalImage.src) return;
    const filename = `tinhban_${document.getElementById('inputVan').value}_${document.getElementById('inputDegree').value}.png`;
    saveOrShareImage(finalImage.src, filename, 'Tinh Bàn Huyền Không');
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
  document.addEventListener('DOMContentLoaded', init);
})();
