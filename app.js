const CASES = [
  {
    id: 1,
    title: "Sốt và xuất huyết sau đi thực địa",
    diagnosis: "Sốt xuất huyết Dengue",
    aliases: ["dengue", "sot xuat huyet", "sot xuat huyet dengue", "sxh"],
    clues: [
      "Nam 21 tuổi, sinh viên y, sốt cao đột ngột 39,5 độ C kèm đau mỏi toàn thân sau 3 ngày đi thực địa tại miền Tây.",
      "Bệnh nhân đau đầu vùng hốc mắt, buồn nôn, không ho, không đau họng, không tiểu buốt.",
      "Khám có chấm xuất huyết rải rác hai cẳng chân, dấu dây thắt dương tính.",
      "Công thức máu: bạch cầu 2,8 G/L, tiểu cầu 92 G/L, hematocrit tăng nhẹ so với nền.",
      "Men gan tăng nhẹ, test NS1 dương tính vào ngày bệnh thứ 4.",
      "Điều trị chủ yếu là theo dõi dấu hiệu cảnh báo, bù dịch hợp lý và tránh NSAID."
    ],
    summary:
      "Sốt cao đột ngột, đau hốc mắt, giảm bạch cầu, giảm tiểu cầu, cô đặc máu và NS1 dương tính gợi ý sốt xuất huyết Dengue.",
    pearls: {
      "Dấu hiệu cảnh báo": "Đau bụng nhiều, nôn ói dai dẳng, lừ đừ, gan to, xuất huyết niêm mạc hoặc hematocrit tăng nhanh.",
      "Bẫy thường gặp": "Dùng ibuprofen hoặc aspirin để hạ sốt có thể làm tăng nguy cơ xuất huyết."
    }
  },
  {
    id: 2,
    title: "Khó thở kèm đau ngực kiểu màng phổi",
    diagnosis: "Thuyên tắc phổi",
    aliases: ["thuyen tac phoi", "pulmonary embolism", "pe"],
    clues: [
      "Nữ 33 tuổi khó thở đột ngột, đau ngực tăng khi hít sâu sau chuyến bay dài 12 giờ.",
      "Mạch 118 lần/phút, SpO2 91% khí phòng, phổi nghe gần như bình thường.",
      "Bệnh nhân đang dùng thuốc tránh thai phối hợp và có sưng đau bắp chân trái 2 ngày nay.",
      "Khí máu cho thấy kiềm hô hấp nhẹ; D-dimer tăng rõ.",
      "CTPA phát hiện khuyết thuốc cản quang ở nhánh động mạch phổi phải.",
      "Xử trí tùy nguy cơ: chống đông là nền tảng, tiêu sợi huyết khi huyết động không ổn định."
    ],
    summary:
      "Khó thở đột ngột, đau ngực kiểu màng phổi, nhịp nhanh và yếu tố nguy cơ huyết khối hướng đến thuyên tắc phổi.",
    pearls: {
      "Tư duy nhanh": "Phổi nghe bình thường không loại trừ thuyên tắc phổi.",
      "Điểm học thi": "Wells/Geneva giúp ước lượng xác suất trước xét nghiệm."
    }
  },
  {
    id: 3,
    title: "Đau thượng vị lan ra sau lưng",
    diagnosis: "Viêm tụy cấp",
    aliases: ["viem tuy cap", "acute pancreatitis"],
    clues: [
      "Nam 45 tuổi đau thượng vị dữ dội, lan ra sau lưng, giảm nhẹ khi ngồi cúi người.",
      "Bệnh nhân buồn nôn nhiều, uống rượu nặng trong tiệc tối hôm trước.",
      "Khám ấn đau thượng vị, bụng chướng nhẹ, không có phản ứng thành bụng rõ.",
      "Lipase máu tăng hơn 3 lần giới hạn trên bình thường.",
      "Siêu âm bụng ghi nhận sỏi túi mật nhỏ, đường mật không giãn.",
      "Điều trị ban đầu gồm bù dịch, giảm đau, dinh dưỡng sớm khi dung nạp và xử trí nguyên nhân."
    ],
    summary:
      "Đau thượng vị lan sau lưng kèm lipase tăng cao đủ tiêu chuẩn chẩn đoán viêm tụy cấp.",
    pearls: {
      "Nguyên nhân nhớ nhanh": "Sỏi mật và rượu là hai nguyên nhân thường gặp.",
      "Không nên quên": "Đánh giá mức độ nặng và dấu suy tạng trong 48 giờ đầu."
    }
  },
  {
    id: 4,
    title: "Phù và tiểu sẫm màu sau viêm họng",
    diagnosis: "Viêm cầu thận cấp hậu nhiễm liên cầu",
    aliases: ["viem cau than cap hau nhiem lien cau", "post streptococcal glomerulonephritis", "psgn"],
    clues: [
      "Bé trai 9 tuổi phù mi mắt buổi sáng và tiểu sẫm màu như nước trà.",
      "Hai tuần trước trẻ có viêm họng mủ, tự hết sau vài ngày.",
      "Huyết áp 145/92 mmHg, phù nhẹ hai chân, lượng nước tiểu giảm.",
      "Tổng phân tích nước tiểu có hồng cầu biến dạng, trụ hồng cầu và protein niệu mức vừa.",
      "ASO tăng, C3 giảm, chức năng thận tăng nhẹ creatinin.",
      "Điều trị chủ yếu hỗ trợ: hạn muối nước, lợi tiểu khi quá tải, kiểm soát huyết áp."
    ],
    summary:
      "Hội chứng viêm cầu thận sau viêm họng, nước tiểu màu cola, tăng huyết áp, C3 giảm và ASO tăng gợi ý PSGN.",
    pearls: {
      "Phân biệt": "Protein niệu thường không nặng như hội chứng thận hư.",
      "Theo dõi": "C3 thường trở về bình thường sau vài tuần; nếu kéo dài cần nghĩ chẩn đoán khác."
    }
  },
  {
    id: 5,
    title: "Sốt kéo dài và tiếng thổi mới",
    diagnosis: "Viêm nội tâm mạc nhiễm khuẩn",
    aliases: ["viem noi tam mac nhiem khuan", "infective endocarditis", "endocarditis"],
    clues: [
      "Nam 29 tuổi sốt nhẹ kéo dài 2 tuần, mệt mỏi, sụt cân và vã mồ hôi đêm.",
      "Bệnh nhân có tiền sử tiêm chích ma túy, gần đây đau lưng âm ỉ.",
      "Khám thấy tiếng thổi tâm thu mới ở bờ trái xương ức và vài nốt xuất huyết dưới móng.",
      "Cấy máu 2 mẫu mọc Staphylococcus aureus.",
      "Siêu âm tim qua thành ngực gợi ý sùi trên van ba lá.",
      "Cần kháng sinh tĩnh mạch kéo dài sau khi lấy cấy máu, đánh giá biến chứng và chỉ định ngoại khoa."
    ],
    summary:
      "Sốt kéo dài, yếu tố nguy cơ tiêm chích, cấy máu dương tính và sùi van tim phù hợp viêm nội tâm mạc nhiễm khuẩn.",
    pearls: {
      "Nguyên tắc": "Lấy nhiều mẫu cấy máu trước kháng sinh nếu người bệnh ổn định.",
      "Van ba lá": "Hay gặp hơn ở người tiêm chích, có thể gây thuyên tắc phổi nhiễm khuẩn."
    }
  },
  {
    id: 6,
    title: "Khát nhiều, thở nhanh và đau bụng",
    diagnosis: "Nhiễm toan ceton đái tháo đường",
    aliases: ["nhiem toan ceton dai thao duong", "dka", "diabetic ketoacidosis"],
    clues: [
      "Nữ 18 tuổi khát nhiều, tiểu nhiều, sụt 5 kg trong một tháng và mệt lả.",
      "Bệnh nhân đau bụng, nôn, thở sâu nhanh, hơi thở có mùi trái cây.",
      "Đường huyết mao mạch 32 mmol/L, mạch nhanh, da niêm khô.",
      "Khí máu: pH 7,12, HCO3- 8 mmol/L, khoảng trống anion tăng.",
      "Cetone máu dương tính mạnh, kali máu ban đầu 5,4 mmol/L.",
      "Điều trị gồm dịch truyền, insulin tĩnh mạch và theo dõi bù kali cẩn thận."
    ],
    summary:
      "Tăng đường huyết, toan chuyển hóa khoảng trống anion cao và cetone dương tính là bộ ba của DKA.",
    pearls: {
      "Kali": "Kali toàn cơ thể thường thiếu dù xét nghiệm ban đầu có thể tăng.",
      "Sai lầm hay gặp": "Bắt đầu insulin khi kali quá thấp có thể gây loạn nhịp nguy hiểm."
    }
  },
  {
    id: 7,
    title: "Ho ra máu và tổn thương thận",
    diagnosis: "Hội chứng Goodpasture",
    aliases: ["hoi chung goodpasture", "benh khang mang day cau than", "anti gbm disease"],
    clues: [
      "Nam 24 tuổi ho ra máu, khó thở tăng dần và mệt nhiều trong một tuần.",
      "Nước tiểu sẫm màu, phù nhẹ, huyết áp tăng.",
      "X-quang ngực có đám mờ hai phế trường gợi ý xuất huyết phế nang.",
      "Nước tiểu có trụ hồng cầu, creatinin tăng nhanh.",
      "Kháng thể anti-GBM dương tính; sinh thiết thận nhuộm miễn dịch dạng đường thẳng dọc màng đáy.",
      "Điều trị thường phối hợp thay huyết tương, corticosteroid và cyclophosphamide."
    ],
    summary:
      "Xuất huyết phế nang kèm viêm cầu thận tiến triển nhanh và anti-GBM dương tính là hội chứng Goodpasture.",
    pearls: {
      "Hình ảnh miễn dịch": "Lắng đọng IgG dạng đường thẳng giúp phân biệt với lupus hoặc IgA.",
      "Cấp cứu": "Điều trị sớm quyết định khả năng bảo tồn chức năng thận."
    }
  },
  {
    id: 8,
    title: "Sốt hậu sản và đau hạ vị",
    diagnosis: "Viêm nội mạc tử cung hậu sản",
    aliases: ["viem noi mac tu cung hau san", "postpartum endometritis", "endometritis"],
    clues: [
      "Sản phụ 27 tuổi sốt 38,8 độ C vào ngày thứ 3 sau sinh mổ.",
      "Bệnh nhân đau hạ vị, sản dịch hôi, tử cung co hồi chậm và ấn đau.",
      "Không đau vú, không tiểu buốt, vết mổ khô.",
      "Bạch cầu tăng, CRP tăng; cấy sản dịch có thể đa vi khuẩn.",
      "Yếu tố nguy cơ gồm sinh mổ, chuyển dạ kéo dài, vỡ ối lâu và nhiều lần thăm khám âm đạo.",
      "Kháng sinh phổ rộng đường tĩnh mạch như clindamycin phối hợp gentamicin thường được dùng."
    ],
    summary:
      "Sốt hậu sản sau sinh mổ, đau tử cung và sản dịch hôi phù hợp viêm nội mạc tử cung hậu sản.",
    pearls: {
      "Nguồn nhiễm": "Thường đa vi khuẩn, gồm kỵ khí đường sinh dục.",
      "Phân biệt": "Luôn rà soát thêm viêm vú, nhiễm trùng tiểu và nhiễm trùng vết mổ."
    }
  },
  {
    id: 9,
    title: "Đau đầu sét đánh",
    diagnosis: "Xuất huyết dưới nhện",
    aliases: ["xuat huyet duoi nhen", "subarachnoid hemorrhage", "sah"],
    clues: [
      "Nữ 52 tuổi đau đầu dữ dội đột ngột, mô tả là nặng nhất đời.",
      "Bệnh nhân nôn, sợ ánh sáng và cứng gáy nhẹ.",
      "Huyết áp 180/100 mmHg, không sốt, không tiền sử migraine tương tự.",
      "CT sọ không cản quang trong vài giờ đầu thấy máu ở rãnh cuộn não và bể nền.",
      "CTA phát hiện phình động mạch thông trước.",
      "Xử trí gồm hồi sức thần kinh, nimodipine, kiểm soát huyết áp và can thiệp kẹp hoặc coil túi phình."
    ],
    summary:
      "Đau đầu sét đánh kèm dấu màng não và máu trong khoang dưới nhện trên CT gợi ý xuất huyết dưới nhện.",
    pearls: {
      "Khi CT âm tính": "Nếu nghi ngờ cao, chọc dò dịch não tủy tìm hồng cầu/xanthochromia theo bối cảnh.",
      "Biến chứng": "Co thắt mạch não muộn là lý do dùng nimodipine."
    }
  },
  {
    id: 10,
    title: "Tiêu chảy sau kháng sinh",
    diagnosis: "Viêm đại tràng do Clostridioides difficile",
    aliases: ["viem dai trang do clostridioides difficile", "clostridium difficile", "c difficile", "c diff"],
    clues: [
      "Nam 68 tuổi tiêu chảy nước 8 lần/ngày sau điều trị ceftriaxone vì viêm phổi.",
      "Bệnh nhân đau quặn bụng, sốt nhẹ và mệt, không đi ngoài máu rõ.",
      "Khám bụng chướng nhẹ, ấn đau lan tỏa; bạch cầu 18 G/L.",
      "Xét nghiệm phân phát hiện độc tố C. difficile.",
      "Nội soi trong ca nặng có thể thấy giả mạc vàng trắng bám niêm mạc đại tràng.",
      "Điều trị ưu tiên hiện nay là fidaxomicin khi có điều kiện; vancomycin uống vẫn là lựa chọn chấp nhận được, đồng thời ngừng kháng sinh gây bệnh nếu có thể."
    ],
    summary:
      "Tiêu chảy sau kháng sinh, bạch cầu tăng và độc tố C. difficile dương tính gợi ý viêm đại tràng do C. difficile.",
    pearls: {
      "Đường dùng": "Vancomycin phải dùng đường uống để tác dụng tại lòng ruột trong bệnh này.",
      "Kiểm soát lây nhiễm": "Rửa tay bằng xà phòng và nước vì bào tử kháng cồn."
    }
  }
];

const MAX_CLUES = 6;

const SAMPLE_CARDS = [
  [11, "Đau hố chậu phải cấp", "Viêm ruột thừa cấp", ["viem ruot thua cap", "appendicitis"], ["Nam 19 tuổi đau quanh rốn rồi khu trú hố chậu phải.", "Buồn nôn, sốt nhẹ, chán ăn.", "Điểm McBurney đau, phản ứng thành bụng nhẹ.", "Bạch cầu tăng, CRP tăng."], "Đau di chuyển về hố chậu phải kèm sốt nhẹ và bạch cầu tăng gợi ý viêm ruột thừa cấp."],
  [12, "Đau quặn hạ sườn phải sau ăn", "Viêm túi mật cấp", ["viem tui mat cap", "acute cholecystitis"], ["Nữ 46 tuổi đau hạ sườn phải sau bữa ăn nhiều dầu mỡ.", "Sốt nhẹ, buồn nôn.", "Murphy dương tính.", "Siêu âm thấy sỏi túi mật và thành túi mật dày."], "Đau hạ sườn phải, Murphy dương tính và siêu âm bất thường gợi ý viêm túi mật cấp."],
  [13, "Vàng da không đau", "Ung thư đầu tụy", ["ung thu dau tuy", "pancreatic head cancer"], ["Nam 67 tuổi vàng da tăng dần không đau.", "Sụt cân, ngứa, nước tiểu sẫm.", "Túi mật căng không đau.", "Siêu âm thấy giãn đường mật trong và ngoài gan."], "Vàng da tắc mật không đau kèm sụt cân ở người lớn tuổi gợi ý ung thư đầu tụy."],
  [14, "Nôn máu sau nôn ói", "Rách Mallory-Weiss", ["rach mallory weiss", "mallory weiss tear"], ["Nam 32 tuổi nôn nhiều sau uống rượu.", "Sau đó nôn ra máu đỏ tươi lượng ít.", "Sinh hiệu ổn định.", "Nội soi thấy vết rách niêm mạc vùng tâm vị."], "Nôn máu sau nôn ói mạnh gợi ý rách Mallory-Weiss."],
  [15, "Nôn máu nhiều ở người xơ gan", "Vỡ giãn tĩnh mạch thực quản", ["vo gian tinh mach thuc quan", "variceal bleeding"], ["Nam 55 tuổi xơ gan do rượu nôn máu lượng nhiều.", "Bụng báng, tuần hoàn bàng hệ.", "Huyết áp tụt, mạch nhanh.", "Nội soi thấy búi giãn thực quản đang chảy máu."], "Xuất huyết tiêu hóa ồ ạt ở người xơ gan gợi ý vỡ giãn tĩnh mạch thực quản."],
  [16, "Tiêu phân đen và đau thượng vị", "Loét dạ dày tá tràng", ["loet da day ta trang", "peptic ulcer disease"], ["Nam 48 tuổi đau thượng vị âm ỉ nhiều tuần.", "Đi tiêu phân đen, mệt.", "Dùng NSAID kéo dài vì đau khớp.", "Hb giảm, nội soi thấy ổ loét hành tá tràng."], "Đau thượng vị, NSAID và xuất huyết tiêu hóa trên gợi ý loét dạ dày tá tràng."],
  [17, "Tiêu chảy máu sau ăn gỏi", "Lỵ trực khuẩn", ["ly truc khuan", "shigellosis"], ["Trẻ 7 tuổi sốt, đau quặn bụng.", "Đi tiêu ít một, nhiều lần, phân nhầy máu.", "Có mót rặn.", "Nhiều bạn cùng lớp cũng tiêu chảy sau bữa ăn."], "Sốt, mót rặn và phân nhầy máu gợi ý lỵ trực khuẩn."],
  [18, "Tiêu chảy nước như nước vo gạo", "Tả", ["ta", "cholera"], ["Nam 30 tuổi tiêu chảy nước ồ ạt.", "Phân loãng như nước vo gạo, không đau bụng nhiều.", "Mắt trũng, khát nhiều, tụt huyết áp.", "Có ca bệnh tương tự trong khu dân cư."], "Tiêu chảy nước ồ ạt gây mất nước nhanh gợi ý tả."],
  [19, "Đau bụng và tiêu chảy sau sữa", "Không dung nạp lactose", ["khong dung nap lactose", "lactose intolerance"], ["Nữ 22 tuổi đầy bụng và tiêu chảy sau uống sữa.", "Không sốt, không sụt cân.", "Triệu chứng lặp lại với kem và sữa tươi.", "Cải thiện khi tránh lactose."], "Triệu chứng tiêu hóa lặp lại sau sản phẩm sữa gợi ý không dung nạp lactose."],
  [20, "Đau bụng từng cơn và vàng da", "Sỏi ống mật chủ", ["soi ong mat chu", "choledocholithiasis"], ["Nữ 50 tuổi đau hạ sườn phải từng cơn.", "Vàng da, nước tiểu sẫm.", "Bilirubin trực tiếp và ALP tăng.", "Siêu âm thấy đường mật giãn."], "Đau quặn mật kèm vàng da tắc mật gợi ý sỏi ống mật chủ."],
  [21, "Đau ngực bóp nghẹt khi gắng sức", "Cơn đau thắt ngực ổn định", ["con dau that nguc on dinh", "stable angina"], ["Nam 60 tuổi đau ngực khi leo cầu thang.", "Đau giảm sau nghỉ vài phút.", "Có tăng huyết áp và hút thuốc.", "ECG lúc nghỉ không thay đổi cấp."], "Đau ngực gắng sức giảm khi nghỉ gợi ý cơn đau thắt ngực ổn định."],
  [22, "Đau ngực kéo dài ST chênh lên", "Nhồi máu cơ tim ST chênh lên", ["nhoi mau co tim st chenh len", "stemi"], ["Nam 58 tuổi đau ngực sau xương ức 45 phút.", "Vã mồ hôi, buồn nôn.", "ECG ST chênh lên DII, DIII, aVF.", "Troponin tăng."], "Đau ngực kéo dài với ST chênh lên và troponin tăng gợi ý STEMI."],
  [23, "Khó thở kịch phát về đêm", "Suy tim trái", ["suy tim trai", "left heart failure"], ["Nữ 72 tuổi khó thở khi nằm.", "Thức giấc ban đêm vì hụt hơi.", "Ran ẩm hai đáy phổi, phù nhẹ.", "X-quang ngực có sung huyết phổi."], "Khó thở khi nằm, PND và sung huyết phổi gợi ý suy tim trái."],
  [24, "Hồi hộp nhịp không đều", "Rung nhĩ", ["rung nhi", "atrial fibrillation"], ["Nam 69 tuổi hồi hộp và mệt.", "Mạch không đều hoàn toàn.", "ECG không có sóng P rõ, khoảng RR không đều.", "Có tăng huyết áp lâu năm."], "Mạch không đều hoàn toàn và ECG mất sóng P gợi ý rung nhĩ."],
  [25, "Ngất khi gắng sức và âm thổi", "Hẹp van động mạch chủ", ["hep van dong mach chu", "aortic stenosis"], ["Nam 74 tuổi ngất khi đi bộ nhanh.", "Đau ngực gắng sức và khó thở.", "Âm thổi tâm thu tống máu lan lên cổ.", "Mạch cảnh nảy yếu và chậm."], "Tam chứng ngất, đau ngực, khó thở kèm âm thổi tống máu gợi ý hẹp van động mạch chủ."],
  [26, "Đau ngực xé lan ra lưng", "Bóc tách động mạch chủ", ["boc tach dong mach chu", "aortic dissection"], ["Nam 63 tuổi đau ngực dữ dội như xé.", "Đau lan ra sau lưng.", "Huyết áp hai tay chênh lệch.", "Có tiền sử tăng huyết áp không kiểm soát."], "Đau xé ngực lan lưng và chênh huyết áp hai tay gợi ý bóc tách động mạch chủ."],
  [27, "Đau ngực giảm khi ngồi cúi", "Viêm màng ngoài tim cấp", ["viem mang ngoai tim cap", "pericarditis"], ["Nam 28 tuổi đau ngực tăng khi nằm.", "Đỡ đau khi ngồi cúi ra trước.", "Nghe tiếng cọ màng ngoài tim.", "ECG ST chênh lan tỏa."], "Đau ngực tư thế, tiếng cọ và ST chênh lan tỏa gợi ý viêm màng ngoài tim."],
  [28, "Phù chân và tĩnh mạch cổ nổi", "Suy tim phải", ["suy tim phai", "right heart failure"], ["Nam 65 tuổi phù hai chân tăng dần.", "Tĩnh mạch cổ nổi, gan to đau.", "Khó thở nhẹ khi gắng sức.", "Có tiền sử COPD lâu năm."], "Phù ngoại biên, JVP tăng và gan to gợi ý suy tim phải."],
  [29, "Tăng huyết áp kèm hạ kali", "Cường aldosterone nguyên phát", ["cuong aldosterone nguyen phat", "primary hyperaldosteronism"], ["Nữ 42 tuổi tăng huyết áp khó kiểm soát.", "Yếu cơ từng đợt.", "Kali máu thấp, kiềm chuyển hóa.", "Renin thấp, aldosterone tăng."], "Tăng huyết áp kèm hạ kali và aldosterone cao gợi ý cường aldosterone nguyên phát."],
  [30, "Cơn đau đầu hồi hộp vã mồ hôi", "U tủy thượng thận", ["u tuy thuong than", "pheochromocytoma"], ["Nam 36 tuổi có cơn đau đầu dữ dội từng đợt.", "Hồi hộp, vã mồ hôi, huyết áp tăng vọt.", "Giữa các cơn gần như bình thường.", "Metanephrine niệu tăng."], "Cơn tăng huyết áp kịch phát với đau đầu, hồi hộp, vã mồ hôi gợi ý u tủy thượng thận."],
  [31, "Ho sốt và ran nổ một bên", "Viêm phổi cộng đồng", ["viem phoi cong dong", "community acquired pneumonia"], ["Nam 54 tuổi sốt, ho đàm vàng.", "Đau ngực khi ho.", "Ran nổ vùng đáy phổi phải.", "X-quang có đông đặc thùy dưới phải."], "Sốt, ho đàm, ran khu trú và đông đặc phổi gợi ý viêm phổi cộng đồng."],
  [32, "Khò khè tái diễn về đêm", "Hen phế quản", ["hen phe quan", "asthma"], ["Nữ 20 tuổi khó thở từng cơn về đêm.", "Khò khè sau tiếp xúc bụi.", "Triệu chứng cải thiện với salbutamol.", "Hô hấp ký có tắc nghẽn hồi phục."], "Khò khè từng cơn và đáp ứng giãn phế quản gợi ý hen phế quản."],
  [33, "Ho khạc đàm mạn ở người hút thuốc", "Bệnh phổi tắc nghẽn mạn tính", ["benh phoi tac nghen man tinh", "copd"], ["Nam 66 tuổi hút thuốc 40 gói-năm.", "Ho khạc đàm nhiều năm, khó thở tăng dần.", "Lồng ngực hình thùng, thở chúm môi.", "Hô hấp ký FEV1/FVC giảm không hồi phục hoàn toàn."], "Khó thở tiến triển và tắc nghẽn không hồi phục ở người hút thuốc gợi ý COPD."],
  [34, "Đau ngực đột ngột giảm rì rào", "Tràn khí màng phổi", ["tran khi mang phoi", "pneumothorax"], ["Nam cao gầy 23 tuổi đau ngực trái đột ngột.", "Khó thở nhẹ.", "Rì rào phế nang bên trái giảm.", "X-quang thấy đường màng phổi tạng."], "Đau ngực đột ngột với giảm rì rào một bên gợi ý tràn khí màng phổi."],
  [35, "Ho máu, sốt chiều, sụt cân", "Lao phổi", ["lao phoi", "pulmonary tuberculosis"], ["Nam 41 tuổi ho kéo dài hơn 3 tuần.", "Sốt về chiều, đổ mồ hôi đêm, sụt cân.", "Ho ra máu lượng ít.", "X-quang có tổn thương hang vùng đỉnh phổi."], "Ho kéo dài, sốt chiều, sụt cân và hang đỉnh phổi gợi ý lao phổi."],
  [36, "Sốt cao đau ngực mủ màng phổi", "Áp xe phổi", ["ap xe phoi", "lung abscess"], ["Nam 57 tuổi nghiện rượu sốt kéo dài.", "Ho đàm hôi nhiều.", "Răng miệng kém, từng sặc khi say.", "X-quang thấy hang có mức khí dịch."], "Ho đàm hôi và hang mức khí dịch sau nguy cơ hít sặc gợi ý áp xe phổi."],
  [37, "Khó thở tiến triển phổi tổ ong", "Xơ phổi vô căn", ["xo phoi vo can", "idiopathic pulmonary fibrosis"], ["Nam 70 tuổi khó thở gắng sức tăng dần.", "Ho khan kéo dài.", "Nghe ran nổ kiểu Velcro hai đáy.", "CT ngực có hình ảnh tổ ong dưới màng phổi."], "Khó thở tiến triển, ran Velcro và tổ ong gợi ý xơ phổi vô căn."],
  [38, "Ngưng thở khi ngủ và buồn ngủ ngày", "Ngưng thở tắc nghẽn khi ngủ", ["ngung tho tac nghen khi ngu", "obstructive sleep apnea"], ["Nam 48 tuổi béo phì, ngủ ngáy to.", "Vợ ghi nhận nhiều lần ngưng thở khi ngủ.", "Buồn ngủ ban ngày, đau đầu buổi sáng.", "Đo đa ký giấc ngủ có nhiều cơn ngưng thở."], "Ngáy to, ngưng thở khi ngủ và buồn ngủ ngày gợi ý OSA."],
  [39, "Khó thở sau truyền máu", "Phù phổi cấp do quá tải tuần hoàn", ["qua tai tuan hoan sau truyen mau", "taco"], ["Nữ 78 tuổi khó thở sau truyền 2 đơn vị máu.", "Tăng huyết áp, tĩnh mạch cổ nổi.", "Ran ẩm hai phổi.", "X-quang phù phổi, đáp ứng lợi tiểu."], "Khó thở sau truyền máu với dấu quá tải dịch gợi ý TACO."],
  [40, "Sốt giảm bạch cầu sau hóa trị", "Sốt giảm bạch cầu trung tính", ["sot giam bach cau trung tinh", "febrile neutropenia"], ["Nữ 45 tuổi đang hóa trị ung thư vú.", "Sốt 38,5 độ C.", "ANC 300/uL.", "Không tìm thấy ổ nhiễm rõ."], "Sốt ở người giảm bạch cầu trung tính sau hóa trị là cấp cứu nhiễm trùng."],
  [41, "Đau lưng lan xuống chân", "Thoát vị đĩa đệm thắt lưng", ["thoat vi dia dem that lung", "lumbar disc herniation"], ["Nam 35 tuổi đau lưng sau bê nặng.", "Đau lan mặt sau chân phải.", "Nghiệm pháp Lasègue dương tính.", "Giảm cảm giác vùng rễ L5."], "Đau thần kinh tọa sau gắng sức kèm Lasègue dương tính gợi ý thoát vị đĩa đệm."],
  [42, "Yếu nửa người đột ngột", "Đột quỵ thiếu máu não", ["dot quy thieu mau nao", "ischemic stroke"], ["Nam 68 tuổi méo miệng và yếu tay chân phải đột ngột.", "Nói khó, khởi phát 1 giờ trước.", "Có rung nhĩ.", "CT sọ ban đầu không thấy xuất huyết."], "Thiếu hụt thần kinh khu trú khởi phát đột ngột gợi ý đột quỵ thiếu máu não."],
  [43, "Co giật toàn thể lần đầu", "Động kinh cơn co cứng co giật", ["dong kinh con co cung co giat", "generalized tonic clonic seizure"], ["Nam 24 tuổi mất ý thức đột ngột.", "Co cứng rồi co giật toàn thân.", "Cắn lưỡi, lú lẫn sau cơn.", "Đường huyết bình thường."], "Mất ý thức kèm co cứng co giật và lú lẫn sau cơn gợi ý cơn động kinh toàn thể."],
  [44, "Run nghỉ và chậm vận động", "Bệnh Parkinson", ["benh parkinson", "parkinson disease"], ["Nam 64 tuổi run tay phải khi nghỉ.", "Chậm vận động, chữ viết nhỏ dần.", "Dáng đi bước nhỏ.", "Tăng trương lực kiểu bánh xe răng cưa."], "Run nghỉ, chậm vận động và cứng đờ gợi ý Parkinson."],
  [45, "Sụp mi yếu tăng về chiều", "Nhược cơ", ["nhuoc co", "myasthenia gravis"], ["Nữ 29 tuổi sụp mi và nhìn đôi về chiều.", "Yếu cơ tăng khi lặp lại động tác.", "Cảm giác bình thường.", "Kháng thể kháng thụ thể acetylcholine dương tính."], "Yếu cơ dao động, tăng khi gắng sức, tổn thương mắt gợi ý nhược cơ."],
  [46, "Yếu liệt lên sau tiêu chảy", "Hội chứng Guillain-Barré", ["hoi chung guillain barre", "guillain barre syndrome"], ["Nam 30 tuổi yếu hai chân tăng dần.", "Một tuần trước tiêu chảy.", "Mất phản xạ gân xương.", "Dịch não tủy protein tăng, tế bào bình thường."], "Yếu liệt lên và mất phản xạ sau nhiễm trùng gợi ý Guillain-Barré."],
  [47, "Đau đầu quanh mắt và chảy nước mắt", "Đau đầu cụm", ["dau dau cum", "cluster headache"], ["Nam 34 tuổi đau dữ dội quanh mắt trái.", "Cơn kéo dài 45 phút, lặp lại hằng đêm.", "Chảy nước mắt, nghẹt mũi cùng bên.", "Bệnh nhân bứt rứt đi lại trong cơn."], "Đau quanh mắt theo cụm kèm triệu chứng tự chủ cùng bên gợi ý đau đầu cụm."],
  [48, "Đau đầu mạch đập sợ ánh sáng", "Migraine", ["migraine", "dau nua dau"], ["Nữ 26 tuổi đau đầu một bên kiểu mạch đập.", "Buồn nôn, sợ ánh sáng.", "Cơn kéo dài nhiều giờ.", "Có tiền triệu nhìn thấy ánh sáng lóe."], "Đau đầu mạch đập kèm buồn nôn và sợ ánh sáng gợi ý migraine."],
  [49, "Sốt cứng gáy ban xuất huyết", "Viêm màng não mô cầu", ["viem mang nao mo cau", "meningococcal meningitis"], ["Nam 18 tuổi sốt cao, đau đầu dữ dội.", "Cứng gáy, lơ mơ.", "Ban xuất huyết hoại tử rải rác.", "Dịch não tủy bạch cầu đa nhân tăng, glucose giảm."], "Sốt, cứng gáy và ban xuất huyết gợi ý viêm màng não mô cầu."],
  [50, "Lú lẫn sau chấn thương đầu", "Máu tụ ngoài màng cứng", ["mau tu ngoai mang cung", "epidural hematoma"], ["Nam 20 tuổi ngã xe đập thái dương.", "Tỉnh lại rồi sau đó lơ mơ tăng dần.", "Đồng tử một bên giãn.", "CT sọ có khối tăng tỷ trọng hình thấu kính."], "Khoảng tỉnh sau chấn thương và máu tụ hình thấu kính gợi ý máu tụ ngoài màng cứng."],
  [51, "Tiểu nhiều và khát nhiều", "Đái tháo đường type 1", ["dai thao duong type 1", "type 1 diabetes"], ["Nữ 15 tuổi khát nhiều, tiểu nhiều.", "Sụt cân dù ăn nhiều.", "Đường huyết đói tăng.", "C-peptide thấp, tự kháng thể đảo tụy dương tính."], "Tam chứng tiểu nhiều, khát nhiều, sụt cân ở người trẻ gợi ý đái tháo đường type 1."],
  [52, "Mệt, tăng cân, sợ lạnh", "Suy giáp", ["suy giap", "hypothyroidism"], ["Nữ 38 tuổi mệt mỏi và tăng cân.", "Sợ lạnh, táo bón.", "Da khô, nhịp tim chậm.", "TSH tăng, FT4 giảm."], "Mệt, sợ lạnh, táo bón và TSH tăng gợi ý suy giáp nguyên phát."],
  [53, "Sụt cân, run tay, hồi hộp", "Basedow", ["basedow", "graves disease", "cuong giap graves"], ["Nữ 31 tuổi sụt cân dù ăn khỏe.", "Run tay, hồi hộp, sợ nóng.", "Bướu giáp lan tỏa và lồi mắt.", "TSH giảm, FT4 tăng."], "Cường giáp kèm lồi mắt và bướu giáp lan tỏa gợi ý Basedow."],
  [54, "Mặt tròn và rạn da tím", "Hội chứng Cushing", ["hoi chung cushing", "cushing syndrome"], ["Nữ 44 tuổi tăng cân trung tâm.", "Mặt tròn, rạn da tím vùng bụng.", "Yếu cơ gốc chi, dễ bầm.", "Cortisol niệu 24 giờ tăng."], "Béo trung tâm, rạn da tím và cortisol tăng gợi ý hội chứng Cushing."],
  [55, "Sạm da tụt huyết áp hạ natri", "Suy thượng thận nguyên phát", ["suy thuong than nguyen phat", "addison disease"], ["Nam 36 tuổi mệt mỏi kéo dài.", "Sạm da, thèm muối.", "Huyết áp thấp, hạ natri, tăng kali.", "Cortisol sáng thấp, ACTH tăng."], "Sạm da, tụt huyết áp, hạ natri tăng kali gợi ý suy thượng thận nguyên phát."],
  [56, "To đầu chi và hàm nhô", "To đầu chi", ["to dau chi", "acromegaly"], ["Nam 47 tuổi tăng cỡ giày và nhẫn.", "Hàm nhô, giọng trầm.", "Đau khớp và ngáy to.", "IGF-1 tăng."], "Thay đổi diện mạo với tăng kích thước đầu chi gợi ý to đầu chi."],
  [57, "Đau xương và sỏi thận", "Cường cận giáp nguyên phát", ["cuong can giap nguyen phat", "primary hyperparathyroidism"], ["Nữ 59 tuổi đau xương mơ hồ.", "Có tiền sử sỏi thận tái phát.", "Calci máu tăng, phospho giảm.", "PTH tăng."], "Tăng calci máu kèm PTH tăng và sỏi thận gợi ý cường cận giáp nguyên phát."],
  [58, "Co quắp tay sau mổ tuyến giáp", "Hạ calci máu", ["ha calci mau", "hypocalcemia"], ["Nữ 40 tuổi tê quanh miệng sau mổ tuyến giáp.", "Co quắp bàn tay.", "Dấu Chvostek dương tính.", "Calci ion hóa giảm."], "Dị cảm, tetany và calci giảm sau mổ tuyến giáp gợi ý hạ calci máu."],
  [59, "Khát nước tiểu loãng sau mổ não", "Đái tháo nhạt trung ương", ["dai thao nhat trung uong", "central diabetes insipidus"], ["Nam 33 tuổi tiểu rất nhiều sau phẫu thuật tuyến yên.", "Khát dữ dội.", "Natri máu tăng, áp lực thẩm thấu nước tiểu thấp.", "Đáp ứng với desmopressin."], "Đa niệu nhược trương sau tổn thương tuyến yên gợi ý đái tháo nhạt trung ương."],
  [60, "Hôn mê sau uống rượu kèm hạ đường", "Hạ đường huyết", ["ha duong huyet", "hypoglycemia"], ["Nam 52 tuổi lơ mơ sau uống rượu bỏ ăn.", "Vã mồ hôi, run tay.", "Đường huyết mao mạch 2,1 mmol/L.", "Tỉnh nhanh sau truyền glucose."], "Triệu chứng thần kinh tự chủ và cải thiện sau glucose gợi ý hạ đường huyết."],
  [61, "Phù nhiều và protein niệu", "Hội chứng thận hư", ["hoi chung than hu", "nephrotic syndrome"], ["Trẻ 5 tuổi phù mặt và phù chân.", "Nước tiểu bọt nhiều.", "Protein niệu 4+, albumin máu thấp.", "Cholesterol tăng."], "Phù, protein niệu nặng, giảm albumin và tăng lipid gợi ý hội chứng thận hư."],
  [62, "Đau quặn hông lưng tiểu máu", "Sỏi niệu quản", ["soi nieu quan", "ureteral stone"], ["Nam 39 tuổi đau quặn hông lưng trái.", "Đau lan xuống bẹn.", "Tiểu máu vi thể.", "CT không cản quang thấy sỏi niệu quản."], "Đau quặn hông lưng lan bẹn kèm tiểu máu gợi ý sỏi niệu quản."],
  [63, "Sốt đau hông lưng tiểu buốt", "Viêm thận bể thận cấp", ["viem than be than cap", "acute pyelonephritis"], ["Nữ 27 tuổi sốt cao, rét run.", "Đau hông lưng phải, tiểu buốt.", "Gõ hông lưng đau.", "Nước tiểu bạch cầu niệu và nitrite dương tính."], "Sốt, đau hông lưng và triệu chứng tiết niệu gợi ý viêm thận bể thận cấp."],
  [64, "Tiểu buốt tiểu lắt nhắt", "Viêm bàng quang cấp", ["viem bang quang cap", "cystitis"], ["Nữ 24 tuổi tiểu buốt và tiểu lắt nhắt.", "Không sốt, không đau hông lưng.", "Nước tiểu có bạch cầu và nitrite.", "Không có dấu nhiễm trùng toàn thân."], "Tiểu buốt, tiểu gấp không sốt gợi ý viêm bàng quang cấp."],
  [65, "Thiếu máu sau dùng thuốc oxy hóa", "Thiếu men G6PD", ["thieu men g6pd", "g6pd deficiency"], ["Nam 17 tuổi vàng da sau dùng primaquine.", "Nước tiểu sẫm màu.", "Hb giảm, LDH tăng.", "Phết máu có thể có thể Heinz/bite cells."], "Tan máu sau thuốc oxy hóa gợi ý thiếu men G6PD."],
  [66, "Đau xương và protein niệu Bence Jones", "Đa u tủy xương", ["da u tuy xuong", "multiple myeloma"], ["Nam 70 tuổi đau lưng kéo dài.", "Thiếu máu, creatinin tăng.", "Calci máu tăng.", "Điện di protein có đỉnh M."], "Đau xương, thiếu máu, suy thận, tăng calci và đỉnh M gợi ý đa u tủy."],
  [67, "Sốt và xuất huyết giảm tiểu cầu", "Ban xuất huyết giảm tiểu cầu miễn dịch", ["ban xuat huyet giam tieu cau mien dich", "itp"], ["Nữ 25 tuổi chấm xuất huyết và bầm da.", "Không sốt, không gan lách to.", "Tiểu cầu 18 G/L, Hb và bạch cầu bình thường.", "Phết máu không có blast."], "Giảm tiểu cầu đơn độc với xuất huyết da niêm gợi ý ITP."],
  [68, "Thiếu máu hồng cầu nhỏ", "Thiếu máu thiếu sắt", ["thieu mau thieu sat", "iron deficiency anemia"], ["Nữ 32 tuổi mệt, chóng mặt.", "Kinh nguyệt nhiều kéo dài.", "MCV thấp, ferritin thấp.", "Móng dễ gãy, thèm ăn đá."], "Thiếu máu hồng cầu nhỏ với ferritin thấp gợi ý thiếu sắt."],
  [69, "Đau khớp và hồng ban cánh bướm", "Lupus ban đỏ hệ thống", ["lupus ban do he thong", "sle"], ["Nữ 24 tuổi đau nhiều khớp nhỏ.", "Ban cánh bướm tăng khi ra nắng.", "Loét miệng không đau.", "ANA và anti-dsDNA dương tính."], "Tổn thương da nhạy nắng, đau khớp và tự kháng thể gợi ý lupus."],
  [70, "Cứng khớp buổi sáng kéo dài", "Viêm khớp dạng thấp", ["viem khop dang thap", "rheumatoid arthritis"], ["Nữ 45 tuổi đau khớp bàn ngón hai bên.", "Cứng khớp buổi sáng hơn 1 giờ.", "Khớp sưng đối xứng.", "RF và anti-CCP dương tính."], "Viêm đa khớp nhỏ đối xứng với cứng sáng kéo dài gợi ý viêm khớp dạng thấp."],
  [71, "Đau khớp ngón chân cái cấp", "Gout cấp", ["gout cap", "acute gout"], ["Nam 50 tuổi đau dữ dội khớp bàn ngón chân cái.", "Khớp sưng nóng đỏ sau tiệc rượu.", "Không chấn thương.", "Dịch khớp có tinh thể urate hình kim."], "Viêm khớp cấp monoarticular ở ngón chân cái gợi ý gout."],
  [72, "Đau lưng viêm ở nam trẻ", "Viêm cột sống dính khớp", ["viem cot song dinh khop", "ankylosing spondylitis"], ["Nam 24 tuổi đau lưng dưới hơn 3 tháng.", "Đau tăng khi nghỉ, giảm khi vận động.", "Cứng lưng buổi sáng.", "HLA-B27 dương tính, viêm khớp cùng chậu."], "Đau lưng viêm ở nam trẻ gợi ý viêm cột sống dính khớp."],
  [73, "Yếu cơ vai hông và ban tím mi", "Viêm da cơ", ["viem da co", "dermatomyositis"], ["Nữ 52 tuổi yếu cơ gốc chi.", "Khó chải tóc và đứng lên khỏi ghế.", "Ban tím quanh mi mắt, sẩn Gottron.", "CK tăng."], "Yếu cơ gốc chi kèm ban đặc trưng gợi ý viêm da cơ."],
  [74, "Da dày và Raynaud", "Xơ cứng bì hệ thống", ["xo cung bi he thong", "systemic sclerosis"], ["Nữ 46 tuổi lạnh tay đổi màu đầu ngón.", "Da ngón tay dày, căng bóng.", "Nuốt nghẹn và trào ngược.", "Có giãn mao mạch da."], "Raynaud, da dày và rối loạn thực quản gợi ý xơ cứng bì hệ thống."],
  [75, "Loét miệng sinh dục và viêm mắt", "Bệnh Behçet", ["benh behcet", "behcet disease"], ["Nam 28 tuổi loét miệng tái phát.", "Loét sinh dục đau.", "Đỏ mắt do viêm màng bồ đào.", "Có tổn thương da dạng mụn mủ."], "Loét miệng, loét sinh dục và viêm mắt gợi ý Behçet."],
  [76, "Ban xuất huyết chân và đau bụng", "Viêm mạch IgA", ["viem mach iga", "henoch schonlein purpura"], ["Bé trai 8 tuổi ban xuất huyết sờ được ở hai chân.", "Đau bụng từng cơn.", "Đau khớp gối.", "Nước tiểu có hồng cầu."], "Ban xuất huyết sờ được, đau bụng, đau khớp và tiểu máu gợi ý viêm mạch IgA."],
  [77, "Ngứa kẽ ngón tay về đêm", "Ghẻ", ["ghe", "scabies"], ["Nam 21 tuổi ngứa dữ dội về đêm.", "Nhiều bạn cùng phòng cũng ngứa.", "Sẩn và đường hầm ở kẽ ngón tay.", "Tổn thương vùng cổ tay và sinh dục."], "Ngứa về đêm, lây trong tập thể và đường hầm kẽ tay gợi ý ghẻ."],
  [78, "Mảng hồng ban vảy bạc", "Vảy nến", ["vay nen", "psoriasis"], ["Nam 35 tuổi có mảng đỏ giới hạn rõ.", "Vảy trắng bạc ở khuỷu và gối.", "Móng rỗ như đê khâu.", "Tổn thương tái phát mạn tính."], "Mảng đỏ vảy bạc ở mặt duỗi gợi ý vảy nến."],
  [79, "Mụn nước đau theo khoanh da", "Zona thần kinh", ["zona than kinh", "herpes zoster"], ["Nữ 62 tuổi đau rát một bên ngực.", "Sau 2 ngày xuất hiện chùm mụn nước.", "Tổn thương không vượt qua đường giữa.", "Phân bố theo khoanh liên sườn."], "Đau rát và mụn nước một bên theo khoanh da gợi ý zona."],
  [80, "Mề đay phù môi sau hải sản", "Phản vệ", ["phan ve", "anaphylaxis"], ["Nữ 19 tuổi nổi mề đay sau ăn tôm.", "Phù môi, khò khè.", "Choáng váng, huyết áp tụt.", "Triệu chứng xảy ra trong vài phút."], "Mề đay, phù mạch, co thắt phế quản và tụt huyết áp sau dị nguyên gợi ý phản vệ."],
  [81, "Đau bụng hạ vị và trễ kinh", "Thai ngoài tử cung", ["thai ngoai tu cung", "ectopic pregnancy"], ["Nữ 29 tuổi trễ kinh 7 tuần.", "Đau hạ vị một bên và ra huyết âm đạo ít.", "Choáng nhẹ, đau vai.", "Beta-hCG dương tính, siêu âm không thấy thai trong tử cung."], "Trễ kinh, đau bụng một bên và không thấy thai trong tử cung gợi ý thai ngoài tử cung."],
  [82, "Ra huyết âm đạo không đau cuối thai kỳ", "Nhau tiền đạo", ["nhau tien dao", "placenta previa"], ["Thai phụ 32 tuần ra máu âm đạo đỏ tươi.", "Không đau bụng, tử cung mềm.", "Tim thai còn.", "Siêu âm thấy nhau che lỗ trong cổ tử cung."], "Ra huyết không đau cuối thai kỳ gợi ý nhau tiền đạo."],
  [83, "Đau bụng và ra máu cuối thai kỳ", "Nhau bong non", ["nhau bong non", "placental abruption"], ["Thai phụ 35 tuần đau bụng dữ dội.", "Ra máu âm đạo sẫm.", "Tử cung co cứng, đau.", "Tim thai bất thường."], "Đau bụng, tử cung co cứng và ra máu cuối thai kỳ gợi ý nhau bong non."],
  [84, "Tăng huyết áp và protein niệu thai kỳ", "Tiền sản giật", ["tien san giat", "preeclampsia"], ["Thai phụ 31 tuần đau đầu và nhìn mờ.", "Huyết áp 160/105 mmHg.", "Protein niệu dương tính.", "Phù mặt và men gan tăng nhẹ."], "Tăng huyết áp sau 20 tuần kèm protein niệu/triệu chứng cơ quan đích gợi ý tiền sản giật."],
  [85, "Co giật ở thai phụ tăng huyết áp", "Sản giật", ["san giat", "eclampsia"], ["Thai phụ 34 tuần co giật toàn thể.", "Trước đó đau đầu và nhìn mờ.", "Huyết áp 170/110 mmHg.", "Protein niệu 3+."], "Co giật trên nền tiền sản giật gợi ý sản giật."],
  [86, "Đau bụng kinh dữ và vô sinh", "Lạc nội mạc tử cung", ["lac noi mac tu cung", "endometriosis"], ["Nữ 30 tuổi đau bụng kinh tăng dần nhiều năm.", "Đau khi giao hợp sâu.", "Khó có thai.", "Khám có đau vùng cùng đồ."], "Đau bụng kinh tiến triển, đau khi giao hợp và vô sinh gợi ý lạc nội mạc tử cung."],
  [87, "Khí hư hôi và clue cells", "Viêm âm đạo do vi khuẩn", ["viem am dao do vi khuan", "bacterial vaginosis"], ["Nữ 25 tuổi khí hư loãng màu xám.", "Mùi tanh tăng sau giao hợp.", "pH âm đạo tăng.", "Soi tươi có clue cells."], "Khí hư mùi tanh, pH tăng và clue cells gợi ý viêm âm đạo do vi khuẩn."],
  [88, "Khí hư vón cục ngứa nhiều", "Nấm âm đạo Candida", ["nam am dao candida", "vaginal candidiasis"], ["Nữ 27 tuổi ngứa âm hộ nhiều.", "Khí hư trắng vón như bã đậu.", "pH âm đạo thường bình thường.", "Soi thấy nấm men giả sợi."], "Ngứa nhiều và khí hư vón cục gợi ý nấm Candida âm đạo."],
  [89, "Đau vùng chậu và sốt", "Viêm vùng chậu", ["viem vung chau", "pelvic inflammatory disease"], ["Nữ 23 tuổi đau hạ vị hai bên.", "Sốt, khí hư mủ.", "Đau khi di động cổ tử cung.", "Có quan hệ không bảo vệ."], "Đau vùng chậu, sốt và đau di động cổ tử cung gợi ý viêm vùng chậu."],
  [90, "Bìu đau đột ngột", "Xoắn tinh hoàn", ["xoan tinh hoan", "testicular torsion"], ["Nam 16 tuổi đau bìu trái đột ngột.", "Buồn nôn, nôn.", "Tinh hoàn nằm cao, mất phản xạ da bìu.", "Doppler giảm tưới máu tinh hoàn."], "Đau bìu cấp, tinh hoàn cao và giảm tưới máu gợi ý xoắn tinh hoàn."],
  [91, "Ho ông ổng và khó thở thanh quản", "Viêm thanh khí phế quản", ["viem thanh khi phe quan", "croup"], ["Bé 2 tuổi ho ông ổng về đêm.", "Khàn tiếng, sốt nhẹ.", "Thở rít thì hít vào.", "X-quang cổ có dấu tháp chuông."], "Ho ông ổng, khàn tiếng và thở rít gợi ý croup."],
  [92, "Sốt cao chảy dãi ngồi cúi", "Viêm nắp thanh môn", ["viem nap thanh mon", "epiglottitis"], ["Trẻ 5 tuổi sốt cao và đau họng dữ.", "Chảy dãi, khó nuốt.", "Ngồi tư thế cúi người ra trước.", "Không muốn nằm ngửa."], "Sốt cao, chảy dãi và tư thế tripod gợi ý viêm nắp thanh môn."],
  [93, "Ho gà từng cơn", "Ho gà", ["ho ga", "pertussis"], ["Trẻ 4 tháng ho thành cơn kéo dài.", "Sau ho có tiếng rít hít vào.", "Nôn sau ho.", "Chưa tiêm chủng đầy đủ."], "Ho cơn kịch phát kèm tiếng rít và nôn sau ho gợi ý ho gà."],
  [94, "Ban má đỏ như tát", "Ban đỏ nhiễm khuẩn", ["ban do nhiem khuan", "erythema infectiosum"], ["Trẻ 7 tuổi sốt nhẹ rồi nổi ban.", "Má đỏ như bị tát.", "Ban dạng lưới ở thân mình.", "Toàn trạng tốt."], "Ban má đỏ và ban lưới gợi ý nhiễm Parvovirus B19."],
  [95, "Sốt và ban phỏng nước nhiều lứa tuổi", "Thủy đậu", ["thuy dau", "varicella"], ["Trẻ 6 tuổi sốt nhẹ và ngứa.", "Tổn thương dát, sẩn, mụn nước cùng lúc.", "Ban tập trung ở thân mình.", "Bạn cùng lớp mới mắc tương tự."], "Ban mụn nước nhiều giai đoạn trên cùng vùng da gợi ý thủy đậu."],
  [96, "Sốt ho sổ mũi mắt đỏ ban", "Sởi", ["soi", "measles"], ["Trẻ 3 tuổi sốt cao.", "Ho, chảy mũi, viêm kết mạc.", "Đốm Koplik trong miệng.", "Ban dát sẩn lan từ mặt xuống thân."], "Sốt với ho, chảy mũi, kết mạc và ban lan từ mặt gợi ý sởi."],
  [97, "Sốt và bàn tay bàn chân miệng", "Tay chân miệng", ["tay chan mieng", "hand foot mouth disease"], ["Trẻ 2 tuổi sốt nhẹ, bỏ ăn.", "Loét miệng đau.", "Mụn nước ở lòng bàn tay và bàn chân.", "Có ca tương tự tại nhà trẻ."], "Loét miệng và mụn nước tay chân ở trẻ nhỏ gợi ý tay chân miệng."],
  [98, "Sốt cao môi đỏ lưỡi dâu", "Bệnh Kawasaki", ["benh kawasaki", "kawasaki disease"], ["Bé 3 tuổi sốt 6 ngày.", "Mắt đỏ không mủ, môi đỏ nứt.", "Lưỡi dâu, ban đa dạng.", "Hạch cổ và phù bàn tay."], "Sốt kéo dài kèm thay đổi niêm mạc, mắt, da và hạch gợi ý Kawasaki."],
  [99, "Khò khè lần đầu sau cảm lạnh", "Viêm tiểu phế quản", ["viem tieu phe quan", "bronchiolitis"], ["Trẻ 8 tháng ho sổ mũi 2 ngày.", "Sau đó thở nhanh, khò khè.", "Co kéo lồng ngực nhẹ.", "Nghe ran rít lan tỏa hai phổi."], "Khò khè ở nhũ nhi sau nhiễm siêu vi hô hấp gợi ý viêm tiểu phế quản."],
  [100, "Nôn vọt ở trẻ 3 tuần tuổi", "Hẹp phì đại môn vị", ["hep phi dai mon vi", "pyloric stenosis"], ["Bé trai 3 tuần tuổi nôn vọt sau bú.", "Vẫn đói sau nôn.", "Sụt cân nhẹ, mất nước.", "Sờ thấy khối olive vùng thượng vị."], "Nôn vọt không mật ở trẻ vài tuần tuổi gợi ý hẹp phì đại môn vị."]
];

CASES.push(...SAMPLE_CARDS.map(createSampleCase));

const MAX_ATTEMPTS = MAX_CLUES;
const STORAGE_KEY = "chanle-stats-v1";
const STATE_KEY = "chanle-daily-state-v1";

const DIFFERENTIALS = {
  1: [
    ["Sốt rét", "Cần hỏi vùng dịch tễ và lam máu/test nhanh; thường có cơn rét run theo chu kỳ."],
    ["Leptospirosis", "Hay đau bắp chân, vàng da, suy thận sau tiếp xúc nước bẩn."],
    ["Cúm", "Có triệu chứng hô hấp nổi bật hơn và không giải thích tốt giảm tiểu cầu kèm xuất huyết."]
  ],
  2: [
    ["Tràn khí màng phổi", "Đau ngực và khó thở đột ngột nhưng thường giảm rì rào phế nang một bên."],
    ["Hội chứng vành cấp", "Cần ECG/troponin, nhưng đau kiểu màng phổi và nguy cơ huyết khối hướng PE hơn."],
    ["Viêm phổi", "Thường sốt, ho, ran phổi hoặc tổn thương nhu mô trên X-quang."]
  ],
  3: [
    ["Loét dạ dày tá tràng thủng", "Đau dữ dội và phản ứng thành bụng rõ; X-quang có thể thấy hơi tự do."],
    ["Nhồi máu cơ tim thành dưới", "Có thể đau thượng vị nên cần ECG/troponin ở người nguy cơ."],
    ["Viêm túi mật cấp", "Đau hạ sườn phải, Murphy dương tính và siêu âm túi mật gợi ý hơn."]
  ],
  4: [
    ["Bệnh thận IgA", "Thường tiểu máu đồng thời hoặc rất gần đợt nhiễm hô hấp, C3 thường bình thường."],
    ["Hội chứng thận hư", "Phù và protein niệu nặng, ít tiểu máu/trụ hồng cầu hơn."],
    ["Lupus nephritis", "Nghĩ khi có biểu hiện hệ thống, ANA/anti-dsDNA dương tính hoặc bổ thể giảm kéo dài."]
  ],
  5: [
    ["Sốt kéo dài do lao", "Có sụt cân, vã mồ hôi nhưng không giải thích tốt cấy máu và sùi van tim."],
    ["Áp xe ngoài màng cứng", "Đau lưng ở người tiêm chích là cảnh báo, có thể là biến chứng đi kèm."],
    ["Sốt thấp khớp", "Có viêm tim sau viêm họng liên cầu nhưng cấy máu thường âm tính."]
  ],
  6: [
    ["Tăng áp lực thẩm thấu do đái tháo đường", "Đường huyết rất cao, mất nước nặng nhưng cetone và toan thường nhẹ hơn."],
    ["Nhiễm toan lactic", "Khoảng trống anion tăng nhưng không có cetone máu mạnh."],
    ["Viêm dạ dày ruột cấp", "Có nôn đau bụng nhưng không giải thích thở Kussmaul và tăng đường huyết nặng."]
  ],
  7: [
    ["Viêm mạch ANCA", "Cũng gây phổi-thận, nhưng anti-GBM âm tính và miễn dịch huỳnh quang không dạng đường thẳng."],
    ["Lupus ban đỏ hệ thống", "Có thể viêm cầu thận và xuất huyết phổi, cần ANA/anti-dsDNA và bổ thể."],
    ["Viêm phổi nặng", "Ho máu và khó thở nhưng không giải thích tốt trụ hồng cầu/creatinin tăng nhanh."]
  ],
  8: [
    ["Nhiễm trùng tiểu hậu sản", "Sốt kèm tiểu buốt, cấy nước tiểu dương tính; tử cung thường không ấn đau."],
    ["Viêm vú", "Đau, đỏ, căng vú khu trú, không có sản dịch hôi."],
    ["Nhiễm trùng vết mổ", "Đau, đỏ, chảy dịch tại vết mổ thay vì đau tử cung và sản dịch hôi."]
  ],
  9: [
    ["Migraine", "Có thể đau dữ dội nhưng thường không khởi phát sét đánh và không có máu dưới nhện."],
    ["Viêm màng não", "Sốt và cứng gáy nổi bật hơn; dịch não tủy có bạch cầu tăng."],
    ["Bóc tách động mạch cổ", "Đau đầu/cổ cấp tính, có thể kèm Horner hoặc dấu thần kinh khu trú."]
  ],
  10: [
    ["Tiêu chảy do virus", "Thường tự giới hạn và không liên quan mạnh với kháng sinh gần đây."],
    ["Bệnh ruột viêm", "Có thể tiêu chảy kéo dài hoặc máu, nhưng độc tố C. difficile dương tính định hướng rõ."],
    ["Thiếu máu đại tràng", "Đau bụng và tiêu máu ở người nguy cơ mạch máu, không phải tiêu chảy nước sau kháng sinh điển hình."]
  ]
};

let mode = "daily";
let currentCase;
let revealed = 1;
let attempts = [];
let finished = false;

const $ = (selector) => document.querySelector(selector);

function createSampleCase([id, title, diagnosis, aliases, clues, summary]) {
  const paddedClues = [
    ...clues,
    `Các dữ kiện nổi bật nhất đang cùng hướng về ${diagnosis}.`,
    "Hãy so sánh với các chẩn đoán phân biệt gần giống trước khi chốt đáp án."
  ].slice(0, MAX_CLUES);

  return {
    id,
    title,
    diagnosis,
    aliases,
    clues: paddedClues,
    summary,
    pearls: {
      "Gợi ý chính": summary,
      "Mục tiêu ôn tập": "Nhận diện mẫu bệnh cảnh kinh điển và tự kiểm tra lại bằng tài liệu học tập chính thức."
    }
  };
}

const elements = {
  caseNumber: $("#case-number"),
  modeLabel: $("#mode-label"),
  caseTitle: $("#case-title"),
  attemptsLeft: $("#attempts-left"),
  clueList: $("#clue-list"),
  form: $("#guess-form"),
  input: $("#guess-input"),
  diagnosisList: $("#diagnosis-list"),
  feedback: $("#feedback"),
  reveal: $("#reveal-button"),
  next: $("#new-case-button"),
  history: $("#history"),
  result: $("#result"),
  answer: $("#answer"),
  summary: $("#summary"),
  differentialBlock: $("#differential-block"),
  differentials: $("#differentials"),
  pearls: $("#pearls"),
  played: $("#played"),
  solved: $("#solved"),
  streak: $("#streak"),
  copyShare: $("#copy-share"),
  copyAnki: $("#copy-anki")
};

function normalize(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function todayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dailyIndex() {
  const now = new Date();
  const start = new Date(2026, 0, 1);
  const localMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor((localMidnight - start) / 86400000) % CASES.length;
}

function getStats() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"played":0,"solved":0,"streak":0}');
}

function setStats(stats) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

function updateStatsView() {
  const stats = getStats();
  elements.played.textContent = stats.played;
  elements.solved.textContent = stats.solved;
  elements.streak.textContent = stats.streak;
}

function saveDailyState() {
  if (mode !== "daily") return;
  localStorage.setItem(
    STATE_KEY,
    JSON.stringify({
      date: todayKey(),
      caseId: currentCase.id,
      revealed,
      attempts,
      finished
    })
  );
}

function loadDailyState(caseData) {
  const saved = JSON.parse(localStorage.getItem(STATE_KEY) || "null");
  if (!saved || saved.date !== todayKey() || saved.caseId !== caseData.id) return false;
  revealed = saved.revealed;
  attempts = saved.attempts || [];
  finished = Boolean(saved.finished);
  return true;
}

function isCorrect(guess) {
  const accepted = [currentCase.diagnosis, ...currentCase.aliases].map(normalize);
  return accepted.includes(normalize(guess));
}

function setCase(caseData, restore = false) {
  currentCase = caseData;
  revealed = 1;
  attempts = [];
  finished = false;

  if (restore) loadDailyState(caseData);

  elements.caseNumber.textContent = `Ca #${String(caseData.id).padStart(3, "0")}`;
  elements.modeLabel.textContent = mode === "daily" ? "Ca hằng ngày" : "Luyện tập";
  elements.caseTitle.textContent = caseData.title;
  elements.feedback.textContent = "";
  elements.feedback.className = "feedback";
  elements.input.value = "";
  elements.input.disabled = finished;
  render();
}

function render() {
  elements.attemptsLeft.textContent = Math.max(0, MAX_ATTEMPTS - attempts.length);
  elements.clueList.innerHTML = currentCase.clues
    .map((clue, index) => {
      const visible = index < revealed;
      return `<li class="clue ${visible ? "" : "locked"}">${visible ? clue : "Dữ kiện đang khóa"}</li>`;
    })
    .join("");

  elements.history.innerHTML = attempts.length
    ? attempts
        .map(
          (item, index) =>
            `<li><span>${index + 1}. ${item.text}</span><strong class="${item.correct ? "hit" : "miss"}">${item.correct ? "Đúng" : "Sai"}</strong></li>`
        )
        .join("")
    : "<li><span>Chưa có lượt đoán</span><strong>-</strong></li>";

  elements.reveal.disabled = finished || revealed >= currentCase.clues.length;
  elements.form.querySelector("button").disabled = finished;
  elements.input.disabled = finished;

  if (finished) {
    showResult();
  } else {
    elements.result.classList.add("hidden");
  }

  updateStatsView();
  saveDailyState();
}

function finish(solved) {
  finished = true;
  const stats = getStats();
  const alreadyRecorded =
    mode === "daily" &&
    JSON.parse(localStorage.getItem(STATE_KEY) || "null")?.date === todayKey() &&
    JSON.parse(localStorage.getItem(STATE_KEY) || "null")?.finished;

  if (!alreadyRecorded || mode === "practice") {
    stats.played += 1;
    stats.solved += solved ? 1 : 0;
    stats.streak = solved ? stats.streak + 1 : 0;
    setStats(stats);
  }

  elements.feedback.textContent = solved
    ? "Chính xác. Mở phần ôn tập để chốt lại điểm mấu chốt."
    : "Hết lượt. Xem đáp án và tự hỏi dữ kiện nào nên làm mình đổi hướng.";
  elements.feedback.className = `feedback ${solved ? "good" : "bad"}`;
  render();
}

function showResult() {
  elements.result.classList.remove("hidden");
  elements.answer.textContent = currentCase.diagnosis;
  elements.summary.textContent = currentCase.summary;
  const differentials = DIFFERENTIALS[currentCase.id] || [];
  elements.differentialBlock.classList.toggle("hidden", differentials.length === 0);
  elements.differentials.innerHTML = differentials
    .map(([name, note]) => `<li><strong>${name}</strong><span>${note}</span></li>`)
    .join("");
  elements.pearls.innerHTML = Object.entries(currentCase.pearls)
    .map(([term, detail]) => `<div><dt>${term}</dt><dd>${detail}</dd></div>`)
    .join("");
}

function submitGuess(event) {
  event.preventDefault();
  const text = elements.input.value.trim();
  if (!text || finished) return;

  const correct = isCorrect(text);
  attempts.push({ text, correct });
  elements.input.value = "";

  if (correct) {
    finish(true);
    return;
  }

  if (attempts.length >= MAX_ATTEMPTS) {
    revealed = currentCase.clues.length;
    finish(false);
    return;
  }

  revealed = Math.min(currentCase.clues.length, revealed + 1);
  elements.feedback.textContent = "Chưa đúng. Dữ kiện tiếp theo đã được mở.";
  elements.feedback.className = "feedback bad";
  render();
}

function revealClue() {
  if (finished) return;
  revealed = Math.min(currentCase.clues.length, revealed + 1);
  elements.feedback.textContent = "Đã mở thêm một dữ kiện. Bạn vẫn còn lượt đoán.";
  elements.feedback.className = "feedback";
  render();
}

function randomPracticeCase() {
  const pool = CASES.filter((item) => item.id !== currentCase?.id);
  return pool[Math.floor(Math.random() * pool.length)] || CASES[0];
}

async function copyText(text, button) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
  } else {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.append(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }
  const original = button.textContent;
  button.textContent = "Đã sao chép";
  setTimeout(() => {
    button.textContent = original;
  }, 1400);
}

function shareText() {
  const solvedAt = attempts.findIndex((item) => item.correct) + 1;
  const marks = attempts
    .map((item) => (item.correct ? "🟩" : "⬜"))
    .concat(Array(Math.max(0, MAX_ATTEMPTS - attempts.length)).fill("⬛"))
    .join("");
  return `chanle #${String(currentCase.id).padStart(3, "0")} ${solvedAt || "X"}/${MAX_ATTEMPTS}\n${marks}\nhttps://souhhcong.github.io/`;
}

function ankiText() {
  return [
    `Mặt trước: ${currentCase.clues[0]} Chẩn đoán có khả năng nhất là gì?`,
    `Mặt sau: ${currentCase.diagnosis}. ${currentCase.summary}`
  ].join("\n");
}

function switchMode(nextMode) {
  mode = nextMode;
  document.querySelectorAll(".nav-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === mode);
  });
  setCase(mode === "daily" ? CASES[dailyIndex()] : randomPracticeCase(), mode === "daily");
}

function hydrateDiagnosisList() {
  const names = new Set();
  CASES.forEach((item) => {
    names.add(item.diagnosis);
    item.aliases.forEach((alias) => names.add(alias));
  });
  elements.diagnosisList.innerHTML = [...names]
    .sort((a, b) => a.localeCompare(b, "vi"))
    .map((name) => `<option value="${name}"></option>`)
    .join("");
}

function init() {
  hydrateDiagnosisList();
  updateStatsView();
  setCase(CASES[dailyIndex()], true);

  elements.form.addEventListener("submit", submitGuess);
  elements.reveal.addEventListener("click", revealClue);
  elements.next.addEventListener("click", () => {
    if (mode === "daily") switchMode("practice");
    else setCase(randomPracticeCase());
  });
  elements.copyShare.addEventListener("click", () => copyText(shareText(), elements.copyShare));
  elements.copyAnki.addEventListener("click", () => copyText(ankiText(), elements.copyAnki));

  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => switchMode(button.dataset.mode));
  });
  document.querySelectorAll("[data-open]").forEach((button) => {
    button.addEventListener("click", () => $(`#${button.dataset.open}`).showModal());
  });
  document.querySelectorAll("[data-close]").forEach((button) => {
    button.addEventListener("click", () => $(`#${button.dataset.close}`).close());
  });
}

init();
