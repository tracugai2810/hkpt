// ============================================================
// Huyền Không Phi Tinh - Flying Star Feng Shui Engine
// ============================================================

// --- CONSTANTS ---

// 24 Mountains data: name, centerDegree, yinYang (+1=Yang, -1=Yin), sanYuanLong, loShuPalace
const MOUNTAINS = [
  { name: 'Nhâm', center: 345, yinYang: 1,  sanYuan: 'Địa',  palace: 1 },
  { name: 'Tý',   center: 0,   yinYang: -1, sanYuan: 'Thiên', palace: 1 },
  { name: 'Quý',  center: 15,  yinYang: -1, sanYuan: 'Nhân',  palace: 1 },
  { name: 'Sửu',  center: 30,  yinYang: -1, sanYuan: 'Địa',  palace: 8 },
  { name: 'Cấn',  center: 45,  yinYang: 1,  sanYuan: 'Thiên', palace: 8 },
  { name: 'Dần',  center: 60,  yinYang: 1,  sanYuan: 'Nhân',  palace: 8 },
  { name: 'Giáp', center: 75,  yinYang: 1,  sanYuan: 'Địa',  palace: 3 },
  { name: 'Mão',  center: 90,  yinYang: -1, sanYuan: 'Thiên', palace: 3 },
  { name: 'Ất',   center: 105, yinYang: -1, sanYuan: 'Nhân',  palace: 3 },
  { name: 'Thìn', center: 120, yinYang: -1, sanYuan: 'Địa',  palace: 4 },
  { name: 'Tốn',  center: 135, yinYang: 1,  sanYuan: 'Thiên', palace: 4 },
  { name: 'Tỵ',   center: 150, yinYang: 1,  sanYuan: 'Nhân',  palace: 4 },
  { name: 'Bính', center: 165, yinYang: 1,  sanYuan: 'Địa',  palace: 9 },
  { name: 'Ngọ',  center: 180, yinYang: -1, sanYuan: 'Thiên', palace: 9 },
  { name: 'Đinh', center: 195, yinYang: -1, sanYuan: 'Nhân',  palace: 9 },
  { name: 'Mùi',  center: 210, yinYang: -1, sanYuan: 'Địa',  palace: 2 },
  { name: 'Khôn', center: 225, yinYang: 1,  sanYuan: 'Thiên', palace: 2 },
  { name: 'Thân', center: 240, yinYang: 1,  sanYuan: 'Nhân',  palace: 2 },
  { name: 'Canh', center: 255, yinYang: 1,  sanYuan: 'Địa',  palace: 7 },
  { name: 'Dậu',  center: 270, yinYang: -1, sanYuan: 'Thiên', palace: 7 },
  { name: 'Tân',  center: 285, yinYang: -1, sanYuan: 'Nhân',  palace: 7 },
  { name: 'Tuất', center: 300, yinYang: -1, sanYuan: 'Địa',  palace: 6 },
  { name: 'Càn',  center: 315, yinYang: 1,  sanYuan: 'Thiên', palace: 6 },
  { name: 'Hợi',  center: 330, yinYang: 1,  sanYuan: 'Nhân',  palace: 6 },
];

// Palace names
const PALACE_NAMES = {
  1: 'Khảm', 2: 'Khôn', 3: 'Chấn', 4: 'Tốn',
  5: 'Trung', 6: 'Càn', 7: 'Đoài', 8: 'Cấn', 9: 'Ly'
};

// Palace directions
const PALACE_DIRECTIONS = {
  1: 'Bắc', 2: 'Tây Nam', 3: 'Đông', 4: 'Đông Nam',
  5: 'Trung Cung', 6: 'Tây Bắc', 7: 'Tây', 8: 'Đông Bắc', 9: 'Nam'
};

// Flying path - Luong Thien Xich trajectory
const FORWARD_PATH = [5, 6, 7, 8, 9, 1, 2, 3, 4];
const REVERSE_PATH = [5, 4, 3, 2, 1, 9, 8, 7, 6];

// Replacement Star Table (Thế Tinh) - mountain name -> replacement star number
const REPLACEMENT_STAR = {
  'Tý': 1, 'Quý': 1, 'Giáp': 1, 'Thân': 1,
  'Khôn': 2, 'Nhâm': 2, 'Ất': 2, 'Mão': 2, 'Mùi': 2,
  'Tuất': 6, 'Càn': 6, 'Hợi': 6, 'Thìn': 6, 'Tốn': 6, 'Tỵ': 6,
  'Cấn': 7, 'Bính': 7, 'Tân': 7, 'Dậu': 7, 'Sửu': 7,
  'Dần': 9, 'Ngọ': 9, 'Canh': 9, 'Đinh': 9,
};

// Period (Vận) ranges - each period is 20 years
const PERIOD_RANGES = [
  { van: 1, start: 1864, end: 1883 },
  { van: 2, start: 1884, end: 1903 },
  { van: 3, start: 1904, end: 1923 },
  { van: 4, start: 1924, end: 1943 },
  { van: 5, start: 1944, end: 1963 },
  { van: 6, start: 1964, end: 1983 },
  { van: 7, start: 1984, end: 2003 },
  { van: 8, start: 2004, end: 2023 },
  { van: 9, start: 2024, end: 2043 },
  // Extended periods (cycle repeats every 180 years)
  { van: 1, start: 2044, end: 2063 },
  { van: 2, start: 2064, end: 2083 },
  { van: 3, start: 2084, end: 2103 },
];

// --- UTILITY FUNCTIONS ---

function wrapStar(n) {
  // Wrap star number 1-9
  n = ((n - 1) % 9 + 9) % 9 + 1;
  return n;
}

function degreeDiff(a, b) {
  // Angular difference handling 360° wrap
  let diff = Math.abs(a - b);
  if (diff > 180) diff = 360 - diff;
  return diff;
}

// --- CORE FUNCTIONS ---

/**
 * Get Period (Vận) from year
 */
function getVan(year) {
  // Use 180-year cycle from 1864
  const cycleYear = ((year - 1864) % 180 + 180) % 180;
  const van = Math.floor(cycleYear / 20) + 1;
  return van;
}

/**
 * Find the closest mountain for a given degree
 */
function findMountain(degree) {
  degree = ((degree % 360) + 360) % 360;
  let best = null;
  let bestDiff = 999;
  for (const m of MOUNTAINS) {
    const diff = degreeDiff(degree, m.center);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = m;
    }
  }
  return { mountain: best, deviation: bestDiff };
}

/**
 * Find the opposite mountain (Tọa from Hướng or vice versa)
 */
function getOpposite(degree) {
  let opp = degree + 180;
  if (opp >= 360) opp -= 360;
  return findMountain(opp);
}

/**
 * Classify the chart type based on deviation from mountain center
 */
function classifyChart(deviation) {
  if (deviation <= 3) return 'HA_QUAI';      // Chính Hướng
  if (deviation <= 7) return 'THE_QUAI';     // Kiêm Hướng
  return 'KHONG_VONG';                        // Không Vong
}

/**
 * Build Vận Bàn (Period Chart) - always flies FORWARD
 */
function buildVanBan(vanNumber) {
  const chart = {};
  for (let i = 0; i < 9; i++) {
    const palace = FORWARD_PATH[i];
    chart[palace] = wrapStar(vanNumber + i);
  }
  return chart;
}

/**
 * Build a star chart (Sơn Bàn or Hướng Bàn)
 * @param {number} startStar - The star number entering center
 * @param {boolean} isForward - true = forward (thuận), false = reverse (nghịch)
 */
function buildStarBan(startStar, isForward) {
  const path = isForward ? FORWARD_PATH : REVERSE_PATH;
  const chart = {};
  for (let i = 0; i < 9; i++) {
    const palace = path[i];
    chart[palace] = wrapStar(startStar + i);
  }
  return chart;
}

/**
 * Find the mountain in a given palace that matches a specific San Yuan Long
 */
function findMountainInPalace(palace, sanYuan) {
  return MOUNTAINS.find(m => m.palace === palace && m.sanYuan === sanYuan);
}

/**
 * Determine flying direction for a star
 * Returns true for forward (thuận), false for reverse (nghịch)
 * 
 * @param {number} star - The star number (Sao Sơn or Sao Hướng)
 * @param {string} sanYuan - The San Yuan Long of the house
 * @param {object} originalMountain - The original Tọa/Hướng mountain (used when star=5)
 */
function getDirection(star, sanYuan, originalMountain) {
  if (star === 5) {
    // Special case: star 5 has no palace, use the yin/yang of the original mountain
    return originalMountain.yinYang === 1; // Yang = forward
  }
  // Find the palace that corresponds to this star in the Lo Shu
  const targetPalace = star; // In Lo Shu, palace number = star number
  const refMountain = findMountainInPalace(targetPalace, sanYuan);
  if (!refMountain) return true; // fallback
  return refMountain.yinYang === 1; // Yang = forward
}

/**
 * Get replacement star for Thế Quái
 * @param {number} star - Original star (Sao Sơn or Sao Hướng)
 * @param {string} sanYuan - San Yuan Long of the house
 * @returns {{ replacementStar: number, refMountain: object, isForward: boolean }}
 */
function getReplacementStar(star, sanYuan) {
  const targetPalace = star === 5 ? 5 : star;
  if (star === 5) {
    // Star 5: no palace, need special handling
    // For Thế Quái with star 5, this shouldn't normally occur
    // but handle gracefully
    return { replacementStar: 5, refMountain: null, isForward: true };
  }
  const refMountain = findMountainInPalace(targetPalace, sanYuan);
  if (!refMountain) return { replacementStar: star, refMountain: null, isForward: true };
  
  const replacementStar = REPLACEMENT_STAR[refMountain.name] || star;
  const isForward = refMountain.yinYang === 1;
  
  return { replacementStar, refMountain, isForward };
}

/**
 * Determine which mountain the facing degree is leaning towards (for Kiêm display)
 */
function getKiemInfo(facingDegree, facingMountain) {
  // Find which adjacent mountain the degree leans towards
  const idx = MOUNTAINS.findIndex(m => m.name === facingMountain.name);
  const prevIdx = (idx - 1 + 24) % 24;
  const nextIdx = (idx + 1) % 24;
  
  const prevDiff = degreeDiff(facingDegree, MOUNTAINS[prevIdx].center);
  const nextDiff = degreeDiff(facingDegree, MOUNTAINS[nextIdx].center);
  
  let kiemMountain;
  if (prevDiff < nextDiff) {
    kiemMountain = MOUNTAINS[prevIdx];
  } else {
    kiemMountain = MOUNTAINS[nextIdx];
  }
  
  // Find the opposite of the kiêm mountain for Tọa side
  const kiemOpp = getOpposite(kiemMountain.center);
  
  return {
    kiemHuong: kiemMountain,
    kiemToa: kiemOpp.mountain,
    label: `Kiêm ${kiemOpp.mountain.name} ${kiemMountain.name}`
  };
}

/**
 * Calculate Annual Flying Star (Niên Tinh)
 * Formula: Niên Tinh = 9 - ((Y - 1982) % 9)
 */
function getSolarTermInfoExact(year, month, day) {
  const d = new Date(year, month - 1, day);
  let isYang = true;
  let period = 1;

  if (typeof Lunar !== 'undefined') {
    const lunar = Lunar.fromDate(d);
    const name = lunar.getPrevJieQi(true).getName();
    if (['冬至', '小寒', '大寒'].includes(name)) period = 1;
    else if (['雨水', '惊蛰', '春分', '清明'].includes(name)) period = 2;
    else if (['谷雨', '立夏', '小满', '芒种'].includes(name)) period = 3;
    else if (['夏至', '小暑', '大暑', '立秋'].includes(name)) { period = 4; isYang = false; }
    else if (['处暑', '白露', '秋分', '寒露'].includes(name)) { period = 5; isYang = false; }
    else if (['霜降', '立冬', '小雪', '大雪'].includes(name)) { period = 6; isYang = false; }
  } else {
    const dd = month * 100 + day;
    if (dd >= 1222 || dd < 219) { period = 1; isYang = true; }
    else if (dd >= 219 && dd < 420) { period = 2; isYang = true; }
    else if (dd >= 420 && dd < 621) { period = 3; isYang = true; }
    else if (dd >= 621 && dd < 823) { period = 4; isYang = false; }
    else if (dd >= 823 && dd < 1023) { period = 5; isYang = false; }
    else if (dd >= 1023 && dd < 1222) { period = 6; isYang = false; }
  }
  return { period, isYang };
}

function getDailyStar(year, month, day) {
  const info = getSolarTermInfoExact(year, month, day);
  
  let baseStar = 1;
  const periodMap = {1:1, 2:7, 3:4, 4:9, 5:3, 6:6};
  baseStar = periodMap[info.period] || 1;
  
  const giapTy = new Date(2024, 2, 1);
  const d = new Date(year, month - 1, day);
  let dayOffset = Math.floor((d.getTime() - giapTy.getTime()) / (1000 * 60 * 60 * 24)) % 60;
  if (dayOffset < 0) dayOffset += 60;
  
  let nhatTinh = 0;
  if (info.isYang) {
    nhatTinh = baseStar + (dayOffset % 9);
    nhatTinh = ((nhatTinh - 1) % 9) + 1;
  } else {
    nhatTinh = baseStar - (dayOffset % 9);
    nhatTinh = ((nhatTinh - 1) % 9 + 9) % 9 + 1;
  }
  return { centerStar: nhatTinh, isForward: info.isYang };
}

function getHourlyStar(year, month, day, hourIndex) {
  const info = getSolarTermInfoExact(year, month, day);
  
  const giapTy = new Date(2024, 2, 1);
  const d = new Date(year, month - 1, day);
  let dayOffset = Math.floor((d.getTime() - giapTy.getTime()) / (1000 * 60 * 60 * 24)) % 60;
  if (dayOffset < 0) dayOffset += 60;
  
  const dayBranch = dayOffset % 12; 
  let baseStar = 1;
  if ([0, 3, 6, 9].includes(dayBranch)) baseStar = info.isYang ? 1 : 9;
  else if ([2, 5, 8, 11].includes(dayBranch)) baseStar = info.isYang ? 7 : 3;
  else baseStar = info.isYang ? 4 : 6;
  
  let thoiTinh = 0;
  if (info.isYang) {
    thoiTinh = baseStar + (hourIndex - 1);
    thoiTinh = ((thoiTinh - 1) % 9) + 1;
  } else {
    thoiTinh = baseStar - (hourIndex - 1);
    thoiTinh = ((thoiTinh - 1) % 9 + 9) % 9 + 1;
  }
  return { centerStar: thoiTinh, isForward: info.isYang };
}

function getMenhQuai(year, gender) {
  // 1: Nam, 0: Nữ
  let sum = 0;
  let temp = year;
  while (temp > 0) {
    sum += temp % 10;
    temp = Math.floor(temp / 10);
  }
  
  let remainder = sum % 9;
  if (remainder === 0) remainder = 9;
  
  let base = remainder + 4;
  if (base > 9) base -= 9;
  
  let resultNum = 0;
  let quai = '';
  let element = '';
  
  if (base === 1) {
    resultNum = gender === 1 ? 8 : 1;
    quai = gender === 1 ? 'Cấn' : 'Khảm';
    element = gender === 1 ? 'Thổ' : 'Thủy';
  } else if (base === 2) {
    resultNum = gender === 1 ? 4 : 2;
    quai = gender === 1 ? 'Tốn' : 'Khôn';
    element = gender === 1 ? 'Mộc' : 'Thổ';
  } else if (base === 3) {
    resultNum = 3;
    quai = 'Chấn';
    element = 'Mộc';
  } else if (base === 4) {
    resultNum = gender === 1 ? 2 : 4;
    quai = gender === 1 ? 'Khôn' : 'Tốn';
    element = gender === 1 ? 'Thổ' : 'Mộc';
  } else if (base === 5) {
    resultNum = gender === 1 ? 8 : 2;
    quai = gender === 1 ? 'Cấn' : 'Khôn';
    element = 'Thổ';
  } else if (base === 6) {
    resultNum = gender === 1 ? 9 : 6;
    quai = gender === 1 ? 'Ly' : 'Càn';
    element = gender === 1 ? 'Hỏa' : 'Kim';
  } else if (base === 7) {
    resultNum = gender === 1 ? 8 : 7;
    quai = gender === 1 ? 'Cấn' : 'Đoài';
    element = gender === 1 ? 'Thổ' : 'Kim';
  } else if (base === 8) {
    resultNum = gender === 1 ? 7 : 8;
    quai = gender === 1 ? 'Đoài' : 'Cấn';
    element = gender === 1 ? 'Kim' : 'Thổ';
  } else if (base === 9) {
    resultNum = gender === 1 ? 6 : 9;
    quai = gender === 1 ? 'Càn' : 'Ly';
    element = gender === 1 ? 'Kim' : 'Hỏa';
  }
  
  return { number: resultNum, quai: quai, element: element };
}

function getAnnualStar(year, month, day) {
  let effectiveYear = year;
  let isAfterLichun = false;
  
  if (typeof Lunar !== 'undefined') {
    const d = new Date(year, month - 1, day);
    const bazi = Lunar.fromDate(d).getEightChar();
    // In bazi, if year ganZhi matched the actual lunar year we are good, but Lặp Xuân gives next year's bazi early.
    // Instead, just roughly check LiChun (around Feb 4th)
  }
  
  if (month === 1 || (month === 2 && day < 4)) {
    effectiveYear = year - 1;
  }
  
  let remainder = (effectiveYear - 1982) % 9;
  if (remainder < 0) remainder += 9;
  let star = 9 - remainder;
  if (star === 0) star = 9;
  
  return { star, effectiveYear };
}

function getMonthlyStar(effectiveYear, year, month, day) {
  let chineseMonth = month === 1 ? 12 : month - 1;

  if (typeof Lunar !== 'undefined') {
    const bazi = Lunar.fromDate(new Date(year, month - 1, day)).getEightChar();
    const zhi = bazi.getMonthZhi();
    const zhiToMonth = {'寅':1, '卯':2, '辰':3, '巳':4, '午':5, '未':6, '申':7, '酉':8, '戌':9, '亥':10, '子':11, '丑':12};
    if (zhiToMonth[zhi]) chineseMonth = zhiToMonth[zhi];
  }

  let chiIndex = (effectiveYear - 3) % 12;
  if (chiIndex <= 0) chiIndex += 12;

  let baseStar;
  if ([1, 4, 7, 10].includes(chiIndex)) {
    baseStar = 8;
  } else if ([2, 5, 8, 11].includes(chiIndex)) {
    baseStar = 5;
  } else {
    baseStar = 2;
  }

  let star = baseStar - (chineseMonth - 1);
  star = ((star - 1) % 9 + 9) % 9 + 1;
  return star;
}

function buildOverlayChart(centerStar) {
  return buildStarBan(centerStar, true);
}

function calculateChart(year, facingDegree, currentYear, currentMonth, currentDay, currentHour) {
  // Parse degree
  facingDegree = ((facingDegree % 360) + 360) % 360;
  
  // Step 1: Get Period
  const van = getVan(year);
  
  // Step 2: Find Facing and Sitting mountains
  const facingResult = findMountain(facingDegree);
  const facingMountain = facingResult.mountain;
  const deviation = facingResult.deviation;
  
  const sittingDegree = (facingDegree + 180) % 360;
  const sittingResult = findMountain(sittingDegree);
  const sittingMountain = sittingResult.mountain;
  
  // Step 3: Classify chart type
  const chartType = classifyChart(deviation);
  
  // Get San Yuan Long of the house (from the sitting mountain)
  // Tọa and Hướng mountains always share the same san yuan long (they are opposite)
  const sanYuan = sittingMountain.sanYuan;
  
  // Step 4: Build Vận Bàn
  const vanBan = buildVanBan(van);
  
  // Step 5: Get Mountain Star (Sao Sơn) and Facing Star (Sao Hướng)
  const saoSon = vanBan[sittingMountain.palace];
  const saoHuong = vanBan[facingMountain.palace];
  
  let sonBan, huongBan;
  let sonCenter, huongCenter;
  let kiemInfo = null;
  
  if (chartType === 'KHONG_VONG') {
    // Không Vong - still build chart but show warning
    // Build as Hạ Quái for display
    sonCenter = saoSon;
    const sonForward = getDirection(saoSon, sanYuan, sittingMountain);
    sonBan = buildStarBan(saoSon, sonForward);
    
    huongCenter = saoHuong;
    const huongForward = getDirection(saoHuong, sanYuan, facingMountain);
    huongBan = buildStarBan(saoHuong, huongForward);
  } else if (chartType === 'HA_QUAI') {
    // Hạ Quái (Chính Hướng)
    sonCenter = saoSon;
    const sonForward = getDirection(saoSon, sanYuan, sittingMountain);
    sonBan = buildStarBan(saoSon, sonForward);
    
    huongCenter = saoHuong;
    const huongForward = getDirection(saoHuong, sanYuan, facingMountain);
    huongBan = buildStarBan(saoHuong, huongForward);
  } else {
    // Thế Quái (Kiêm Hướng)
    kiemInfo = getKiemInfo(facingDegree, facingMountain);
    
    // Theo thuật toán đúng của Thế Quái:
    // - Sơn Bàn: dùng sanYuan của chính Tọa sơn (sittingMountain.sanYuan)
    //   để tìm Sơn Gốc trong cung gốc của saoSon, rồi tra Bảng Thế Tinh.
    // - Hướng Bàn: dùng sanYuan của chính Hướng sơn (facingMountain.sanYuan)
    //   để tìm Sơn Gốc trong cung gốc của saoHuong, rồi tra Bảng Thế Tinh.
    const toaSanYuan = sittingMountain.sanYuan;   // Nguyên Long của Tọa sơn
    const huongSanYuan = facingMountain.sanYuan;  // Nguyên Long của Hướng sơn
    
    // Mountain star replacement - dùng sanYuan của Tọa sơn
    const sonReplacement = getReplacementStar(saoSon, toaSanYuan);
    sonCenter = sonReplacement.replacementStar;
    sonBan = buildStarBan(sonCenter, sonReplacement.isForward);
    
    // Facing star replacement - dùng sanYuan của Hướng sơn
    const huongReplacement = getReplacementStar(saoHuong, huongSanYuan);
    huongCenter = huongReplacement.replacementStar;
    huongBan = buildStarBan(huongCenter, huongReplacement.isForward);
  }
  
  // Step 6: Build Annual and Monthly overlay charts
  let annualBan = null, monthlyBan = null;
  let nhatBan = null, thoiBan = null;
  let annualCenter = null, monthlyCenter = null;
  
  if (currentYear) {
    const annualResult = getAnnualStar(currentYear, currentMonth, currentDay || 15);
    annualCenter = annualResult.star;
    annualBan = buildOverlayChart(annualCenter);
    
    if (currentMonth) {
      monthlyCenter = getMonthlyStar(annualResult.effectiveYear, currentYear, currentMonth, currentDay || 15);
      monthlyBan = buildOverlayChart(monthlyCenter);
    }
  }

  if (currentYear && currentMonth && currentDay && currentHour) {
    const dailyResult = getDailyStar(currentYear, currentMonth, currentDay);
    nhatBan = buildStarBan(dailyResult.centerStar, dailyResult.isForward);
    
    const hourlyResult = getHourlyStar(currentYear, currentMonth, currentDay, currentHour);
    thoiBan = buildStarBan(hourlyResult.centerStar, hourlyResult.isForward);
  }
  
  // Step 7: Compose result - 9 palaces
  const palaces = {};
  for (let p = 1; p <= 9; p++) {
    palaces[p] = {
      son: sonBan[p],       // Mountain star
      huong: huongBan[p],   // Facing star
      van: vanBan[p],       // Period star
      nien: annualBan ? annualBan[p] : null,    
      nguyet: monthlyBan ? monthlyBan[p] : null,
      nhat: nhatBan ? nhatBan[p] : null,
      thoi: thoiBan ? thoiBan[p] : null,
      palaceName: PALACE_NAMES[p],
      palaceDirection: PALACE_DIRECTIONS[p],
    };
  }
  
  // Determine degree range for the facing mountain
  const halfMountain = 7.5;
  let degreeMin = facingMountain.center - halfMountain;
  let degreeMax = facingMountain.center + halfMountain;
  if (degreeMin < 0) degreeMin += 360;
  if (degreeMax >= 360) degreeMax -= 360;
  
  return {
    van,
    facingMountain,
    sittingMountain,
    facingDegree,
    sittingDegree,
    deviation,
    chartType,
    kiemInfo,
    sanYuan,
    palaces,
    sonCenter,
    huongCenter,
    annualCenter,
    monthlyCenter,
    degreeRange: { min: degreeMin, max: degreeMax },
  };
}

// Export for use in main.js
window.FlyingStar = {
  calculateChart,
  getVan,
  findMountain,
  getMenhQuai,
  getAnnualStar,
  getMonthlyStar,
  MOUNTAINS,
  PALACE_NAMES,
  PALACE_DIRECTIONS,
};
