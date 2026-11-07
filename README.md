# Không gian 3D — công trình 7112026

Web xem mô hình thật từ `D:\HELP\7112026.ifc`. Trang tự nạp bản sao IFC tại `public/7112026.ifc` mỗi lần mở. File RVT và IFC gốc giữ nguyên. Giao diện tham khảo ảnh Innerscene do người dùng gửi: thanh công cụ tối, khung 3D toàn màn hình, nền trời, lưới mặt đất và bảng điều khiển thu gọn.

## Mở web

Chạy `MO-WEB.cmd`, rồi truy cập http://127.0.0.1:5173/.

Hoặc chạy trong thư mục dự án:

```powershell
npm install
npm run dev -- --port 5173 --strictPort
```

Giữ cửa sổ máy chủ khi xem web cục bộ.

## Đăng lên GitHub Pages

1. Mở repo trên GitHub, vào **Settings → Pages → Source**, chọn **GitHub Actions**.
2. Commit và push mã nguồn lên nhánh `main`. Workflow [pages.yml](.github/workflows/pages.yml) sẽ cài dependencies, chạy kiểm thử, build và đăng thư mục `dist`.
3. Mở tab **Actions** để xem kết quả. Khi chạy thành công, lấy link web trong **Settings → Pages**. Nếu bạn bật Pages sau khi đã push, chọn workflow **Deploy viewer to GitHub Pages** trong **Actions** rồi bấm **Run workflow**.

Với repo `thanhtrung411/Revit-3D`, địa chỉ mặc định là `https://thanhtrung411.github.io/Revit-3D/`. Bản build dùng đường dẫn tương đối để IFC và các tài nguyên tải đúng dưới tên repo. Khi đăng công khai, người xem có thể tải file `7112026.ifc` từ web.

## Dữ liệu đã kiểm tra

- IFC4 do Innerscene xuất từ RVT ngày 07/11/2026.
- 3 tầng: Level 1, Level 2, Level 3.
- 46 tường, 109 cấu kiện nội thất, 9 thiết bị vệ sinh, 18 cửa, 2 cầu thang và các cấu kiện khác.
- 349 phần hình học, 174.527 tam giác. Tất cả cấu kiện hình học có quan hệ tầng.
- Viewer dùng màu bề mặt IFC, phối sàn be và kính xanh, thêm viền mảnh theo cạnh cấu kiện. Curtain Panels được nhận diện là kính.
- Hai sàn (602 và 613) trong IFC được gán vào tầng bên dưới. Viewer nhóm chúng theo tầng được đỡ, dựa vào sự trùng cao độ giữa mặt trên sàn và chân tường. Việc này chỉ đổi nhóm hiển thị, không sửa tọa độ hoặc nội dung IFC. Vì vậy chế độ tách tầng không còn sàn che nội thất tầng dưới.
- File không chứa cấu kiện IfcRoof nên điều khiển mái tự ẩn.

## Sử dụng

- **Xoay:** kéo chuột; **zoom:** con lăn hoặc +/−; **di chuyển:** chuột phải. Cảm ứng: một ngón xoay, hai ngón zoom/di chuyển.
- Nội thất tầng trên cùng luôn hiện, kể cả khi zoom xa. Nội thất các tầng dưới hiện khi zoom gần và ẩn khi zoom xa. Tường mờ dần khi lại gần và giữ độ hiện tối thiểu 18% để còn thấy bố cục phòng.
- **Tách tầng:** nâng các tầng, chỉnh khoảng cách trong bảng Công cụ. Chọn Xoay để ghép lại.
- **Mặt cắt:** ẩn phần phía trên cao độ chọn. Mặt bị cắt chưa được bịt kín.
- **Công cụ / ☰:** lọc tầng, bật/tắt tường mờ, nền trời và lưới.
- **Góc nhìn:** phối cảnh, mặt bằng hoặc mặt đứng. Nút nhà về góc mặc định.
- Click cấu kiện để xem tên và tầng.
- **Mở file IFC:** chọn mô hình khác. **Tải IFC:** tải file nguồn đang xem, không áp thay đổi màu/tách tầng vào dữ liệu.
- Khi khung 3D có focus: phím mũi tên xoay, +/− zoom, H về góc ban đầu.

## Lưu trữ và giới hạn

Mô hình mặc định được đóng gói cùng mã nguồn để tự nạp. IFC người dùng mở thêm được xử lý trong trình duyệt, không gửi tới dịch vụ ngoài và không lưu sau khi tải lại. Bộ đọc chạy trong Web Worker. Giới hạn nhập 200 MB, hiệu năng tùy độ phức tạp mô hình và thiết bị.

Phân loại phụ thuộc IFC: proxy chung không được tự đoán là tường/nội thất. Sàn chỉ được đổi nhóm khi khớp rõ cao độ tầng có tường. Các phần không có tầng giữ nguyên nhóm chưa gán. File thiếu phân tầng không thể tách tầng chính xác.

Mô hình thử trong `src/demo.js` chỉ là chế độ dự phòng chủ động chọn, không được dùng thay mô hình mặc định.

## Kiểm tra / build

```powershell
npm test
npm run build
npm run preview -- --port 4173
```

Kiểm thử gồm quy tắc mờ tường, tách tầng, hiệu chỉnh nhóm sàn, parser fixture, và hình học/quan hệ tầng của file 7112026 thật. Đã kiểm tra trên trình duyệt: tự nạp IFC, xoay/zoom, tường mờ, tách tầng với nội thất, mặt cắt, lọc tầng, nền trời/lưới, góc nhìn và giao diện hẹp.

Mã chính: `src/main.js` (viewer), `src/ifc.worker.js` (đọc IFC), `src/model-logic.js` (quy tắc), `src/sky.js` (nền trời), `src/viewer-theme.css` (giao diện theo tham khảo).
