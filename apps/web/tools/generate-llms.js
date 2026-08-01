// Script này bị thiếu trong bản export từ Hostinger Horizons (dùng để sinh
// file llms.txt hỗ trợ AI crawler đọc site). Không bắt buộc để build chạy
// (build script gốc đã có `|| true` để bỏ qua lỗi này), nhưng để lại file
// rỗng ở đây cho log build sạch sẽ, không còn dòng "Cannot find module".
//
// Nếu muốn, bạn có thể viết thêm logic sinh public/llms.txt thật ở đây.
process.exit(0);
