/**
 * ============================================================
 * Huyền Không Phi Tinh - Phong Thủy Rules Engine & Luận Giải
 * ============================================================
 */
(function() {
  'use strict';

  /**
   * Phân tích Tinh Bàn theo toàn bộ bộ quy tắc phong thủy nhà ở
   * @param {Object} chartResult - Kết quả từ FlyingStar.calculateChart()
   * @returns {Object} Dữ liệu phân tích chi tiết cho 6 không gian và 9 cung
   */
  function analyzeFengShui(chartResult) {
    if (!chartResult || !chartResult.palaces) return null;

    const vanTrach = chartResult.van || 9;
    const palaces = chartResult.palaces;
    const isKiem = chartResult.chartType === 'kiem';
    const facingDegree = chartResult.facingDegree || 0;

    // 1. Phân loại Cát - Hung của các Sao theo Vận Trạch
    const saoVuongKhi = vanTrach;
    const saoSinhKhi_1 = (vanTrach % 9) + 1;
    const saoCatTinh = [1, 6, 8, 9];
    const saoBaoSat = [2, 5]; // Nhị Hắc & Ngũ Hoàng luôn là hung sát

    // Các sao suy tử: không phải vượng/sinh và không thuộc cát tinh
    const saoSuyTu = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(
      s => s !== saoVuongKhi && s !== saoSinhKhi_1 && !saoCatTinh.includes(s)
    );

    // Kiểm tra Lệnh tinh nhập tù ở Trung Cung (Palace 5)
    const isHuongTinhNhapTu = palaces[5] && palaces[5].huong === vanTrach;
    const isSonTinhNhapTu = palaces[5] && palaces[5].son === vanTrach;

    // Phân tích theo từng không gian chức năng
    const analysis = {
      meta: {
        vanTrach,
        saoVuongKhi,
        saoSinhKhi_1,
        saoBaoSat,
        isKiem,
        facingDegree,
        isHuongTinhNhapTu,
        isSonTinhNhapTu
      },
      doors: [],      // Cửa chính
      bedrooms: [],   // Phòng ngủ
      kitchens: [],   // Nhà bếp
      stairs: [],     // Cầu thang
      toilets: [],    // Nhà vệ sinh & Bể phốt
      studies: [],    // Phòng học & Bàn làm việc
      altars: [],     // Phòng thờ
      palaceSummaries: {} // Tóm tắt 9 cung
    };

    // Duyệt qua 8 cung hướng (1-4, 6-9) và Trung Cung (5)
    for (let p = 1; p <= 9; p++) {
      const pal = palaces[p];
      if (!pal) continue;

      const son = pal.son;
      const huong = pal.huong;
      const van = pal.van;
      const name = pal.palaceName;
      const dir = pal.palaceDirection;
      const isCenter = (p === 5);

      // --- 1. CỬA CHÍNH (ĐẠI MÔN / KHÍ KHẨU) ---
      if (!isCenter) {
        let doorRating = 'Bình';
        let doorScore = 50;
        let doorDesc = '';
        let doorBadges = [];

        if (huong === saoVuongKhi) {
          doorRating = 'Xuất Sắc';
          doorScore = 100;
          doorDesc = `Hướng tinh nạp <strong>Vượng Khí (${huong})</strong> của Vận ${vanTrach}. Cực kỳ đắc tài đắc lộc, gia đạo hưng thịnh, kinh doanh đại phát.`;
          doorBadges.push({ text: 'Ưu tiên số 1', type: 'success' });
        } else if (huong === saoSinhKhi_1) {
          doorRating = 'Tốt';
          doorScore = 85;
          doorDesc = `Hướng tinh nạp <strong>Sinh Khí (${huong})</strong> kế cận. Tài vận tăng tiến bền vững, phát triển lâu dài.`;
          doorBadges.push({ text: 'Ưu tiên số 2', type: 'primary' });
        } else if (saoBaoSat.includes(huong)) {
          doorRating = 'Đại Kỵ';
          doorScore = 10;
          doorDesc = `Hướng tinh phạm <strong>${huong === 2 ? 'Nhị Hắc Bệnh Phù (2)' : 'Ngũ Hoàng Đại Sát (5)'}</strong>. Khí khẩu nạp sát khí nặng, gia chủ dễ đau ốm, hao tài, tai họa. Cần hóa giải bằng chuông gió đồng 6 ống hoặc hồ lô đồng.`;
          doorBadges.push({ text: 'Tránh mở cửa', type: 'danger' });
        } else if (saoCatTinh.includes(huong)) {
          doorRating = 'Cát';
          doorScore = 75;
          doorDesc = `Hướng tinh cát lành (${huong}). Nạp sinh khí tốt cho tài lộc và gia đạo.`;
          doorBadges.push({ text: 'Khá tốt', type: 'success' });
        } else {
          doorRating = 'Bình';
          doorScore = 50;
          doorDesc = `Hướng tinh (${huong}) đã suy thoái khí. Nạp khí bình thường, cần giữ cửa luôn sáng sủa, thông thoáng.`;
        }

        if (isKiem) {
          doorDesc += ` <span class="rule-warn-inline">⚠️ Nhà kiêm hướng: Cửa chính dễ bị tạp khí, cần an vị cửa chuẩn độ số.</span>`;
          doorScore -= 20;
        }

        analysis.doors.push({
          palace: p, name, dir, son, huong, van,
          rating: doorRating, score: doorScore, desc: doorDesc, badges: doorBadges
        });
      }

      // --- 2. PHÒNG NGỦ & ĐẦU GIƯỜNG (SÀNG VỊ) ---
      if (!isCenter) {
        let bedRating = 'Bình';
        let bedScore = 50;
        let bedDesc = '';
        let bedBadges = [];

        if (son === saoVuongKhi || son === saoSinhKhi_1) {
          bedRating = 'Rất Tốt';
          bedScore = 95;
          bedDesc = `Sơn tinh <strong>${son === saoVuongKhi ? 'Vượng Khí' : 'Sinh Khí'} (${son})</strong> chủ về nhân đinh, sức khỏe an khang, gia đạo hòa hợp, con cái hiếu thuận và vượng tài.`;
          bedBadges.push({ text: 'Đắc địa', type: 'success' });
        } else if (saoBaoSat.includes(son)) {
          bedRating = 'Rất Xấu';
          bedScore = 15;
          bedDesc = `Sơn tinh phạm <strong>${son === 2 ? 'Nhị Hắc Bệnh Phù (2)' : 'Ngũ Hoàng Sát (5)'}</strong>. Người ngủ tại cung này dễ ốm đau triền miên, mất ngủ, thần kinh căng thẳng. Cần đặt hồ lô đồng hóa giải.`;
          bedBadges.push({ text: 'Đại kỵ', type: 'danger' });
        } else if (saoCatTinh.includes(son)) {
          bedRating = 'Tốt';
          bedScore = 80;
          bedDesc = `Sơn tinh cát lành (${son}). Rất phù hợp bố trí phòng ngủ cho gia chủ và các thành viên.`;
          bedBadges.push({ text: 'Nên đặt', type: 'primary' });
        } else {
          bedRating = 'Bình';
          bedScore = 50;
          bedDesc = `Sơn tinh (${son}) thoái khí. Cần kê đầu giường tựa vào vách tường kiên cố, tránh gió lùa.`;
        }

        analysis.bedrooms.push({
          palace: p, name, dir, son, huong, van,
          rating: bedRating, score: bedScore, desc: bedDesc, badges: bedBadges
        });
      }

      // --- 3. NHÀ BẾP (TÁO VỊ - THUỘC HỎA) ---
      if (!isCenter) {
        let kitchenRating = 'Bình';
        let kitchenScore = 50;
        let kitchenDesc = '';
        let kitchenBadges = [];

        // Kiểm tra Hỏa thiêu thiên môn ở Cung Càn
        const isHoaThieuThienMon = (name === 'Càn') && (son === 9 || huong === 9 || van === 9);

        if (isHoaThieuThienMon) {
          kitchenRating = 'Đại Kỵ (Hỏa Thiêu Thiên Môn)';
          kitchenScore = 5;
          kitchenDesc = `Phạm thế <strong>"Hỏa thiêu thiên môn"</strong> (Hỏa của bếp nung đốt Kim cung Càn - Tây Bắc). Cực kỳ bất lợi cho sức khỏe người cha/trưởng nam (bệnh đầu, phổi, huyết áp) và cản trở sự nghiệp. Tuyệt đối không đặt bếp tại đây!`;
          kitchenBadges.push({ text: 'Cấm đặt', type: 'danger' });
        } else if (saoBaoSat.includes(son)) {
          kitchenRating = 'Đại Kỵ';
          kitchenScore = 15;
          kitchenDesc = `Sơn tinh tọa bếp phạm <strong>${son === 2 ? 'Nhị Hắc (2)' : 'Ngũ Hoàng (5)'}</strong>. Lửa bếp sẽ nung nấu kích hoạt sát khí bệnh tật phát tác dữ dội. Tránh đặt bếp!`;
          kitchenBadges.push({ text: 'Đại kỵ', type: 'danger' });
        } else if ([1, 3, 4, 8, 9].includes(son)) {
          kitchenRating = 'Tốt';
          kitchenScore = 85;
          kitchenDesc = `Sơn tinh (${son}) cát lành hỗ trợ nhân đinh, gia đình hòa thuận, vượng tài lộc ấm no.`;
          kitchenBadges.push({ text: 'Nên đặt', type: 'success' });
        } else {
          kitchenRating = 'Bình';
          kitchenScore = 50;
          kitchenDesc = `Sơn tinh (${son}) trung bình. Có thể đặt bếp nếu các cung tốt khác đã ưu tiên cho phòng ngủ.`;
        }

        // Đánh giá hướng bếp (Hướng lưng người nấu nhìn về hướng tinh)
        let huongBepAdvice = '';
        if (huong === 1) {
          huongBepAdvice = `🌟 <strong>Hướng bếp cực cát:</strong> Quay lưng về hướng ${dir} (Hướng tinh 1 - Nhất Bạch Thủy) đạt thế <em>"Thủy Hỏa Ký Tế"</em> âm dương cân bằng hoàn hảo.`;
        } else if ([3, 4].includes(huong)) {
          huongBepAdvice = `🌿 <strong>Hướng bếp cát lành:</strong> Quay lưng về hướng ${dir} (Hướng tinh ${huong} - Mộc) được Mộc sinh Hỏa, bếp lửa ấm cúng, tài vận dồi dào.`;
        }

        analysis.kitchens.push({
          palace: p, name, dir, son, huong, van,
          rating: kitchenRating, score: kitchenScore, desc: kitchenDesc,
          huongAdvice: huongBepAdvice, badges: kitchenBadges
        });
      }

      // --- 4. CẦU THANG (ĐỘNG KHÍ LIÊN TẦNG) ---
      let stairRating = 'Bình';
      let stairScore = 50;
      let stairDesc = '';
      let stairBadges = [];

      if (isCenter) {
        // Trung Cung
        const hasDauNguuSat = (son === 3 && huong === 2) || (son === 2 && huong === 3);
        const hasXuyenTamSat = (son === 3 && huong === 7) || (son === 7 && huong === 3);

        if (hasDauNguuSat || hasXuyenTamSat) {
          stairRating = 'Đại Kỵ';
          stairScore = 10;
          stairDesc = `Trung Cung phạm <strong>${hasDauNguuSat ? 'Đấu Ngưu Sát [3-2]' : 'Xuyên Tâm Sát [3-7]'}</strong>. Đặt cầu thang ở giữa nhà sẽ kích hoạt cãi cọ, kiện tụng, tranh chấp và trộm cắp.`;
          stairBadges.push({ text: 'Đại kỵ', type: 'danger' });
        } else if (isHuongTinhNhapTu) {
          stairRating = 'Rất Tốt (Giải Nhập Tù)';
          stairScore = 90;
          stairDesc = `Trạch bàn bị thế <strong>"Lệnh tinh nhập tù"</strong> tại Trung Cung. Đặt cầu thang / giếng trời tại giữa nhà sẽ giúp động khí giải thoát vượng tinh, cứu vãn tài lộc cho ngôi nhà.`;
          stairBadges.push({ text: 'Nên đặt', type: 'success' });
        } else {
          stairRating = 'Lưu Ý';
          stairScore = 50;
          stairDesc = `Trung Cung nên giữ tĩnh và ổn định. Tránh đặt cầu thang xoắn ốc xuyên thẳng tim nhà làm phân tán khí lực.`;
        }
      } else {
        if (huong === saoVuongKhi || huong === saoSinhKhi_1) {
          stairRating = 'Rất Tốt';
          stairScore = 95;
          stairDesc = `Cầu thang động khí tại cung Hướng tinh sinh vượng <strong>(${huong})</strong> sẽ khuếch tán vượng khí tài lộc đi khắp các tầng trong nhà.`;
          stairBadges.push({ text: 'Đắc tài', type: 'success' });
        } else if (saoBaoSat.includes(huong)) {
          stairRating = 'Cực Hung';
          stairScore = 15;
          stairDesc = `Hướng tinh phạm sát tinh <strong>${huong === 2 ? 'Nhị Hắc (2)' : 'Ngũ Hoàng (5)'}</strong>. Cầu thang động khí sẽ phát tán sát khí bệnh tật, tai ách lan tỏa khắp các phòng. Tránh đặt cầu thang tại đây!`;
          stairBadges.push({ text: 'Cực hung', type: 'danger' });
        } else {
          stairRating = 'Bình';
          stairScore = 50;
          stairDesc = `Hướng tinh (${huong}) trung bình. Bố trí cầu thang gọn gàng, đón sáng tốt.`;
        }
      }

      analysis.stairs.push({
        palace: p, name, dir, son, huong, van,
        rating: stairRating, score: stairScore, desc: stairDesc, badges: stairBadges
      });

      // --- 5. NHÀ VỆ SINH & BỂ PHỐT (UẾ KHÍ) ---
      let wcRating = 'Bình';
      let wcScore = 50;
      let wcDesc = '';
      let wcBadges = [];

      const isVanXuong = (son === 1 && huong === 4) || (son === 4 && huong === 1);

      if (isCenter) {
        wcRating = 'Cấm Tuyệt Đối';
        wcScore = 0;
        wcDesc = `<strong>Đại kỵ số 1 trong phong thủy:</strong> Nhà vệ sinh đặt tại Trung Cung (giữa nhà) làm ô uế tim nhà, phát tán xú khí khắp 8 cung, gây tổn hại nặng nề đến sức khỏe và tài vận của cả gia đình.`;
        wcBadges.push({ text: 'Tuyệt đối cấm', type: 'danger' });
      } else if (isVanXuong) {
        wcRating = 'Cấm (Ô Uế Văn Xương)';
        wcScore = 5;
        wcDesc = `Cung vị đắc tổ hợp <strong>Văn Xương cát khí [1-4]</strong>. Đặt WC tại đây sẽ làm ô uế cung học hành, thi cử, danh tiếng của con cái bị suy bại.`;
        wcBadges.push({ text: 'Cấm đặt', type: 'danger' });
      } else if (name === 'Càn') {
        wcRating = 'Không Khuyến Khích';
        wcScore = 30;
        wcDesc = `Cung Càn là Thiên Môn đại diện cho người cha và vận khí chủ nhà. Đặt WC tại Càn dễ gây tổn hại sức khỏe và tài vận người đàn ông trụ cột.`;
        wcBadges.push({ text: 'Hạn chế', type: 'warning' });
      } else if (name === 'Khôn') {
        wcRating = 'Không Khuyến Khích';
        wcScore = 30;
        wcDesc = `Cung Khôn đại diện cho người mẹ/phụ nữ trong nhà. Đặt WC tại Khôn dễ ảnh hưởng tiêu cực đến sức khỏe người phụ nữ.`;
        wcBadges.push({ text: 'Hạn chế', type: 'warning' });
      } else if (saoSuyTu.includes(son) && saoSuyTu.includes(huong)) {
        wcRating = 'Rất Tốt (Dĩ Độc Trị Độc)';
        wcScore = 95;
        wcDesc = `Sơn tinh (${son}) và Hướng tinh (${huong}) đều là sao suy tử/thoái khí. Đặt WC tại đây dùng nước thải cuốn trôi sát khí ra ngoài, <em>"Dĩ độc trị độc"</em> biến hung thành cát.`;
        wcBadges.push({ text: 'Rất hợp đặt', type: 'success' });
      } else if (saoBaoSat.includes(son) || saoBaoSat.includes(huong)) {
        wcRating = 'Tốt (Đè Nén Hung Tinh)';
        wcScore = 80;
        wcDesc = `Cung vị có sát tinh (${son === 2 || huong === 2 ? 'Nhị Hắc' : 'Ngũ Hoàng'}). Đặt WC tại đây để trấn áp, triệt tiêu hung khí của sát tinh.`;
        wcBadges.push({ text: 'Trấn sát', type: 'success' });
      } else {
        wcRating = 'Bình';
        wcScore = 50;
        wcDesc = `Cần giữ gìn nhà vệ sinh luôn khô ráo, sạch sẽ và có quạt hút gió đóng kín cửa.`;
      }

      analysis.toilets.push({
        palace: p, name, dir, son, huong, van,
        rating: wcRating, score: wcScore, desc: wcDesc, badges: wcBadges
      });

      // --- 6. PHÒNG HỌC, LÀM VIỆC & PHÒNG THỜ ---
      if (!isCenter) {
        // Phòng học / Bàn làm việc (Văn Xương)
        if (isVanXuong) {
          analysis.studies.push({
            palace: p, name, dir, son, huong, van,
            rating: 'Cực Tốt (Văn Xương Đắc Vị)',
            score: 100,
            desc: `Cung vị có tổ hợp sao <strong>Văn Xương [1-4]</strong> tuyệt hảo. Bố trí bàn học, bàn làm việc, tủ sách tại đây sẽ kích hoạt trí tuệ, thi cử đỗ đạt, công danh thăng tiến rực rỡ.`,
            badges: [{ text: 'Văn Xương Đắc Vị', type: 'success' }]
          });
        } else if ([1, 4, 6].includes(son) || [1, 4, 6].includes(huong)) {
          analysis.studies.push({
            palace: p, name, dir, son, huong, van,
            rating: 'Tốt',
            score: 80,
            desc: `Cung vị có sao Trí tuệ - Công danh (${son}/${huong}). Thích hợp đặt bàn học hoặc không gian làm việc tĩnh tâm.`,
            badges: [{ text: 'Khuyến nghị', type: 'primary' }]
          });
        }

        // Phòng thờ (Cần thanh tịnh, tôn nghiêm)
        if (son === saoVuongKhi || saoCatTinh.includes(son)) {
          analysis.altars.push({
            palace: p, name, dir, son, huong, van,
            rating: son === saoVuongKhi ? 'Xuất Sắc' : 'Tốt',
            score: son === saoVuongKhi ? 95 : 80,
            desc: `Sơn tinh cát lành <strong>(${son})</strong> hỗ trợ linh khí gia tiên, gia đạo êm ấm bình an, phúc lộc trường tồn. Tránh đặt đối diện WC hoặc bếp lò.`,
            badges: [{ text: son === saoVuongKhi ? 'Trang trọng nhất' : 'Thanh tịnh', type: 'success' }]
          });
        }
      }

      // --- 7. TỔNG HỢP CUNG VỊ ---
      analysis.palaceSummaries[p] = {
        palace: p, name, dir, son, huong, van, isCenter,
        door: analysis.doors.find(d => d.palace === p),
        bedroom: analysis.bedrooms.find(b => b.palace === p),
        kitchen: analysis.kitchens.find(k => k.palace === p),
        stair: analysis.stairs.find(s => s.palace === p),
        toilet: analysis.toilets.find(t => t.palace === p),
        study: analysis.studies.find(st => st.palace === p),
        altar: analysis.altars.find(a => a.palace === p)
      };
    }

    // Sắp xếp các danh sách theo điểm số giảm dần để người dùng dễ nhìn vị trí tốt nhất
    const sortByScore = (a, b) => b.score - a.score;
    analysis.doors.sort(sortByScore);
    analysis.bedrooms.sort(sortByScore);
    analysis.kitchens.sort(sortByScore);
    analysis.stairs.sort(sortByScore);
    analysis.toilets.sort(sortByScore);
    analysis.studies.sort(sortByScore);
    analysis.altars.sort(sortByScore);

    return analysis;
  }

  /**
   * Tạo HTML hiển thị toàn bộ phần luận giải bố cục phong thủy
   * @param {Object} analysis - Kết quả từ analyzeFengShui()
   * @returns {string} HTML string
   */
  function renderInterpretationHTML(analysis) {
    if (!analysis) return '';

    const meta = analysis.meta;

    return `
      <div class="interp-header">
        <div class="interp-title-group">
          <span class="interp-badge-tag">Huyền Không Phi Tinh</span>
          <h3 class="interp-main-title">🏛️ Luận Giải & Gợi Ý Bố Cục Phong Thủy Nhà Ở</h3>
          <p class="interp-subtitle">Đánh giá cát hung 8 phương hướng cho các phòng ốc theo Tinh Bàn Vận ${meta.vanTrach}</p>
        </div>
      </div>

      <!-- Tóm tắt Khí Vận của Trạch Nhà -->
      <div class="interp-overview-bar">
        <div class="interp-stat-card stat-vuong">
          <span class="stat-icon">🌟</span>
          <div class="stat-info">
            <span class="stat-label">Vượng Khí (Tài lộc đỉnh cao)</span>
            <strong class="stat-val">Sao ${meta.saoVuongKhi}</strong>
          </div>
        </div>
        <div class="stat-divider"></div>
        <div class="interp-stat-card stat-sinh">
          <span class="stat-icon">🌿</span>
          <div class="stat-info">
            <span class="stat-label">Sinh Khí (Phát triển bền vững)</span>
            <strong class="stat-val">Sao ${meta.saoSinhKhi_1}</strong>
          </div>
        </div>
        <div class="stat-divider"></div>
        <div class="interp-stat-card stat-sat">
          <span class="stat-icon">⚠️</span>
          <div class="stat-info">
            <span class="stat-label">Đại Hung Sát (Bệnh tật, tai họa)</span>
            <strong class="stat-val">Sao 2 & 5</strong>
          </div>
        </div>
      </div>

      ${meta.isKiem ? `
        <div class="interp-alert-box alert-warn">
          <span class="alert-icon">⚠️</span>
          <div class="alert-content">
            <strong>Nhà phạm tuyến Kiêm Hướng / Không Vong:</strong> Khí trường ra vào có sự pha tạp. Cần đặc biệt chú ý an vị cửa chính và phòng ngủ đúng phương vị chính cung để thu nạp thuần khí.
          </div>
        </div>
      ` : ''}

      ${meta.isHuongTinhNhapTu ? `
        <div class="interp-alert-box alert-info">
          <span class="alert-icon">💡</span>
          <div class="alert-content">
            <strong>Trạch bàn bị "Lệnh Tinh Nhập Tù":</strong> Sao Vượng Hướng (${meta.vanTrach}) rơi vào Trung Cung. Nên bố trí giếng trời, cầu thang hoặc mở khoảng thông tầng ở giữa nhà để giải thoát vượng khí tài lộc.
          </div>
        </div>
      ` : ''}

      <!-- Bộ lọc Tabs chuyển đổi giữa các phòng ốc -->
      <div class="interp-tabs-container">
        <div class="interp-tabs-scroll">
          <button type="button" class="interp-tab active" data-tab="doors">🚪 Cửa Chính</button>
          <button type="button" class="interp-tab" data-tab="bedrooms">🛏️ Phòng Ngủ</button>
          <button type="button" class="interp-tab" data-tab="kitchens">🍳 Nhà Bếp</button>
          <button type="button" class="interp-tab" data-tab="stairs">🪜 Cầu Thang</button>
          <button type="button" class="interp-tab" data-tab="toilets">🚿 Nhà Vệ Sinh</button>
          <button type="button" class="interp-tab" data-tab="studies">📚 Học & Thờ Cúng</button>
          <button type="button" class="interp-tab" data-tab="all">🧭 Tổng Hợp 8 Hướng</button>
        </div>
      </div>

      <!-- Tab Content 1: Cửa Chính -->
      <div class="interp-tab-panel active" id="tab-doors">
        <div class="interp-guide-tip">
          🎯 <strong>Nguyên lý:</strong> Cửa chính (Đại Môn) là miệng nạp khí (Khí Khẩu) của toàn gia, quyết định 70% tài vận. Cần đặt tại cung có <strong>Hướng Tinh Vượng Khí (${meta.saoVuongKhi})</strong> hoặc <strong>Sinh Khí (${meta.saoSinhKhi_1})</strong>; tối kỵ Hướng Tinh 2, 5.
        </div>
        <div class="interp-cards-grid">
          ${analysis.doors.map(d => renderCardItem(d, 'Cửa Chính', `Hướng Tinh [${d.huong}]`)).join('')}
        </div>
      </div>

      <!-- Tab Content 2: Phòng Ngủ -->
      <div class="interp-tab-panel" id="tab-bedrooms">
        <div class="interp-guide-tip">
          🎯 <strong>Nguyên lý:</strong> <em>"Sơn quản nhân đinh, Thủy quản tài lộc"</em>. Phòng ngủ cần không gian tĩnh, ưu tiên cung có <strong>Sơn Tinh Vượng (${meta.saoVuongKhi}, ${meta.saoSinhKhi_1}, Cát tinh 1, 6, 8, 9)</strong> để bồi dưỡng sức khỏe, hòa khí vợ chồng và sinh con hiếu thuận.
        </div>
        <div class="interp-cards-grid">
          ${analysis.bedrooms.map(b => renderCardItem(b, 'Phòng Ngủ', `Sơn Tinh [${b.son}]`)).join('')}
        </div>
      </div>

      <!-- Tab Content 3: Nhà Bếp -->
      <div class="interp-tab-panel" id="tab-kitchens">
        <div class="interp-guide-tip">
          🎯 <strong>Nguyên lý:</strong> Bếp mang Hỏa khí nung nấu. Tọa độ đặt bếp (Tọa bếp) cần nằm ở cung Sơn tinh cát lành (1, 3, 4, 8, 9); đại kỵ cung Càn (Hỏa thiêu thiên môn) và cung có sao 2, 5. Hướng lưng người nấu quay về Hướng tinh 1 (Thủy Hỏa ký tế) hoặc 3, 4 (Mộc sinh Hỏa) là đại cát.
        </div>
        <div class="interp-cards-grid">
          ${analysis.kitchens.map(k => renderCardItem(k, 'Nhà Bếp', `Tọa Sơn [${k.son}]`, k.huongAdvice)).join('')}
        </div>
      </div>

      <!-- Tab Content 4: Cầu Thang -->
      <div class="interp-tab-panel" id="tab-stairs">
        <div class="interp-guide-tip">
          🎯 <strong>Nguyên lý:</strong> Cầu thang dẫn khí liên tầng (Động khí liên tục). Cần bố trí tại cung có <strong>Hướng Tinh Vượng Khí</strong> để khuếch tán tài lộc lên các tầng; tránh tuyệt đối Hướng tinh 2, 5 để không phát tán sát khí bệnh tật.
        </div>
        <div class="interp-cards-grid">
          ${analysis.stairs.map(s => renderCardItem(s, 'Cầu Thang', `Hướng Tinh [${s.huong}]`)).join('')}
        </div>
      </div>

      <!-- Tab Content 5: Nhà Vệ Sinh -->
      <div class="interp-tab-panel" id="tab-toilets">
        <div class="interp-guide-tip">
          🎯 <strong>Nguyên lý:</strong> <em>"Dĩ độc trị độc"</em> – Nhà vệ sinh nên đặt tại các cung có Sơn Tinh & Hướng Tinh đều suy tử thoái khí để dòng nước cuốn trôi sát khí. Cấm tuyệt đối đặt giữa nhà (Trung Cung), cấm cung Văn Xương [1-4] và hạn chế cung Càn (Tây Bắc), Khôn (Tây Nam).
        </div>
        <div class="interp-cards-grid">
          ${analysis.toilets.map(t => renderCardItem(t, 'Nhà Vệ Sinh', `Sơn [${t.son}] - Hướng [${t.huong}]`)).join('')}
        </div>
      </div>

      <!-- Tab Content 6: Phòng Học & Phòng Thờ -->
      <div class="interp-tab-panel" id="tab-studies">
        <div class="interp-study-section">
          <h4 class="interp-group-heading">📚 Vị Trí Đặt Bàn Học & Phòng Làm Việc (Văn Xương Tinh)</h4>
          <div class="interp-cards-grid">
            ${analysis.studies.length > 0 ? 
              analysis.studies.map(st => renderCardItem(st, 'Góc Học Tập', `Tổ hợp sao [${st.son}-${st.huong}]`)).join('') :
              '<p class="empty-tip">Các cung hướng khác có thể bố trí bàn học theo hướng hợp mệnh gia chủ.</p>'
            }
          </div>

          <h4 class="interp-group-heading" style="margin-top: 24px;">🕯️ Vị Trí Đặt Phòng Thờ / Bàn Thờ (Tôn Nghiêm & Thanh Tịnh)</h4>
          <div class="interp-cards-grid">
            ${analysis.altars.length > 0 ?
              analysis.altars.map(a => renderCardItem(a, 'Bàn Thờ', `Sơn Tinh [${a.son}]`)).join('') :
              '<p class="empty-tip">Ưu tiên vị trí cao ráo, thanh tịnh, tránh gió lùa và xa khu vệ sinh.</p>'
            }
          </div>
        </div>
      </div>

      <!-- Tab Content 7: Tổng Hợp 8 Hướng -->
      <div class="interp-tab-panel" id="tab-all">
        <div class="interp-all-grid">
          ${[1, 2, 3, 4, 6, 7, 8, 9].map(p => renderPalaceOverview(analysis.palaceSummaries[p])).join('')}
        </div>
      </div>
    `;
  }

  function renderCardItem(item, category, starLabel, extraAdvice) {
    let ratingClass = 'rate-binh';
    let ratingIcon = '⚪';

    if (item.rating.includes('Xuất Sắc') || item.rating.includes('Rất Tốt') || item.rating.includes('Cực Tốt') || item.rating.includes('Dĩ Độc Trị Độc')) {
      ratingClass = 'rate-tot';
      ratingIcon = '🟢';
    } else if (item.rating.includes('Tốt') || item.rating.includes('Cát')) {
      ratingClass = 'rate-cat';
      ratingIcon = '🔵';
    } else if (item.rating.includes('Lưu Ý') || item.rating.includes('Không Khuyến Khích') || item.rating.includes('Hạn Chế')) {
      ratingClass = 'rate-warn';
      ratingIcon = '🟡';
    } else if (item.rating.includes('Đại Kỵ') || item.rating.includes('Rất Xấu') || item.rating.includes('Cực Hung') || item.rating.includes('Cấm')) {
      ratingClass = 'rate-xau';
      ratingIcon = '🔴';
    }

    return `
      <div class="interp-card ${ratingClass}">
        <div class="card-top">
          <div class="card-loc">
            <span class="card-dir-name">${item.dir}</span>
            <span class="card-pal-name">(${item.name})</span>
          </div>
          <div class="card-stars-tag">${starLabel}</div>
          <div class="card-rating-badge">
            <span class="rate-dot">${ratingIcon}</span>
            <span class="rate-text">${item.rating}</span>
          </div>
        </div>
        
        <div class="card-body">
          <p class="card-desc">${item.desc}</p>
          ${extraAdvice ? `<div class="card-extra-advice">${extraAdvice}</div>` : ''}
        </div>

        ${item.badges && item.badges.length > 0 ? `
          <div class="card-footer-badges">
            ${item.badges.map(b => `<span class="badge-pill badge-${b.type}">${b.text}</span>`).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  function renderPalaceOverview(pal) {
    if (!pal) return '';

    return `
      <div class="palace-overview-card">
        <div class="pal-card-header">
          <div class="pal-title-row">
            <strong class="pal-dir-tag">${pal.dir} (${pal.name})</strong>
            <div class="pal-stars-display">
              <span class="star-pill-son" title="Sơn Tinh">Sơn: ${pal.son}</span>
              <span class="star-pill-huong" title="Hướng Tinh">Hướng: ${pal.huong}</span>
              <span class="star-pill-van" title="Vận Tinh">Vận: ${pal.van}</span>
            </div>
          </div>
        </div>
        
        <div class="pal-items-list">
          ${pal.door ? `<div class="pal-item-row"><span class="item-name">🚪 Cửa chính:</span> <span class="item-status ${getStatusClass(pal.door.rating)}">${pal.door.rating}</span></div>` : ''}
          ${pal.bedroom ? `<div class="pal-item-row"><span class="item-name">🛏️ Phòng ngủ:</span> <span class="item-status ${getStatusClass(pal.bedroom.rating)}">${pal.bedroom.rating}</span></div>` : ''}
          ${pal.kitchen ? `<div class="pal-item-row"><span class="item-name">🍳 Bếp nấu:</span> <span class="item-status ${getStatusClass(pal.kitchen.rating)}">${pal.kitchen.rating}</span></div>` : ''}
          ${pal.stair ? `<div class="pal-item-row"><span class="item-name">🪜 Cầu thang:</span> <span class="item-status ${getStatusClass(pal.stair.rating)}">${pal.stair.rating}</span></div>` : ''}
          ${pal.toilet ? `<div class="pal-item-row"><span class="item-name">🚿 Vệ sinh:</span> <span class="item-status ${getStatusClass(pal.toilet.rating)}">${pal.toilet.rating}</span></div>` : ''}
          ${pal.study ? `<div class="pal-item-row"><span class="item-name">📚 Bàn học:</span> <span class="item-status status-good">Văn Xương Đắc Vị</span></div>` : ''}
          ${pal.altar ? `<div class="pal-item-row"><span class="item-name">🕯️ Bàn thờ:</span> <span class="item-status status-good">Thanh tịnh</span></div>` : ''}
        </div>
      </div>
    `;
  }

  function getStatusClass(rating) {
    if (!rating) return '';
    if (rating.includes('Xuất Sắc') || rating.includes('Rất Tốt') || rating.includes('Cực Tốt') || rating.includes('Dĩ Độc Trị Độc')) return 'status-good';
    if (rating.includes('Tốt') || rating.includes('Cát')) return 'status-primary';
    if (rating.includes('Lưu Ý') || rating.includes('Không Khuyến Khích')) return 'status-warn';
    if (rating.includes('Đại Kỵ') || rating.includes('Rất Xấu') || rating.includes('Cực Hung') || rating.includes('Cấm')) return 'status-danger';
    return 'status-neutral';
  }

  /**
   * Khởi tạo và gắn sự kiện cho các tab trong phần luận giải
   */
  function initInterpretationTabs() {
    const tabButtons = document.querySelectorAll('.interp-tab');
    const tabPanels = document.querySelectorAll('.interp-tab-panel');

    tabButtons.forEach(btn => {
      btn.addEventListener('click', function() {
        const targetId = this.dataset.tab;
        
        tabButtons.forEach(b => b.classList.remove('active'));
        tabPanels.forEach(p => p.classList.remove('active'));

        this.classList.add('active');
        const targetPanel = document.getElementById('tab-' + targetId);
        if (targetPanel) {
          targetPanel.classList.add('active');
        }
      });
    });
  }

  // Xuất module ra phạm vi toàn cục
  window.FengShuiRules = {
    analyze: analyzeFengShui,
    renderHTML: renderInterpretationHTML,
    initTabs: initInterpretationTabs
  };

})();
