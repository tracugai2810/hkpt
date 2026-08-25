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

    // 1. Phân loại Cát - Hung của các Sao theo Vận Trạch hiện tại
    const saoVuongKhi = vanTrach;
    const saoSinhKhi_1 = (vanTrach % 9) + 1;
    const saoSinhKhi_2 = (saoSinhKhi_1 % 9) + 1;
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
        saoSinhKhi_2,
        saoBaoSat,
        saoCatTinh,
        saoSuyTu,
        isKiem,
        facingDegree,
        isHuongTinhNhapTu,
        isSonTinhNhapTu
      },
      doors: [],       // 1. Cửa chính (Đại Môn)
      livingRooms: [], // 2. Phòng khách
      balconies: [],   // 3. Ban công / Cửa sổ lớn
      bedrooms: [],    // 4. Phòng ngủ & Giường
      kitchens: [],    // 5. Nhà bếp
      stairs: [],      // 6. Cầu thang & Giếng trời
      toilets: [],     // 7. Nhà vệ sinh & Bể phốt
      studies: [],     // 8. Bàn học (Văn Xương)
      altars: [],      // 8. Bàn thờ (Thần Vị)
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

      // --- 1. CỬA CHÍNH (ĐẠI MÔN / KHÍ KHẨU CHÍNH) ---
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
          doorDesc += ` <span class="rule-warn-inline">⚠️ Nhà kiêm hướng: Cửa chính dễ bị tạp khí, cần an vị cửa chuẩn độ số chính hướng.</span>`;
          doorScore -= 20;
        }

        analysis.doors.push({
          palace: p, name, dir, son, huong, van,
          rating: doorRating, score: doorScore, desc: doorDesc, badges: doorBadges
        });
      }

      // --- 2. PHÒNG KHÁCH (KHÔNG GIAN ĐỘNG / SINH HOẠT CHUNG) ---
      if (!isCenter) {
        let lrRating = 'Bình';
        let lrScore = 50;
        let lrDesc = '';
        let lrBadges = [];

        const has25Combination = (son === 2 && huong === 5) || (son === 5 && huong === 2);

        if (has25Combination) {
          lrRating = 'Đại Kỵ';
          lrScore = 10;
          lrDesc = `Cung vị phạm tổ hợp <strong>Nhị Hắc - Ngũ Hoàng [2-5]</strong> cực độc. Bố trí phòng khách tại đây sẽ kích hoạt sát khí khi cả nhà tụ họp, gây tranh chấp, bất hòa, đau ốm triền miên.`;
          lrBadges.push({ text: 'Tránh đặt', type: 'danger' });
        } else if (huong === saoVuongKhi) {
          lrRating = 'Xuất Sắc';
          lrScore = 100;
          lrDesc = `Hướng tinh nạp <strong>Vượng Khí (${huong})</strong> của Vận ${vanTrach}. Không gian phòng khách động khí sẽ kích hoạt tài lộc tối đa, thu hút quý nhân và khách quý.`;
          lrBadges.push({ text: 'Đắc tài lộc', type: 'success' });
        } else if (huong === saoSinhKhi_1) {
          lrRating = 'Tốt';
          lrScore = 85;
          lrDesc = `Hướng tinh nạp <strong>Sinh Khí (${huong})</strong>. Phòng khách sinh khí dồi dào, gia đình vui vẻ, sự nghiệp phát triển.`;
          lrBadges.push({ text: 'Nên đặt', type: 'primary' });
        } else if (saoBaoSat.includes(huong)) {
          lrRating = 'Xấu (Phạm Sát Tinh)';
          lrScore = 25;
          lrDesc = `Hướng tinh phạm ${huong === 2 ? 'Nhị Hắc (2)' : 'Ngũ Hoàng (5)'}. Cần đặt vật phẩm hành Kim (hồ lô đồng, đèn đồng) để hóa giải sát khí.`;
          lrBadges.push({ text: 'Cần hóa giải', type: 'danger' });
        } else if (saoCatTinh.includes(huong)) {
          lrRating = 'Cát';
          lrScore = 75;
          lrDesc = `Hướng tinh cát lành (${huong}). Phù hợp bố trí phòng khách sáng sủa, ấm cúng.`;
          lrBadges.push({ text: 'Tốt', type: 'success' });
        } else {
          lrRating = 'Bình';
          lrScore = 50;
          lrDesc = `Hướng tinh (${huong}) thoái khí. Bố trí phòng khách cần tăng cường ánh sáng tự nhiên và cây xanh hợp mệnh.`;
        }

        analysis.livingRooms.push({
          palace: p, name, dir, son, huong, van,
          rating: lrRating, score: lrScore, desc: lrDesc, badges: lrBadges
        });
      }

      // --- 3. BAN CÔNG / CỬA SỔ LỚN (KHÍ KHẨU PHỤ / VIEW CHÍNH) ---
      if (!isCenter) {
        let balRating = 'Bình';
        let balScore = 50;
        let balDesc = '';
        let balBadges = [];

        if (huong === saoVuongKhi) {
          balRating = 'Xuất Sắc';
          balScore = 100;
          balDesc = `Đón trọn <strong>Vượng Khí (${huong})</strong> của Vận ${vanTrach}. Ban công/cửa sổ lớn mở tại đây sẽ đón nắng, gió và tài lộc cực vượng vào nhà (đặc biệt quan trọng với chung cư, nhà phố).`;
          balBadges.push({ text: 'Đón đại tài', type: 'success' });
        } else if (huong === saoSinhKhi_1) {
          balRating = 'Tốt';
          balScore = 85;
          balDesc = `Đón <strong>Sinh Khí (${huong})</strong> cát lành. Không gian thoáng đãng, mang lại sinh khí tươi mới và sức sống bền vững.`;
          balBadges.push({ text: 'Rất tốt', type: 'primary' });
        } else if (saoBaoSat.includes(huong)) {
          balRating = 'Đại Kỵ';
          balScore = 15;
          balDesc = `Phương vị có sát tinh <strong>${huong === 2 ? 'Nhị Hắc (2)' : 'Ngũ Hoàng (5)'}</strong>. Mở ban công lớn/cửa sổ tại đây dễ hút uế khí, sát khí vào nhà. Nên buông rèm hoặc treo chuông gió đồng 6 ống để hóa giải.`;
          balBadges.push({ text: 'Hút sát khí', type: 'danger' });
        } else if (saoCatTinh.includes(huong)) {
          balRating = 'Cát';
          balScore = 75;
          balDesc = `Đón cát tinh (${huong}). Ban công đón gió mát, vượng khí cho phòng sinh hoạt.`;
          balBadges.push({ text: 'Khá tốt', type: 'success' });
        } else {
          balRating = 'Bình';
          balScore = 50;
          balDesc = `Hướng tinh (${huong}) thoái khí. Mở cửa sổ đón sáng bình thường, nên trồng cây cảnh lọc khí.`;
        }

        analysis.balconies.push({
          palace: p, name, dir, son, huong, van,
          rating: balRating, score: balScore, desc: balDesc, badges: balBadges
        });
      }

      // --- 4. PHÒNG NGỦ & ĐẦU GIƯỜNG (CHỦ VỊ / SÀNG VỊ - TĨNH KHÍ) ---
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

      // --- 5. NHÀ BẾP (TÁO VỊ - THUỘC HỎA) ---
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

      // --- 6. CẦU THANG & GIẾNG TRỜI (ĐỘNG KHÍ LIÊN TẦNG & TRỤC DẪN KHÍ) ---
      let stairRating = 'Bình';
      let stairScore = 50;
      let stairDesc = '';
      let stairBadges = [];

      if (isCenter) {
        // Trung Cung
        const hasDauNguuSat = (son === 3 && huong === 2) || (son === 2 && huong === 3);
        const hasXuyenTamSat = (son === 3 && huong === 7) || (son === 7 && huong === 3);
        const has25Sat = (son === 2 && huong === 5) || (son === 5 && huong === 2);

        if (has25Sat || hasDauNguuSat || hasXuyenTamSat) {
          stairRating = 'Đại Kỵ';
          stairScore = 10;
          stairDesc = `Trung Cung phạm <strong>${has25Sat ? 'Nhị Hắc - Ngũ Hoàng [2-5]' : hasDauNguuSat ? 'Đấu Ngưu Sát [3-2]' : 'Xuyên Tâm Sát [3-7]'}</strong>. Đặt cầu thang/giếng trời ở giữa nhà sẽ tán phát sát khí, tranh chấp, bệnh tật lan tỏa đi khắp các tầng.`;
          stairBadges.push({ text: 'Đại kỵ', type: 'danger' });
        } else if (isHuongTinhNhapTu || isSonTinhNhapTu) {
          stairRating = 'Rất Tốt (Giải Lệnh Tinh Nhập Tù)';
          stairScore = 95;
          stairDesc = `Trạch bàn bị thế <strong>"Lệnh tinh nhập tù"</strong> tại Trung Cung. Đặt giếng trời, khoảng thông tầng hoặc cầu thang tại giữa nhà sẽ giúp động khí giải thoát vượng tinh (${vanTrach}), cứu vãn tài lộc cho ngôi nhà.`;
          stairBadges.push({ text: 'Giải cứu tài vận', type: 'success' });
        } else {
          stairRating = 'Lưu Ý';
          stairScore = 50;
          stairDesc = `Trung Cung nên giữ tĩnh và ổn định. Tránh đặt cầu thang xoắn ốc xuyên thẳng tim nhà làm phân tán khí lực.`;
        }
      } else {
        if (huong === saoVuongKhi || huong === saoSinhKhi_1) {
          stairRating = 'Rất Tốt';
          stairScore = 95;
          stairDesc = `Cầu thang/thông tầng động khí tại cung Hướng tinh sinh vượng <strong>(${huong})</strong> sẽ khuếch tán vượng khí tài lộc đi khắp các tầng trong nhà.`;
          stairBadges.push({ text: 'Đắc tài khí', type: 'success' });
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

      // --- 7. NHÀ VỆ SINH & BỂ PHỐT (UẾ KHÍ) ---
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

      // --- 8. PHÒNG HỌC, LÀM VIỆC & PHÒNG THỜ ---
      if (!isCenter) {
        // Phòng học / Bàn làm việc (Văn Xương)
        let studyRating = 'Bình';
        let studyScore = 50;
        let studyDesc = '';
        let studyBadges = [];

        if (isVanXuong) {
          studyRating = 'Văn Xương Đắc Vị';
          studyScore = 100;
          studyDesc = `Cung vị đắc tổ hợp <strong>Văn Xương [1-4]</strong> tuyệt hảo. Bố trí bàn học, bàn làm việc, tủ sách tại đây sẽ kích hoạt trí tuệ hanh thông, thi cử đỗ đạt, công danh thăng tiến rực rỡ.`;
          studyBadges.push({ text: 'Văn Xương Đắc Vị', type: 'success' });
        } else if ([1, 4].includes(son) || [1, 4].includes(huong)) {
          studyRating = 'Tốt';
          studyScore = 80;
          studyDesc = `Cung vị có sao Trí tuệ (${[1, 4].filter(s => s === son || s === huong).join(', ')}). Rất tốt cho việc học tập, làm việc tập trung và tư duy sáng tạo.`;
          studyBadges.push({ text: 'Cát lợi', type: 'primary' });
        } else if (son === 6 || huong === 6) {
          studyRating = 'Khá Tốt';
          studyScore = 75;
          studyDesc = `Cung vị có sao Lục Bạch Kim (6) chủ về công danh, kỷ luật và sự nghiệp.`;
          studyBadges.push({ text: 'Vượng công danh', type: 'primary' });
        } else if (saoBaoSat.includes(son) || saoBaoSat.includes(huong)) {
          studyRating = 'Không Tốt (Phạm Sát)';
          studyScore = 25;
          studyDesc = `Cung vị phạm sát tinh (${son === 2 || huong === 2 ? 'Nhị Hắc' : 'Ngũ Hoàng'}). Người ngồi học dễ mệt mỏi, phân tâm, thành tích giảm sút.`;
          studyBadges.push({ text: 'Tránh đặt', type: 'danger' });
        } else {
          studyRating = 'Bình';
          studyScore = 50;
          studyDesc = `Cung vị trung bình, có thể bố trí bàn học nếu các cung tốt hơn đã ưu tiên cho phòng ngủ.`;
        }

        analysis.studies.push({
          palace: p, name, dir, son, huong, van,
          rating: studyRating, score: studyScore, desc: studyDesc, badges: studyBadges
        });

        // Phòng thờ (Cần thanh tịnh, tôn nghiêm)
        let altarRating = 'Bình';
        let altarScore = 50;
        let altarDesc = '';
        let altarBadges = [];

        if (son === saoVuongKhi) {
          altarRating = 'Xuất Sắc';
          altarScore = 95;
          altarDesc = `Sơn tinh <strong>Vượng Khí (${son})</strong>. Linh khí gia tiên che chở, phúc đức dồi dào, gia đạo an khang thịnh vượng.`;
          altarBadges.push({ text: 'Tối ưu nhất', type: 'success' });
        } else if (saoCatTinh.includes(son)) {
          altarRating = 'Tốt';
          altarScore = 80;
          altarDesc = `Sơn tinh cát lành (${son}) mang lại năng lượng thanh tịnh, tôn nghiêm và êm ấm cho gia đình.`;
          altarBadges.push({ text: 'Thanh tịnh', type: 'primary' });
        } else if (saoBaoSat.includes(son)) {
          altarRating = 'Tránh Đặt';
          altarScore = 20;
          altarDesc = `Sơn tinh phạm sát tinh (${son === 2 ? 'Nhị Hắc' : 'Ngũ Hoàng'}). Không nên đặt bàn thờ tại đây để tránh uế tạp nơi thờ cúng.`;
          altarBadges.push({ text: 'Tránh đặt', type: 'danger' });
        } else {
          altarRating = 'Bình';
          altarScore = 50;
          altarDesc = `Vị trí trung bình. Bàn thờ cần đặt nơi cao ráo, thanh tịnh, tránh đối diện WC hoặc bếp lò.`;
        }

        analysis.altars.push({
          palace: p, name, dir, son, huong, van,
          rating: altarRating, score: altarScore, desc: altarDesc, badges: altarBadges
        });
      }

      // --- TỔNG HỢP CUNG VỊ ---
      analysis.palaceSummaries[p] = {
        palace: p, name, dir, son, huong, van, isCenter,
        door: analysis.doors.find(d => d.palace === p),
        livingRoom: analysis.livingRooms.find(lr => lr.palace === p),
        balcony: analysis.balconies.find(b => b.palace === p),
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
    analysis.livingRooms.sort(sortByScore);
    analysis.balconies.sort(sortByScore);
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
    const v = meta.vanTrach;
    const sVuong = meta.saoVuongKhi;
    const sSinh = meta.saoSinhKhi_1;
    const sSat = meta.saoBaoSat.join(' & ');
    const sSuy = meta.saoSuyTu.join(', ');

    return `
      <div class="interp-header">
        <div class="interp-title-group">
          <span class="interp-badge-tag">Huyền Không Phi Tinh</span>
          <h3 class="interp-main-title">🏛️ Luận Giải & Bố Cục Phong Thủy Nhà Ở</h3>
          <p class="interp-subtitle">Hệ thống đánh giá cát hung 8 phương hướng theo Tinh Bàn Vận ${v}</p>
        </div>
      </div>

      <!-- Tóm tắt Khí Vận của Trạch Nhà (Tự động tính theo Vận) -->
      <div class="interp-overview-bar">
        <div class="interp-stat-card stat-vuong">
          <span class="stat-icon">🌟</span>
          <div class="stat-info">
            <span class="stat-label">Vượng Khí (Tài Lộc Đỉnh Cao)</span>
            <strong class="stat-val">Sao ${sVuong} (Vận ${v})</strong>
          </div>
        </div>
        <div class="stat-divider"></div>
        <div class="interp-stat-card stat-sinh">
          <span class="stat-icon">🌿</span>
          <div class="stat-info">
            <span class="stat-label">Sinh Khí (Phát Triển Bền Vững)</span>
            <strong class="stat-val">Sao ${sSinh}</strong>
          </div>
        </div>
        <div class="stat-divider"></div>
        <div class="interp-stat-card stat-sat">
          <span class="stat-icon">⚠️</span>
          <div class="stat-info">
            <span class="stat-label">Đại Hung Sát (Bệnh Tật, Tai Họa)</span>
            <strong class="stat-val">Sao ${sSat}</strong>
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
            <strong>Trạch bàn bị "Lệnh Tinh Nhập Tù":</strong> Sao Vượng Hướng (${sVuong}) rơi vào Trung Cung. Nên bố trí giếng trời, cầu thang hoặc mở khoảng thông tầng ở giữa nhà để giải thoát vượng khí tài lộc.
          </div>
        </div>
      ` : ''}

      <!-- Bộ lọc Tabs chuyển đổi các khu vực phong thủy -->
      <div class="interp-tabs-container">
        <div class="interp-tabs-scroll">
          <button type="button" class="interp-tab active" data-tab="doors">🚪 Cửa Chính</button>
          <button type="button" class="interp-tab" data-tab="living">🛋️ Phòng Khách</button>
          <button type="button" class="interp-tab" data-tab="balcony">🌅 Ban Công / Cửa Sổ</button>
          <button type="button" class="interp-tab" data-tab="bedrooms">🛏️ Phòng Ngủ</button>
          <button type="button" class="interp-tab" data-tab="kitchens">🍳 Nhà Bếp</button>
          <button type="button" class="interp-tab" data-tab="stairs">🪜 Cầu Thang / Giếng Trời</button>
          <button type="button" class="interp-tab" data-tab="toilets">🚿 Nhà Vệ Sinh</button>
          <button type="button" class="interp-tab" data-tab="studies">📚 Bàn Học / Làm Việc</button>
          <button type="button" class="interp-tab" data-tab="altars">🕯️ Phòng Thờ / Bàn Thờ</button>
          <button type="button" class="interp-tab" data-tab="all">🧭 Tổng Hợp 8 Cung</button>
        </div>
      </div>

      <!-- Tab 1: Cửa Chính -->
      <div class="interp-tab-panel active" id="tab-doors">
        <div class="interp-guide-tip">
          🎯 <strong>Nguyên lý (Vận ${v}):</strong> Cửa chính (Đại Môn) là Khí Khẩu chính nạp 70% tài vận. Cần đặt tại cung có <strong>Hướng Tinh Vượng Khí (Sao ${sVuong})</strong> hoặc <strong>Sinh Khí (Sao ${sSinh})</strong>. Đại kỵ mở cửa tại cung có Hướng Tinh là <strong>Sao ${sSat}</strong> (Sát khí) hoặc cung phạm Không Vong.
        </div>
        <div class="interp-cards-grid">
          ${analysis.doors.map(d => renderCardItem(d, 'Cửa Chính', `Hướng Tinh [${d.huong}]`)).join('')}
        </div>
      </div>

      <!-- Tab 2: Phòng Khách -->
      <div class="interp-tab-panel" id="tab-living">
        <div class="interp-guide-tip">
          🎯 <strong>Nguyên lý (Vận ${v}):</strong> Phòng khách là không gian sinh hoạt chung, người đi lại nhiều $\rightarrow$ thuộc trạng thái <strong>Động</strong>. Ưu tiên đặt tại cung có <strong>Hướng Tinh Vượng Khí (Sao ${sVuong})</strong> hoặc <strong>Sinh Khí (Sao ${sSinh})</strong> để kích hoạt tài lộc. Đại kỵ đặt tại cung có cặp sát tinh <strong>[2-5] hoặc [5-2]</strong> (gây bất hòa, đau ốm cho cả nhà).
        </div>
        <div class="interp-cards-grid">
          ${analysis.livingRooms.map(lr => renderCardItem(lr, 'Phòng Khách', `Hướng Tinh [${lr.huong}]`)).join('')}
        </div>
      </div>

      <!-- Tab 3: Ban Công / Cửa Sổ Lớn -->
      <div class="interp-tab-panel" id="tab-balcony">
        <div class="interp-guide-tip">
          🎯 <strong>Nguyên lý (Vận ${v}):</strong> Ban công và cửa sổ lớn là <strong>Khí Khẩu Phụ</strong> (nơi nạp sáng, đón gió và view chính, đặc biệt quan trọng với chung cư & nhà phố). Nên mở ở cung có <strong>Hướng Tinh Vượng Khí (Sao ${sVuong})</strong> hoặc <strong>Sinh Khí (Sao ${sSinh})</strong> để đón cát khí; tránh mở lớn tại cung có <strong>Sao ${sSat}</strong> để không hút sát khí.
        </div>
        <div class="interp-cards-grid">
          ${analysis.balconies.map(b => renderCardItem(b, 'Ban Công', `Hướng Tinh [${b.huong}]`)).join('')}
        </div>
      </div>

      <!-- Tab 4: Phòng Ngủ -->
      <div class="interp-tab-panel" id="tab-bedrooms">
        <div class="interp-guide-tip">
          🎯 <strong>Nguyên lý (Vận ${v}):</strong> <em>"Sơn quản nhân đinh, Thủy quản tài lộc"</em>. Phòng ngủ và vị trí đầu giường thuộc <strong>Tĩnh Khí</strong>, ưu tiên đặt tại cung có <strong>Sơn Tinh Vượng (Sao ${sVuong})</strong> hoặc <strong>Sinh Khí (Sao ${sSinh})</strong> để bồi bổ sức khỏe, gia đạo êm ấm. Đại kỵ đặt giường tại cung có Sơn Tinh là <strong>Sao ${sSat}</strong>.
        </div>
        <div class="interp-cards-grid">
          ${analysis.bedrooms.map(b => renderCardItem(b, 'Phòng Ngủ', `Sơn Tinh [${b.son}]`)).join('')}
        </div>
      </div>

      <!-- Tab 5: Nhà Bếp -->
      <div class="interp-tab-panel" id="tab-kitchens">
        <div class="interp-guide-tip">
          🎯 <strong>Nguyên lý (Vận ${v}):</strong> Bếp mang Hỏa khí nung nấu. Tọa độ đặt bếp (Tọa bếp) cần nằm ở cung Sơn Tinh cát lành (1, 3, 4, 8, 9); đại kỵ cung Càn (Hỏa thiêu thiên môn) và cung có Sơn Tinh <strong>Sao ${sSat}</strong>. Hướng bếp quay về Hướng Tinh <strong>Sao 1 (Thủy Hỏa Ký Tế)</strong> hoặc <strong>Sao 3, 4 (Mộc Sinh Hỏa)</strong> là đại cát.
        </div>
        <div class="interp-cards-grid">
          ${analysis.kitchens.map(k => renderCardItem(k, 'Nhà Bếp', `Tọa Sơn [${k.son}]`, k.huongAdvice)).join('')}
        </div>
      </div>

      <!-- Tab 6: Cầu Thang & Giếng Trời -->
      <div class="interp-tab-panel" id="tab-stairs">
        <div class="interp-guide-tip">
          🎯 <strong>Nguyên lý (Vận ${v}):</strong> Cầu thang & giếng trời là trục dẫn khí theo chiều thẳng đứng (Động khí liên tầng). Bố trí tại cung có <strong>Hướng Tinh Vượng Khí (Sao ${sVuong}, ${sSinh})</strong> để khuếch tán tài lộc; tránh Hướng Tinh <strong>Sao ${sSat}</strong>. Nếu đặt ở giữa nhà (Trung Cung), rất tốt khi cần giải thế <em>"Lệnh Tinh Nhập Tù"</em>, nhưng đại kỵ nếu Trung Cung phạm [2-5], [3-2] Đấu ngưu sát hay [3-7] Xuyên tâm sát.
        </div>
        <div class="interp-cards-grid">
          ${analysis.stairs.map(s => renderCardItem(s, 'Cầu Thang / Giếng Trời', `Hướng Tinh [${s.huong}]`)).join('')}
        </div>
      </div>

      <!-- Tab 7: Nhà Vệ Sinh -->
      <div class="interp-tab-panel" id="tab-toilets">
        <div class="interp-guide-tip">
          🎯 <strong>Nguyên lý (Vận ${v}):</strong> <em>"Dĩ độc trị độc"</em> – Nhà vệ sinh nên đặt tại các cung có cả Sơn Tinh & Hướng Tinh đều thuộc <strong>Sao Suy Tử (${sSuy})</strong> trong Vận ${v} để dòng nước cuốn trôi sát khí. Cấm tuyệt đối đặt giữa nhà (Trung Cung), cấm cung Văn Xương [1-4, 4-1] và hạn chế cung Càn (hại cha), Khôn (hại mẹ).
        </div>
        <div class="interp-cards-grid">
          ${analysis.toilets.map(t => renderCardItem(t, 'Nhà Vệ Sinh', `Sơn [${t.son}] - Hướng [${t.huong}]`)).join('')}
        </div>
      </div>

      <!-- Tab 8: Bàn Học & Phòng Làm Việc (Văn Xương) -->
      <div class="interp-tab-panel" id="tab-studies">
        <div class="interp-guide-tip">
          🎯 <strong>Nguyên lý:</strong> Bàn học / làm việc cần đặt tại phương vị <strong>Văn Xương Tinh [1-4] hoặc [4-1]</strong> để kích hoạt trí tuệ, đỗ đạt, công danh thăng tiến. Tránh đặt tại cung có sát tinh <strong>Sao ${sSat}</strong> làm phân tâm, giảm sút hiệu quả.
        </div>
        <div class="interp-cards-grid">
          ${analysis.studies.map(st => renderCardItem(st, 'Góc Học Tập', `Tổ hợp sao [${st.son}-${st.huong}]`)).join('')}
        </div>
      </div>

      <!-- Tab 9: Phòng Thờ / Bàn Thờ (Thần Vị) -->
      <div class="interp-tab-panel" id="tab-altars">
        <div class="interp-guide-tip">
          🎯 <strong>Nguyên lý:</strong> Bàn thờ (Thần Vị) là nơi linh thiêng tôn nghiêm, cần không gian tối tĩnh, tọa tại cung có <strong>Sơn Tinh cát lành (Sao ${sVuong} hoặc ${sCat})</strong> để gia đạo an khang, linh khí tổ tiên chở che. Tuyệt đối tránh nhìn thẳng hoặc tựa lưng vào nhà vệ sinh, bếp lò.
        </div>
        <div class="interp-cards-grid">
          ${analysis.altars.map(a => renderCardItem(a, 'Bàn Thờ', `Sơn Tinh [${a.son}]`)).join('')}
        </div>
      </div>

      <!-- Tab 10: Tổng Hợp 8 Cung -->
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
          ${pal.livingRoom ? `<div class="pal-item-row"><span class="item-name">🛋️ Phòng khách:</span> <span class="item-status ${getStatusClass(pal.livingRoom.rating)}">${pal.livingRoom.rating}</span></div>` : ''}
          ${pal.balcony ? `<div class="pal-item-row"><span class="item-name">🌅 Ban công / Cửa sổ:</span> <span class="item-status ${getStatusClass(pal.balcony.rating)}">${pal.balcony.rating}</span></div>` : ''}
          ${pal.bedroom ? `<div class="pal-item-row"><span class="item-name">🛏️ Phòng ngủ:</span> <span class="item-status ${getStatusClass(pal.bedroom.rating)}">${pal.bedroom.rating}</span></div>` : ''}
          ${pal.kitchen ? `<div class="pal-item-row"><span class="item-name">🍳 Bếp nấu:</span> <span class="item-status ${getStatusClass(pal.kitchen.rating)}">${pal.kitchen.rating}</span></div>` : ''}
          ${pal.stair ? `<div class="pal-item-row"><span class="item-name">🪜 Cầu thang:</span> <span class="item-status ${getStatusClass(pal.stair.rating)}">${pal.stair.rating}</span></div>` : ''}
          ${pal.toilet ? `<div class="pal-item-row"><span class="item-name">🚿 Vệ sinh:</span> <span class="item-status ${getStatusClass(pal.toilet.rating)}">${pal.toilet.rating}</span></div>` : ''}
          ${pal.study ? `<div class="pal-item-row"><span class="item-name">📚 Bàn học:</span> <span class="item-status ${getStatusClass(pal.study.rating)}">${pal.study.rating}</span></div>` : ''}
          ${pal.altar ? `<div class="pal-item-row"><span class="item-name">🕯️ Bàn thờ:</span> <span class="item-status ${getStatusClass(pal.altar.rating)}">${pal.altar.rating}</span></div>` : ''}
        </div>
      </div>
    `;
  }

  function getStatusClass(rating) {
    if (!rating) return '';
    if (rating.includes('Xuất Sắc') || rating.includes('Rất Tốt') || rating.includes('Cực Tốt') || rating.includes('Văn Xương') || rating.includes('Dĩ Độc Trị Độc')) return 'status-good';
    if (rating.includes('Tốt') || rating.includes('Cát') || rating.includes('Khá Tốt')) return 'status-primary';
    if (rating.includes('Lưu Ý') || rating.includes('Không Khuyến Khích') || rating.includes('Hạn Chế')) return 'status-warn';
    if (rating.includes('Đại Kỵ') || rating.includes('Rất Xấu') || rating.includes('Cực Hung') || rating.includes('Cấm') || rating.includes('Không Tốt') || rating.includes('Tránh Đặt') || rating.includes('Sát Tinh') || rating.includes('Phạm Sát')) return 'status-danger';
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
