/**
 * ============================================================
 * MODULE ĐỘC LẬP: PHÉP MỞ CỬA BẰNG THÀNH MÔN QUYẾT
 * Chuẩn hóa 100% theo bản đặc tả trích xuất từ "Bí kíp hkpt vip.pdf"
 * Không phụ thuộc, không can thiệp vào bất kỳ logic Thành Môn cũ nào.
 * ============================================================
 */

(function (window) {
  'use strict';

  // 1. BẢNG 24 SƠN: [Cung, Nguyên Long, Tính Âm Dương, Độ số phân kim]
  const TABLE_24_SON = {
    "Nhâm": { Cung: 1, Nguyen_Long: "Dia",   Am_Duong: "+", degreeRange: "337.5° - 352.5°", center: 345, Ten_Cung: "Khảm" },
    "Tý":   { Cung: 1, Nguyen_Long: "Thien", Am_Duong: "-", degreeRange: "352.5° - 7.5°",   center: 0,   Ten_Cung: "Khảm" },
    "Quý":  { Cung: 1, Nguyen_Long: "Nhan",  Am_Duong: "-", degreeRange: "7.5° - 22.5°",    center: 15,  Ten_Cung: "Khảm" },
    "Sửu":  { Cung: 8, Nguyen_Long: "Dia",   Am_Duong: "-", degreeRange: "22.5° - 37.5°",   center: 30,  Ten_Cung: "Cấn" },
    "Cấn":  { Cung: 8, Nguyen_Long: "Thien", Am_Duong: "+", degreeRange: "37.5° - 52.5°",   center: 45,  Ten_Cung: "Cấn" },
    "Dần":  { Cung: 8, Nguyen_Long: "Nhan",  Am_Duong: "+", degreeRange: "52.5° - 67.5°",   center: 60,  Ten_Cung: "Cấn" },
    "Giáp": { Cung: 3, Nguyen_Long: "Dia",   Am_Duong: "+", degreeRange: "67.5° - 82.5°",   center: 75,  Ten_Cung: "Chấn" },
    "Mão":  { Cung: 3, Nguyen_Long: "Thien", Am_Duong: "-", degreeRange: "82.5° - 97.5°",   center: 90,  Ten_Cung: "Chấn" },
    "Ất":   { Cung: 3, Nguyen_Long: "Nhan",  Am_Duong: "-", degreeRange: "97.5° - 112.5°",  center: 105, Ten_Cung: "Chấn" },
    "Thìn": { Cung: 4, Nguyen_Long: "Dia",   Am_Duong: "-", degreeRange: "112.5° - 127.5°", center: 120, Ten_Cung: "Tốn" },
    "Tốn":  { Cung: 4, Nguyen_Long: "Thien", Am_Duong: "+", degreeRange: "127.5° - 142.5°", center: 135, Ten_Cung: "Tốn" },
    "Tị":   { Cung: 4, Nguyen_Long: "Nhan",  Am_Duong: "+", degreeRange: "142.5° - 157.5°", center: 150, Ten_Cung: "Tốn" },
    "Bính": { Cung: 9, Nguyen_Long: "Dia",   Am_Duong: "+", degreeRange: "157.5° - 172.5°", center: 165, Ten_Cung: "Ly" },
    "Ngọ":  { Cung: 9, Nguyen_Long: "Thien", Am_Duong: "-", degreeRange: "172.5° - 187.5°", center: 180, Ten_Cung: "Ly" },
    "Đinh": { Cung: 9, Nguyen_Long: "Nhan",  Am_Duong: "-", degreeRange: "187.5° - 202.5°", center: 195, Ten_Cung: "Ly" },
    "Mùi":  { Cung: 2, Nguyen_Long: "Dia",   Am_Duong: "-", degreeRange: "202.5° - 217.5°", center: 210, Ten_Cung: "Khôn" },
    "Khôn": { Cung: 2, Nguyen_Long: "Thien", Am_Duong: "+", degreeRange: "217.5° - 232.5°", center: 225, Ten_Cung: "Khôn" },
    "Thân": { Cung: 2, Nguyen_Long: "Nhan",  Am_Duong: "+", degreeRange: "232.5° - 247.5°", center: 240, Ten_Cung: "Khôn" },
    "Canh": { Cung: 7, Nguyen_Long: "Dia",   Am_Duong: "+", degreeRange: "247.5° - 262.5°", center: 255, Ten_Cung: "Đoài" },
    "Dậu":  { Cung: 7, Nguyen_Long: "Thien", Am_Duong: "-", degreeRange: "262.5° - 277.5°", center: 270, Ten_Cung: "Đoài" },
    "Tân":  { Cung: 7, Nguyen_Long: "Nhan",  Am_Duong: "-", degreeRange: "277.5° - 292.5°", center: 285, Ten_Cung: "Đoài" },
    "Tuất": { Cung: 6, Nguyen_Long: "Dia",   Am_Duong: "-", degreeRange: "292.5° - 307.5°", center: 300, Ten_Cung: "Càn" },
    "Càn":  { Cung: 6, Nguyen_Long: "Thien", Am_Duong: "+", degreeRange: "307.5° - 322.5°", center: 315, Ten_Cung: "Càn" },
    "Hợi":  { Cung: 6, Nguyen_Long: "Nhan",  Am_Duong: "+", degreeRange: "322.5° - 337.5°", center: 330, Ten_Cung: "Càn" }
  };

  // 2. BẢNG CUNG GỐC LẠC THƯ CỦA 9 SAO
  const BASE_PALACE_OF_STAR = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9 };

  // 3. BẢNG CẶP SỐ TIÊN THIÊN HÀ ĐỒ (Chính Mã)
  const HA_DO_PAIRS = [
    [1, 6], [6, 1],
    [2, 7], [7, 2],
    [3, 8], [8, 3],
    [4, 9], [9, 4]
  ];

  // Tên và phương vị của 9 cung Lạc Thư
  const CUNG_NAMES = {
    1: 'Khảm (Bắc)',
    2: 'Khôn (Tây Nam)',
    3: 'Chấn (Đông)',
    4: 'Tốn (Đông Nam)',
    5: 'Trung Cung',
    6: 'Càn (Tây Bắc)',
    7: 'Đoài (Tây)',
    8: 'Cấn (Đông Bắc)',
    9: 'Ly (Nam)'
  };

  const CUNG_SHORT_NAMES = {
    1: 'Khảm', 2: 'Khôn', 3: 'Chấn', 4: 'Tốn',
    5: 'Trung', 6: 'Càn', 7: 'Đoài', 8: 'Cấn', 9: 'Ly'
  };

  // Quỹ đạo phi tinh Lạc Thư
  const FORWARD_PATH = [5, 6, 7, 8, 9, 1, 2, 3, 4];
  const REVERSE_PATH = [5, 4, 3, 2, 1, 9, 8, 7, 6];
  const RING_8 = [1, 8, 3, 4, 9, 2, 7, 6];

  const NGUYEN_LONG_NAMES = {
    "Dia": "Địa Nguyên Long",
    "Thien": "Thiên Nguyên Long",
    "Nhan": "Nhân Nguyên Long"
  };

  function wrapStar(n) {
    return ((n - 1) % 9 + 9) % 9 + 1;
  }

  function getVanTinh(vanTrach, targetCung) {
    const step = FORWARD_PATH.indexOf(targetCung);
    return wrapStar(vanTrach + step);
  }

  function findSonByPalaceAndYuanLong(cung, yuanLong) {
    for (const [son, data] of Object.entries(TABLE_24_SON)) {
      if (data.Cung === cung && data.Nguyen_Long === yuanLong) {
        return son;
      }
    }
    return null;
  }

  function flyStar(centerStar, direction, targetPalace) {
    const path = direction === "THUẬN" ? FORWARD_PATH : REVERSE_PATH;
    const step = path.indexOf(targetPalace);
    return wrapStar(centerStar + step);
  }

  function isHaDoPair(cung1, cung2) {
    return HA_DO_PAIRS.some(pair => pair[0] === cung1 && pair[1] === cung2);
  }

  /**
   * ==================================================================
   * HÀM CỐT LÕI: Check_Thanh_Mon_Quyet
   * Chuẩn hóa chính xác theo mã giả trong bí kíp hkpt vip.pdf
   * ==================================================================
   */
  function Check_Thanh_Mon_Quyet(Van_Trach, Son_Huong, Cung_Huong, Loai_Ban, Target_Son, Target_Cung, Huong_Tinh_Target, Sao_Huong_Chinh) {
    // ------------------------------------------------------------------
    // BƯỚC 1: KIỂM TRA ĐIỀU KIỆN "ĐỒNG NGUYÊN NHẤT KHÍ" (BẮT BUỘC)
    // ------------------------------------------------------------------
    const dataHuong = TABLE_24_SON[Son_Huong];
    const dataTarget = TABLE_24_SON[Target_Son];

    if (!dataHuong || !dataTarget) {
      return {
        Status: "INVALID",
        Reason: "Dữ liệu Sơn Hướng hoặc Sơn Khảo Sát không hợp lệ.",
        Step1_Pass: false
      };
    }

    const Nguyen_Long_Huong = dataHuong.Nguyen_Long;
    const Nguyen_Long_Target = dataTarget.Nguyen_Long;

    if (Nguyen_Long_Huong !== Nguyen_Long_Target) {
      return {
        Status: "INVALID",
        Step1_Pass: false,
        Reason: `Tạp khí - Sơn ${Target_Son} (${NGUYEN_LONG_NAMES[Nguyen_Long_Target]}) không cùng Tam Nguyên Long với hướng chính ${Son_Huong} (${NGUYEN_LONG_NAMES[Nguyen_Long_Huong]}).`,
        Nguyen_Long_Huong: Nguyen_Long_Huong,
        Nguyen_Long_Target: Nguyen_Long_Target,
        Target_Son: Target_Son,
        Target_Cung: Target_Cung,
        Details: `Phạm Tạp Khí: Hướng chính là ${NGUYEN_LONG_NAMES[Nguyen_Long_Huong]}, nhưng vị trí dự định mở cửa là ${NGUYEN_LONG_NAMES[Nguyen_Long_Target]}. Bí pháp Huyền Không yêu cầu 'Đồng Nguyên Nhất Khí' mới được dẫn khí.`
      };
    }

    // ------------------------------------------------------------------
    // BƯỚC 2: PHÂN LOẠI THÀNH MÔN (Chính Mã / Tá Mã & Tự Khố / Tá Khố)
    // ------------------------------------------------------------------
    // 2.1 Xét Chính mã hay Tá mã
    const isChinhMa = isHaDoPair(Cung_Huong, Target_Cung);
    const Loai_Thanh_Mon = isChinhMa
      ? "Chính Mã (Thành môn chính - Phát cả phú lẫn quý)"
      : "Tá Mã (Thành môn phụ - Chỉ phát phú)";
    const Loai_Thanh_Mon_Short = isChinhMa ? "Chính Mã" : "Tá Mã";

    // 2.2 Xét Tự khố hay Tá khố
    const isTuKho = (Loai_Ban === "Ha_Quai" || Loai_Ban === "HA_QUAI");
    const Luc_Thanh_Mon = isTuKho
      ? "Tự Khố (Chính cách - Lực phát mạnh nhất)"
      : "Tá Khố (Thế quái - Lực phát yếu hơn)";
    const Luc_Thanh_Mon_Short = isTuKho ? "Tự Khố" : "Tá Khố";

    // ------------------------------------------------------------------
    // BƯỚC 3: PHI TINH KHẢO SÁT THÀNH MÔN (AI TINH PHÉP BAY)
    // ------------------------------------------------------------------
    // 3.1 Lấy sao Vận tinh tại Target_Cung trên Vận bàn của Van_Trach
    const Sao_Van = getVanTinh(Van_Trach, Target_Cung);

    // 3.2 Đưa Sao_Van nhập Trung cung để xét chiều bay
    let Am_Duong_Sign = "+";
    let Goc_Detail = "";
    let Son_Goc_Tra_Cuu = "";

    if (Sao_Van === 5) {
      // Nếu là sao 5, lấy tính Âm Dương trực tiếp của Target_Son
      Am_Duong_Sign = dataTarget.Am_Duong;
      Goc_Detail = `Sao vận 5 nhập trung: Lấy tính Âm Dương trực tiếp của Sơn ${Target_Son} (${Am_Duong_Sign === '+' ? 'Dương +' : 'Âm -'})`;
    } else {
      // Lấy Cung gốc của Sao_Van
      const Cung_Goc = BASE_PALACE_OF_STAR[Sao_Van];
      // Tìm Sơn trong Cung_Goc có CÙNG Nguyên Long với Target_Son
      Son_Goc_Tra_Cuu = findSonByPalaceAndYuanLong(Cung_Goc, Nguyen_Long_Target);
      if (Son_Goc_Tra_Cuu && TABLE_24_SON[Son_Goc_Tra_Cuu]) {
        Am_Duong_Sign = TABLE_24_SON[Son_Goc_Tra_Cuu].Am_Duong;
        Goc_Detail = `Sao vận ${Sao_Van} gốc Cung ${CUNG_SHORT_NAMES[Cung_Goc]} -> Sơn ${Son_Goc_Tra_Cuu} (${NGUYEN_LONG_NAMES[Nguyen_Long_Target]}, mang tính ${Am_Duong_Sign === '+' ? 'Dương +' : 'Âm -'})`;
      }
    }

    // 3.3 Xác định chiều bay (Thuận hay Nghịch)
    const Chieu_Bay = (Am_Duong_Sign === "-") ? "NGHỊCH" : "THUẬN";

    // 3.4 Thực hiện phi tinh xem sao nào bay đáo về Target_Cung
    const Sao_Bay_Den = flyStar(Sao_Van, Chieu_Bay, Target_Cung);

    // ------------------------------------------------------------------
    // BƯỚC 4: ĐỐI CHIẾU VƯỢNG/SUY ĐỂ KẾT LUẬN
    // ------------------------------------------------------------------
    const isDac = (Chieu_Bay === "NGHỊCH") && (Sao_Bay_Den === Van_Trach);

    // RÀO CHẮN BỔ SUNG
    const Warnings = [];
    const Recommendations = [];
    let hasNguHoangSat = false;

    // Rule Ngũ Hoàng: Nếu Hướng tinh (sao bên phải) tại Target_Cung là sao Ngũ Hoàng (5)
    if (Huong_Tinh_Target === 5) {
      hasNguHoangSat = true;
      Warnings.push("Cảnh báo: Phương vị này có Ngũ Hoàng sát (Hướng tinh 5 đáo cung), tuyệt đối cấm kỵ động thổ hoặc mở cửa lớn để tránh kích hoạt tai họa, bệnh tật, phá sản!");
    }

    // Rule Bổ cứu & Trợ vượng
    let ruleBoCuuType = "NORMAL";
    if (Sao_Huong_Chinh !== undefined && Sao_Huong_Chinh !== null) {
      const isFacingVuong = (Sao_Huong_Chinh === Van_Trach || Sao_Huong_Chinh === wrapStar(Van_Trach + 1));
      if (!isFacingVuong) {
        ruleBoCuuType = "BO_CUU";
        if (isDac) {
          Recommendations.push("Hướng nhà suy bại (Cửa chính chỉ đón suy/tử khí), BẮT BUỘC mở cửa phụ hoặc đặt Thủy khẩu tại vị trí Thành môn này để bổ cứu tài lộc, cải tử hồi sinh trạch vận.");
        }
      } else {
        ruleBoCuuType = "TRO_VUONG";
        if (isDac) {
          Recommendations.push("Chính hướng đã đắc vượng khí, mở thêm cửa phụ/cổng tại Thành môn sẽ đạt thế 'Song Khí Tề Đáo - Cẩm Thượng Thiêm Hoa', kích hoạt tài lộc gấp đôi.");
        }
      }
    }

    if (isDac) {
      return {
        Status: "VALID",
        Step1_Pass: true,
        Result: "ĐẮC THÀNH MÔN VƯỢNG KHÍ (CỰC CÁT - MỞ CỬA/NẠP THỦY TỐT)",
        Loai_Thanh_Mon: Loai_Thanh_Mon,
        Loai_Thanh_Mon_Short: Loai_Thanh_Mon_Short,
        Luc_Thanh_Mon: Luc_Thanh_Mon,
        Luc_Thanh_Mon_Short: Luc_Thanh_Mon_Short,
        isChinhMa: isChinhMa,
        isTuKho: isTuKho,
        Sao_Van: Sao_Van,
        Chieu_Bay: Chieu_Bay,
        Sao_Bay_Den: Sao_Bay_Den,
        Van_Trach: Van_Trach,
        Target_Son: Target_Son,
        Target_Cung: Target_Cung,
        Target_DegreeRange: dataTarget.degreeRange,
        Goc_Detail: Goc_Detail,
        hasNguHoangSat: hasNguHoangSat,
        ruleBoCuuType: ruleBoCuuType,
        Warnings: Warnings,
        Recommendations: Recommendations,
        Details: `Sao vận ${Sao_Van} nhập trung bay NGHỊCH đưa Vượng tinh ${Van_Trach} đáo về sơn ${Target_Son}.`
      };
    } else {
      return {
        Status: "INVALID",
        Step1_Pass: true,
        Result: "KHÔNG ĐẮC THÀNH MÔN (GẶP THOÁI KHÍ/SUY KHÍ - KHÔNG DÙNG ĐƯỢC)",
        Loai_Thanh_Mon: Loai_Thanh_Mon,
        Loai_Thanh_Mon_Short: Loai_Thanh_Mon_Short,
        Luc_Thanh_Mon: Luc_Thanh_Mon,
        Luc_Thanh_Mon_Short: Luc_Thanh_Mon_Short,
        isChinhMa: isChinhMa,
        isTuKho: isTuKho,
        Sao_Van: Sao_Van,
        Chieu_Bay: Chieu_Bay,
        Sao_Bay_Den: Sao_Bay_Den,
        Van_Trach: Van_Trach,
        Target_Son: Target_Son,
        Target_Cung: Target_Cung,
        Target_DegreeRange: dataTarget.degreeRange,
        Goc_Detail: Goc_Detail,
        hasNguHoangSat: hasNguHoangSat,
        ruleBoCuuType: ruleBoCuuType,
        Warnings: Warnings,
        Recommendations: Recommendations,
        Details: `Sao bay đến là sao ${Sao_Bay_Den} (bay ${Chieu_Bay}), không phải vượng tinh đương vận ${Van_Trach}.`
      };
    }
  }

  /**
   * Khảo sát 2 bên Trái / Phải của Cung Hướng chính
   */
  function analyzePhepMoCua(chartResult) {
    if (!chartResult || !chartResult.facingMountain) return null;

    const vanTrach = chartResult.van || 9;
    const sonHuong = chartResult.facingMountain.name;
    const cungHuong = chartResult.facingMountain.palace;
    const loaiBan = chartResult.chartType || "HA_QUAI";

    if (!cungHuong || cungHuong === 5) return null;

    const idx = RING_8.indexOf(cungHuong);
    if (idx === -1) return null;

    const leftCung = RING_8[(idx - 1 + 8) % 8];
    const rightCung = RING_8[(idx + 1) % 8];

    // Lấy sao Hướng tại cung hướng chính
    const facingPalaceData = chartResult.palaces ? chartResult.palaces[cungHuong] : null;
    const saoHuongChinh = facingPalaceData ? facingPalaceData.huong : null;

    const nguyenLongHuong = TABLE_24_SON[sonHuong].Nguyen_Long;

    // Tìm Sơn Đồng Nguyên trong cung bên trái và bên phải
    const leftTargetSon = findSonByPalaceAndYuanLong(leftCung, nguyenLongHuong);
    const rightTargetSon = findSonByPalaceAndYuanLong(rightCung, nguyenLongHuong);

    const leftPalaceData = chartResult.palaces ? chartResult.palaces[leftCung] : null;
    const rightPalaceData = chartResult.palaces ? chartResult.palaces[rightCung] : null;

    const leftHuongStar = leftPalaceData ? leftPalaceData.huong : null;
    const rightHuongStar = rightPalaceData ? rightPalaceData.huong : null;

    const leftResult = leftTargetSon ? Check_Thanh_Mon_Quyet(
      vanTrach, sonHuong, cungHuong, loaiBan, leftTargetSon, leftCung, leftHuongStar, saoHuongChinh
    ) : null;

    const rightResult = rightTargetSon ? Check_Thanh_Mon_Quyet(
      vanTrach, sonHuong, cungHuong, loaiBan, rightTargetSon, rightCung, rightHuongStar, saoHuongChinh
    ) : null;

    // Lấy danh sách toàn bộ các sơn thuộc 2 cung này để giải thích Tạp Khí
    const leftAllSons = Object.keys(TABLE_24_SON).filter(s => TABLE_24_SON[s].Cung === leftCung);
    const rightAllSons = Object.keys(TABLE_24_SON).filter(s => TABLE_24_SON[s].Cung === rightCung);

    return {
      vanTrach,
      sonHuong,
      cungHuong,
      cungHuongName: CUNG_NAMES[cungHuong],
      loaiBan,
      saoHuongChinh,
      nguyenLongHuong,
      left: {
        cung: leftCung,
        cungName: CUNG_NAMES[leftCung],
        targetSon: leftTargetSon,
        huongStar: leftHuongStar,
        result: leftResult,
        allSons: leftAllSons
      },
      right: {
        cung: rightCung,
        cungName: CUNG_NAMES[rightCung],
        targetSon: rightTargetSon,
        huongStar: rightHuongStar,
        result: rightResult,
        allSons: rightAllSons
      }
    };
  }

  /**
   * Render HTML Khối Giao Diện: "Phép Mở Cửa - Thành Môn Quyết"
   */
  function renderHTML(chartResult) {
    const analysis = analyzePhepMoCua(chartResult);
    if (!analysis) return '';

    const { vanTrach, sonHuong, cungHuong, cungHuongName, loaiBan, saoHuongChinh, nguyenLongHuong, left, right } = analysis;

    function renderCard(sideData, label, icon) {
      const res = sideData.result;
      if (!res) return '';

      const isDac = (res.Status === "VALID");
      const cardClass = isDac ? 'pmc-card-valid' : 'pmc-card-invalid';

      // Danh sách các sơn khác trong cung bị tạp khí
      const otherSons = sideData.allSons.filter(s => s !== sideData.targetSon).map(s => {
        const item = TABLE_24_SON[s];
        return `<strong>Sơn ${s}</strong> (${NGUYEN_LONG_NAMES[item.Nguyen_Long]} - Tạp Khí ❌)`;
      }).join(', ');

      return `
        <div class="pmc-card ${cardClass}">
          <div class="pmc-card-top">
            <div class="pmc-card-badge-row">
              <span class="pmc-side-pill">${icon} ${label}</span>
              <span class="pmc-type-pill ${res.isChinhMa ? 'pill-chinh-ma' : 'pill-ta-ma'}">${res.Loai_Thanh_Mon_Short}</span>
              <span class="pmc-type-pill ${res.isTuKho ? 'pill-tu-kho' : 'pill-ta-kho'}">${res.Luc_Thanh_Mon_Short}</span>
            </div>
            <h4 class="pmc-card-title">${sideData.cungName} — Sơn <span class="pmc-highlight-mountain">${sideData.targetSon}</span></h4>
            <div class="pmc-card-coords">🎯 Phân kim mở cửa: <strong>${TABLE_24_SON[sideData.targetSon].degreeRange}</strong></div>
          </div>

          <div class="pmc-status-banner ${isDac ? 'banner-dac' : 'banner-khong'}">
            <span class="pmc-status-icon">${isDac ? '🚪✨' : '⛔'}</span>
            <div class="pmc-status-text">
              <strong>${isDac ? 'ĐẮC THÀNH MÔN VƯỢNG KHÍ' : 'KHÔNG ĐẮC THÀNH MÔN'}</strong>
              <small>${isDac ? 'Mở cửa phụ / cổng ngõ / nạp thủy cực cát' : 'Thoái khí/Suy khí - Không được mở cửa'}</small>
            </div>
          </div>

          ${res.hasNguHoangSat ? `
            <div class="pmc-alert-nguhoang">
              <span class="pmc-alert-icon">⚠️</span>
              <div>
                <strong>Cảnh Báo Ngũ Hoàng Sát:</strong> Hướng tinh tại đây là sao 5. Bí kíp chỉ định hạn chế mở cửa lớn hoặc động thổ để tránh kích hoạt sát khí!
              </div>
            </div>
          ` : ''}

          <!-- 4 Bước Kiểm Chứng Minh Bạch -->
          <div class="pmc-steps-box">
            <div class="pmc-step-row">
              <span class="pmc-step-num">B1</span>
              <div class="pmc-step-body">
                <span class="pmc-step-title">Đồng Nguyên Nhất Khí:</span>
                <span class="pmc-step-desc">Sơn ${sideData.targetSon} cùng thuộc <strong>${NGUYEN_LONG_NAMES[nguyenLongHuong]}</strong> (Hợp cách dẫn khí ✓)</span>
              </div>
            </div>
            <div class="pmc-step-row">
              <span class="pmc-step-num">B2</span>
              <div class="pmc-step-body">
                <span class="pmc-step-title">Lực Phát & Phân Cấp:</span>
                <span class="pmc-step-desc">${res.Loai_Thanh_Mon}; Lực: ${res.Luc_Thanh_Mon}</span>
              </div>
            </div>
            <div class="pmc-step-row">
              <span class="pmc-step-num">B3</span>
              <div class="pmc-step-body">
                <span class="pmc-step-title">Ai Tinh Phép Bay:</span>
                <span class="pmc-step-desc">Sao vận ${res.Sao_Van} nhập trung bay <strong>${res.Chieu_Bay}</strong> $\\rightarrow$ Đưa <strong>Sao ${res.Sao_Bay_Den}</strong> đáo về. (${res.Goc_Detail})</span>
              </div>
            </div>
            <div class="pmc-step-row">
              <span class="pmc-step-num">B4</span>
              <div class="pmc-step-body">
                <span class="pmc-step-title">Kết Luận Vượng/Suy:</span>
                <span class="pmc-step-desc">${res.Details}</span>
              </div>
            </div>
          </div>

          <!-- Khuyến nghị hành động -->
          <div class="pmc-action-card ${isDac ? 'action-dac' : 'action-khong'}">
            <strong>${isDac ? '💡 Hướng Dẫn Thi Công Cửa/Cổng:' : '⚠️ Lưu Ý An Toàn:'}</strong>
            <p>${isDac ? 
              `Nên trổ thêm cửa phụ, cổng ngõ, mở ban công hoặc đặt bể cá, phong thủy luân tại <strong>Sơn ${sideData.targetSon} (${TABLE_24_SON[sideData.targetSon].degreeRange})</strong>. ${res.Recommendations.join(' ')}` : 
              `Tuyệt đối không trổ cửa, cổng ngõ hoặc tụ thủy tại cung này vì sẽ nạp suy thoái khí, tổn hao tài vận.`}
            </p>
          </div>

          <div class="pmc-tap-khi-note">
            <small>⚠️ Lưu ý: Trong cung ${sideData.cungName}, các vị trí ${otherSons} đều bị tạp khí, không được mở cửa lấn sang.</small>
          </div>
        </div>
      `;
    }

    return `
      <div class="phep-mo-cua-wrapper">
        <!-- Module Header -->
        <div class="pmc-header">
          <div class="pmc-title-group">
            <div class="pmc-tag-row">
              <span class="pmc-main-badge">BÍ KÍP HKPT VIP</span>
              <span class="pmc-sub-badge">Phép Mở Cửa Thực Chiến</span>
            </div>
            <h3 class="pmc-main-title">🚪 Phép Mở Cửa: Thành Môn Quyết (Castle Gate)</h3>
            <p class="pmc-description">
              Khảo sát chuẩn xác phương vị bên cạnh hướng nhà (Hướng <strong>${sonHuong}</strong> - Vận ${vanTrach}) để tìm cửa cứu giải tài vận hoặc trợ lực đại phát, chỉ dẫn độ số phân kim thực tế.
            </p>
          </div>
        </div>

        <!-- 2 Thẻ Khảo Sát Tự Động: Trái & Phải -->
        <div class="pmc-cards-grid">
          ${renderCard(left, 'Bên Trái Hướng Nhà', '👈')}
          ${renderCard(right, 'Bên Phải Hướng Nhà', '👉')}
        </div>

        <!-- BỘ CÔNG CỤ TƯƠNG TÁC: THỬ NGHIỆM MỞ CỬA 24 SƠN -->
        <div class="pmc-interactive-section">
          <div class="pmc-interactive-header">
            <span class="pmc-interactive-icon">🎯</span>
            <div>
              <h4 class="pmc-interactive-title">Bộ Thẩm Định Mở Cửa 24 Sơn (Interactive Door Tester)</h4>
              <p class="pmc-interactive-desc">Bạn muốn thử mở cửa ở một Sơn cụ thể? Chọn sơn bên dưới để hệ thống áp dụng đúng thuật toán Bí Kíp VIP kiểm tra tính hợp cách:</p>
            </div>
          </div>

          <div class="pmc-interactive-controls">
            <div class="pmc-control-item">
              <label for="pmcSelectSon">Chọn Sơn Dự Định Mở Cửa:</label>
              <select id="pmcSelectSon" class="pmc-select">
                ${Object.keys(TABLE_24_SON).map(s => {
                  const m = TABLE_24_SON[s];
                  const isCurrentTarget = (s === left.targetSon || s === right.targetSon);
                  return `<option value="${s}" ${isCurrentTarget ? 'data-highlight="true"' : ''}>Sơn ${s} (${CUNG_NAMES[m.Cung]} - ${NGUYEN_LONG_NAMES[m.Nguyen_Long]}) [${m.degreeRange}]</option>`;
                }).join('')}
              </select>
            </div>
            <button type="button" id="pmcBtnTest" class="pmc-btn-test">⚡ Thẩm Định Ngay</button>
          </div>

          <!-- Kết quả thử nghiệm động -->
          <div id="pmcInteractiveResult" class="pmc-interactive-result">
            <!-- Render dynamically on change -->
          </div>
        </div>

        <!-- CẨM NANG HƯỚNG DẪN MỞ CỬA & ĐẶT THỦY PHÁP -->
        <div class="pmc-guide-section">
          <h4 class="pmc-guide-heading">📘 Cẩm Nang Thi Công & Ứng Dụng Thành Môn Quyết</h4>
          <div class="pmc-guide-grid">
            <div class="pmc-guide-box">
              <div class="guide-box-icon">🚪</div>
              <div class="guide-box-content">
                <strong>1. Trổ Cửa Phụ & Cổng Ngõ:</strong>
                <p>Khẩu độ cánh cửa hoặc tim cổng phải nằm lọt trọn vẹn trong khoảng độ số phân kim của Sơn đắc Thành Môn, tuyệt đối không để mép cửa lấn sang sơn tạp khí kề bên kẻo biến cát thành hung.</p>
              </div>
            </div>
            <div class="pmc-guide-box">
              <div class="guide-box-icon">⛲</div>
              <div class="guide-box-content">
                <strong>2. Thiết Lập Thủy Khẩu Kích Tài:</strong>
                <p>Nếu thế nhà phố không thể mở cửa phụ, có thể đặt bể cá cảnh lớn, phong thủy luân (thác nước luân chuyển), hoặc mở cửa sổ đón gió động tại đúng phương vị Thành Môn để nạp vượng thủy.</p>
              </div>
            </div>
            <div class="pmc-guide-box">
              <div class="guide-box-icon">🧹</div>
              <div class="guide-box-content">
                <strong>3. Giữ Khí Khẩu Thanh Khiết:</strong>
                <p>Vị trí Thành Môn phải luôn thoáng đãng, sạch sẽ, có luồng di chuyển. Cấm kỵ bố trí nhà vệ sinh, hố ga, thùng rác hoặc để góc nhọn từ nhà hàng xóm đâm vào (hình sát Loan Đầu).</p>
              </div>
            </div>
            <div class="pmc-guide-box">
              <div class="guide-box-icon">⏳</div>
              <div class="guide-box-content">
                <strong>4. Giới Hạn Hiệu Lực Thời Vận:</strong>
                <p>Thành Môn là bí pháp 'Vận nào đắc vận đó'. Khi bước sang Vận mới (sau 20 năm), vượng tinh đổi ngôi, vị trí Thành Môn cũ có thể biến thành suy tử khí, cần được gia chủ xem xét đóng lại.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Đăng ký sự kiện tương tác cho Bộ Thẩm Định Mở Cửa 24 Sơn
   */
  function bindEvents(chartResult) {
    const select = document.getElementById('pmcSelectSon');
    const btn = document.getElementById('pmcBtnTest');
    const resultBox = document.getElementById('pmcInteractiveResult');
    if (!select || !resultBox) return;

    function runTest() {
      const targetSon = select.value;
      const targetData = TABLE_24_SON[targetSon];
      if (!targetData) return;

      const vanTrach = chartResult.van || 9;
      const sonHuong = chartResult.facingMountain.name;
      const cungHuong = chartResult.facingMountain.palace;
      const loaiBan = chartResult.chartType || "HA_QUAI";
      const targetCung = targetData.Cung;

      const targetPalaceData = chartResult.palaces ? chartResult.palaces[targetCung] : null;
      const huongStar = targetPalaceData ? targetPalaceData.huong : null;
      const facingPalaceData = chartResult.palaces ? chartResult.palaces[cungHuong] : null;
      const saoHuongChinh = facingPalaceData ? facingPalaceData.huong : null;

      const res = Check_Thanh_Mon_Quyet(vanTrach, sonHuong, cungHuong, loaiBan, targetSon, targetCung, huongStar, saoHuongChinh);

      const isDac = (res.Status === "VALID");
      const isTapKhi = (res.Step1_Pass === false);

      let statusBadge = '';
      if (isDac) {
        statusBadge = '<span class="test-badge-dac">✓ ĐẮC THÀNH MÔN VƯỢNG KHÍ</span>';
      } else if (isTapKhi) {
        statusBadge = '<span class="test-badge-tapkhi">✕ PHẠM TẠP KHÍ (CẤM MỞ)</span>';
      } else {
        statusBadge = '<span class="test-badge-suy">✕ THOÁI/SUY KHÍ (KHÔNG DÙNG ĐƯỢC)</span>';
      }

      resultBox.innerHTML = `
        <div class="pmc-test-card ${isDac ? 'test-valid' : (isTapKhi ? 'test-tapkhi' : 'test-invalid')}">
          <div class="pmc-test-top">
            <div class="pmc-test-title">
              <strong>Kết Quả Thẩm Định Mở Cửa Tại Sơn ${targetSon} (${CUNG_NAMES[targetCung]}):</strong>
              ${statusBadge}
            </div>
            <div class="pmc-test-coords">🎯 Tọa độ phân kim: <strong>${targetData.degreeRange}</strong></div>
          </div>

          <div class="pmc-test-steps">
            <div class="test-step-line">
              <strong>Bước 1 (Đồng Nguyên Nhất Khí):</strong> 
              ${res.Step1_Pass 
                ? `<span class="text-green">Hợp cách ✓ (Cùng ${NGUYEN_LONG_NAMES[TABLE_24_SON[sonHuong].Nguyen_Long]})</span>` 
                : `<span class="text-red">Thất cách ✕ (${res.Reason})</span>`}
            </div>
            ${res.Step1_Pass ? `
              <div class="test-step-line">
                <strong>Bước 2 (Phân loại lực tác động):</strong> ${res.Loai_Thanh_Mon} | ${res.Luc_Thanh_Mon}
              </div>
              <div class="test-step-line">
                <strong>Bước 3 (Phi tinh Ai Tinh):</strong> Sao vận ${res.Sao_Van} nhập trung bay ${res.Chieu_Bay} $\\rightarrow$ Đưa Sao ${res.Sao_Bay_Den} đáo Cung ${CUNG_SHORT_NAMES[targetCung]}. (${res.Goc_Detail})
              </div>
              <div class="test-step-line">
                <strong>Bước 4 (Kết luận đối chiếu):</strong> ${res.Details}
              </div>
            ` : ''}
          </div>

          ${res.Warnings && res.Warnings.length > 0 ? `
            <div class="pmc-test-warning">
              ${res.Warnings.map(w => `<p>⚠️ ${w}</p>`).join('')}
            </div>
          ` : ''}

          ${res.Recommendations && res.Recommendations.length > 0 ? `
            <div class="pmc-test-recom">
              ${res.Recommendations.map(r => `<p>💡 ${r}</p>`).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }

    select.addEventListener('change', runTest);
    if (btn) btn.addEventListener('click', runTest);

    // Chạy mặc định cho sơn đầu tiên
    runTest();
  }

  // Export module độc lập
  window.PhepMoCuaThanhMon = {
    Check_Thanh_Mon_Quyet: Check_Thanh_Mon_Quyet,
    analyze: analyzePhepMoCua,
    renderHTML: renderHTML,
    bindEvents: bindEvents,
    TABLE_24_SON: TABLE_24_SON,
    CUNG_NAMES: CUNG_NAMES
  };

})(window);
