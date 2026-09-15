import React from "react";
import "./Policy.scss";

const platformInfo = [
  ["Tên nền tảng", "SkillHub - marketplace sản phẩm số và dịch vụ kỹ năng"],
  ["Vai trò", "Nền tảng trung gian kết nối buyer và talent; SkillHub không phải là chủ sở hữu mặc định của listing do talent đăng."],
  ["Phạm vi", "Tìm kiếm listing, đặt hàng, thanh toán, nhắn tin, bàn giao file, đánh giá, hoàn tiền và xử lý tranh chấp trên môi trường điện tử."],
  ["Liên hệ", "support@skillhub.vn - ưu tiên kèm mã đơn DH, tài khoản và bằng chứng liên quan."],
];

const sections = [
  {
    id: "owner",
    title: "Thông tin chủ quản nền tảng",
    desc: "SkillHub công khai thông tin vận hành để người dùng biết mình đang giao dịch trên nền tảng nào, liên hệ ở đâu và dữ liệu giao dịch được quản lý ra sao.",
    bullets: [
      "Thông tin pháp nhân, mã số thuế, địa chỉ và người đại diện cần được bổ sung trước khi vận hành thương mại chính thức.",
      "Các thay đổi quan trọng về điều khoản, phí, hoàn tiền hoặc xử lý dữ liệu sẽ được cập nhật công khai trên nền tảng.",
      "Khi có yêu cầu hợp lệ từ cơ quan nhà nước có thẩm quyền, SkillHub phối hợp cung cấp thông tin trong phạm vi pháp luật cho phép.",
    ],
  },
  {
    id: "terms",
    title: "Điều khoản dịch vụ",
    desc: "Khi tạo tài khoản, đăng listing, đặt hàng, nhắn tin, thanh toán hoặc nhận bàn giao trên SkillHub, người dùng đồng ý tuân thủ điều khoản này và các chính sách liên quan.",
    bullets: [
      "Người dùng phải cung cấp thông tin trung thực, bảo mật tài khoản và chịu trách nhiệm với hoạt động phát sinh từ tài khoản của mình.",
      "SkillHub có quyền từ chối, tạm ẩn, gỡ listing, khóa tính năng hoặc khóa tài khoản khi phát hiện gian lận, vi phạm pháp luật, xâm phạm quyền sở hữu trí tuệ hoặc gây rủi ro cho cộng đồng.",
      "Giao dịch nên được tạo, thanh toán, trao đổi và bàn giao trong hệ thống SkillHub để có đủ căn cứ hỗ trợ khi xảy ra khiếu nại.",
    ],
  },
  {
    id: "electronic-contract",
    title: "Giao kết và lưu trữ giao dịch điện tử",
    desc: "Đơn hàng, tin nhắn, trạng thái thanh toán, file bàn giao, yêu cầu chỉnh sửa, yêu cầu hoàn tiền và quyết định xử lý được xem là thông điệp dữ liệu phát sinh trong quá trình giao dịch.",
    bullets: [
      "Buyer có cơ hội kiểm tra listing, giá, voucher, phí và nội dung đơn trước khi thanh toán.",
      "Mỗi đơn có mã riêng bắt đầu bằng DH để đối chiếu thanh toán, theo dõi tiến độ và tra cứu khi cần hỗ trợ.",
      "SkillHub lưu lịch sử trạng thái đơn, timeline xử lý, bằng chứng và thời điểm phát sinh để phục vụ tham chiếu, hỗ trợ, kế toán, khiếu nại và tranh chấp.",
    ],
  },
  {
    id: "buyer",
    title: "Quyền và nghĩa vụ của buyer",
    desc: "Buyer có quyền nhận đúng sản phẩm/dịch vụ theo mô tả listing và có nghĩa vụ cung cấp yêu cầu rõ ràng, thanh toán đúng hướng dẫn, sử dụng nội dung nhận được đúng phạm vi cho phép.",
    bullets: [
      "Kiểm tra kỹ mô tả, giá, thời gian bàn giao, số lần chỉnh sửa, quyền sử dụng file và điều kiện hoàn tiền trước khi đặt hàng.",
      "Không yêu cầu talent thực hiện nội dung trái pháp luật, gian lận, xâm phạm bản quyền, spam, lừa đảo hoặc né tránh chính sách nền tảng.",
      "Khi yêu cầu sửa, hoàn tiền hoặc mở tranh chấp, buyer cần nêu lý do cụ thể và gửi bằng chứng nếu có.",
    ],
  },
  {
    id: "talent",
    title: "Quyền và nghĩa vụ của talent",
    desc: "Talent là người đăng bán sản phẩm số hoặc cung cấp dịch vụ kỹ năng; talent chịu trách nhiệm về tính chính xác, hợp pháp, quyền sở hữu, quyền phân phối và chất lượng nội dung đã đăng.",
    bullets: [
      "Listing phải mô tả đúng phạm vi, giá, thời gian bàn giao, file hoặc đầu ra, điều kiện sử dụng, số lần chỉnh sửa và giới hạn trách nhiệm nếu có.",
      "Không đăng sản phẩm hoặc dịch vụ cấm, giả mạo, gây hiểu nhầm, vi phạm bản quyền, chứa mã độc, thu thập dữ liệu trái phép hoặc hỗ trợ hành vi gian lận.",
      "Talent chịu hoàn toàn trách nhiệm đối với mọi file, mã nguồn, tài liệu, hình ảnh, video, nội dung và sản phẩm số do talent đăng tải hoặc bàn giao trên SkillHub.",
      "Trường hợp nội dung do talent cung cấp gây thiệt hại, khiếu nại, tranh chấp, yêu cầu bồi thường hoặc yêu cầu xử lý từ cơ quan có thẩm quyền, talent có nghĩa vụ tự chịu trách nhiệm, phối hợp xử lý và bồi thường toàn bộ thiệt hại phát sinh theo quy định pháp luật.",
      "Talent tự chịu trách nhiệm về nghĩa vụ thuế, hóa đơn/chứng từ, quyền tác giả, quyền sử dụng tài sản số và cam kết với buyer theo quy định pháp luật.",
    ],
  },
  {
    id: "privacy",
    title: "Chính sách bảo mật và dữ liệu cá nhân",
    desc: "SkillHub thu thập và xử lý dữ liệu cần thiết để tạo tài khoản, vận hành marketplace, xử lý thanh toán, bàn giao file, hỗ trợ khách hàng, phòng chống gian lận và đáp ứng nghĩa vụ pháp lý.",
    bullets: [
      "Dữ liệu có thể bao gồm thông tin tài khoản, email, số điện thoại nếu người dùng cung cấp, nội dung listing, đơn hàng, tin nhắn, file, log thanh toán, phản hồi và bằng chứng tranh chấp.",
      "SkillHub chỉ chia sẻ dữ liệu trong phạm vi cần thiết cho vận hành dịch vụ, xử lý thanh toán, lưu trữ file, hỗ trợ tranh chấp hoặc theo yêu cầu hợp lệ của cơ quan có thẩm quyền.",
      "Người dùng có thể yêu cầu cập nhật, điều chỉnh hoặc xem xét xóa thông tin cá nhân, trừ dữ liệu cần giữ để thực hiện nghĩa vụ pháp lý, kế toán, phòng chống gian lận hoặc giải quyết tranh chấp.",
    ],
  },
  {
    id: "refund",
    title: "Chính sách hoàn tiền",
    desc: "Hoàn tiền được xem xét khi listing không được bàn giao, bàn giao sai mô tả, file lỗi không thể sử dụng, talent không phản hồi trong thời gian hợp lý hoặc có căn cứ cho thấy giao dịch vi phạm chính sách.",
    bullets: [
      "Buyer có thể yêu cầu hoàn toàn phần hoặc hoàn một phần; yêu cầu cần nêu rõ lý do, số tiền đề nghị hoàn và bằng chứng liên quan.",
      "Admin có thể phê duyệt hoàn toàn phần, hoàn một phần, yêu cầu bổ sung bằng chứng hoặc từ chối nếu không đủ căn cứ.",
      "Sản phẩm số đã tải, đơn đã hoàn thành hoặc nội dung đã được sử dụng có thể bị giới hạn hoàn tiền, trừ trường hợp file sai mô tả, lỗi nghiêm trọng hoặc vi phạm pháp luật/chính sách.",
    ],
  },
  {
    id: "dispute",
    title: "Quy định tranh chấp và khiếu nại",
    desc: "Khi buyer và talent không thống nhất về kết quả, đơn hàng có thể chuyển sang trạng thái tranh chấp để admin xem timeline, mô tả listing, yêu cầu ban đầu, chat, file bàn giao và bằng chứng.",
    bullets: [
      "Hai bên nên ưu tiên thương lượng trên hệ thống trước khi yêu cầu admin ra quyết định.",
      "Admin xử lý dựa trên dữ liệu lưu trong SkillHub; thông tin trao đổi ngoài nền tảng có thể không đủ căn cứ xác minh.",
      "Quyết định xử lý có thể gồm tiếp tục bàn giao, yêu cầu chỉnh sửa, hoàn tiền một phần, hoàn tiền toàn phần, chốt đơn cho talent hoặc khóa/gỡ listing vi phạm.",
    ],
  },
  {
    id: "copyright",
    title: "Quy định bản quyền và nội dung số",
    desc: "Sản phẩm số, source code, template, tài liệu, hình ảnh, video, nội dung thiết kế và tài sản sáng tạo chỉ được đăng khi talent có quyền sở hữu, quyền sử dụng hoặc quyền phân phối hợp pháp.",
    bullets: [
      "Talent không được bán lại tài liệu, source code, theme, template, ảnh hoặc video không có quyền hoặc vi phạm điều khoản của bên thứ ba.",
      "Talent cam kết nội dung đăng tải hoặc bàn giao không chứa mã độc, mã khai thác, cơ chế thu thập dữ liệu trái phép, nội dung vi phạm pháp luật, vi phạm bản quyền hoặc yếu tố gây thiệt hại cho buyer, SkillHub hay bên thứ ba.",
      "Buyer chỉ được sử dụng file theo phạm vi ghi trong listing; không tự ý chia sẻ, bán lại, phát tán hoặc gỡ thông tin bản quyền nếu listing không cho phép.",
      "Khi nhận khiếu nại bản quyền có căn cứ, SkillHub có thể tạm ẩn listing, giữ tiền, yêu cầu giải trình, hoàn tiền cho buyer hoặc khóa tài khoản vi phạm.",
    ],
  },
  {
    id: "content",
    title: "Tiêu chuẩn nội dung và hàng hóa dịch vụ bị cấm",
    desc: "SkillHub không cho phép listing có nội dung trái pháp luật, lừa đảo, gian lận, xâm phạm quyền sở hữu trí tuệ, mã độc, thu thập dữ liệu trái phép hoặc gây hại cho người khác.",
    bullets: [
      "Không đăng dịch vụ làm giả giấy tờ, gian lận học thuật, spam, hack trái phép, né kiểm duyệt, đánh cắp tài khoản, lừa đảo thanh toán hoặc vi phạm an toàn thông tin.",
      "Không dùng hình ảnh, mô tả, rating, doanh số, voucher hoặc cam kết kết quả theo cách gây hiểu nhầm cho buyer.",
      "Admin có quyền yêu cầu chỉnh sửa, từ chối duyệt, gỡ listing hoặc chuyển thông tin cho cơ quan có thẩm quyền khi cần thiết.",
    ],
  },
  {
    id: "fees",
    title: "Phí nền tảng và khuyến mãi",
    desc: "SkillHub có thể thu phí trên đơn hàng để duy trì hệ thống, xử lý thanh toán, lưu trữ file, kiểm duyệt nội dung, hỗ trợ người dùng và xử lý tranh chấp.",
    bullets: [
      "SkillHub thu phí nền tảng mặc định 10% trên mỗi đơn hàng thanh toán thành công; 90% còn lại là phần tiền talent nhận trước các điều chỉnh hoàn tiền hoặc tranh chấp nếu có.",
      "Nếu voucher do SkillHub tài trợ, phí nền tảng 10% được tính trên giá gốc của listing; nếu voucher do talent tạo, phí nền tảng 10% được tính trên giá sau giảm.",
      "Phí nền tảng, số tiền buyer thanh toán, voucher, tiền giảm giá, tiền talent nhận và trạng thái giữ tiền cần được hiển thị minh bạch trong đơn hàng/ví talent trước khi talent rút tiền.",
      "Voucher do SkillHub phát hành do SkillHub tài trợ; voucher do talent tạo sẽ trừ vào doanh thu của talent và không vượt quá giới hạn nền tảng cho phép.",
      "Tiền talent có thể được giữ trong thời gian bảo vệ giao dịch 10 ngày trước khi khả dụng để rút, trừ trường hợp đơn đang tranh chấp, hoàn tiền hoặc bị rà soát rủi ro.",
    ],
  },
  {
    id: "off-platform",
    title: "Chống giao dịch ngoài nền tảng",
    desc: "Trao đổi số điện thoại, email, Zalo, Facebook, link thanh toán riêng hoặc giao dịch ngoài SkillHub có thể làm mất căn cứ bảo vệ giao dịch và tăng rủi ro lừa đảo.",
    bullets: [
      "SkillHub có thể cảnh báo, ẩn hoặc chặn nội dung kêu gọi giao dịch ngoài nền tảng.",
      "Các khoản thanh toán ngoài SkillHub không thuộc phạm vi bảo vệ giao dịch, hoàn tiền hoặc hỗ trợ tranh chấp của SkillHub.",
      "Tái phạm có thể dẫn đến hạn chế tài khoản, khóa tính năng hoặc chấm dứt quyền sử dụng nền tảng.",
    ],
  },
  {
    id: "rating",
    title: "Đánh giá và uy tín",
    desc: "Đánh giá giúp buyer chọn đúng talent và giúp talent xây dựng hồ sơ tin cậy. Review phải phản ánh trải nghiệm thật từ đơn hàng đã hoàn thành.",
    bullets: [
      "Không mua bán, trao đổi, ép buộc, đe dọa hoặc thao túng đánh giá.",
      "Review có dấu hiệu gian lận, xúc phạm, tiết lộ thông tin cá nhân hoặc không liên quan đến đơn hàng có thể bị gỡ.",
      "SkillHub có thể dùng dữ liệu đánh giá, hoàn tiền, tranh chấp, tỷ lệ hoàn thành và vi phạm chính sách để xếp hạng hiển thị listing.",
    ],
  },
  {
    id: "support",
    title: "Tiếp nhận phản ánh và hỗ trợ",
    desc: "Người dùng có thể gửi phản ánh, yêu cầu hỗ trợ, khiếu nại, yêu cầu hoàn tiền hoặc thông báo vi phạm qua kênh hỗ trợ của SkillHub.",
    bullets: [
      "Email hỗ trợ: support@skillhub.vn.",
      "Khi gửi yêu cầu, nên kèm mã đơn DH, tài khoản, mô tả sự cố, ảnh chụp màn hình, file hoặc bằng chứng liên quan.",
      "SkillHub ưu tiên xử lý lỗi thanh toán, không tải được file, đơn hàng quá hạn, tranh chấp, khiếu nại bản quyền và dấu hiệu lừa đảo.",
    ],
  },
];

const Policy = () => {
  return <div className="policy"><div className="container">
    <div className="policy-hero">
      <span className="sh-badge product">Chính sách pháp lý SkillHub</span>
      <h1>Điều khoản, bảo mật, giao dịch điện tử và bảo vệ người dùng</h1>
      <p>Trang này công khai điều kiện hoạt động, điều kiện giao dịch, quyền và nghĩa vụ của các bên, chính sách dữ liệu, hoàn tiền, tranh chấp và tiêu chuẩn nội dung trên SkillHub.</p>
      <small>Cập nhật tham chiếu theo Luật Giao dịch điện tử 2023 và Luật Thương mại điện tử 2025. Nội dung này là bản vận hành cho sản phẩm demo; trước khi kinh doanh chính thức cần bổ sung thông tin pháp nhân và rà soát bởi tư vấn pháp lý.</small>
    </div>
    <section className="policy-owner-card" aria-labelledby="owner-summary">
      <h2 id="owner-summary">Tóm tắt công khai</h2>
      <div>{platformInfo.map(([label, value]) => <p key={label}><strong>{label}</strong><span>{value}</span></p>)}</div>
    </section>
    <nav className="policy-toc" aria-label="Mục lục chính sách">
      {sections.map((section) => <a href={`#${section.id}`} key={section.id}>{section.title}</a>)}
    </nav>
    <div className="policy-grid">
      {sections.map((section) => <section id={section.id} key={section.id}>
        <h2>{section.title}</h2>
        <p>{section.desc}</p>
        <ul>{section.bullets.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>)}
    </div>
  </div></div>;
};

export default Policy;
