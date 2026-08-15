-- Chạy 1 lần nếu bạn nghi ngờ có tài khoản bị mất dòng "profiles"
-- (do lỡ xoá tay trong Table Editor) nhưng vẫn còn tồn tại ở auth.users.
-- An toàn: chỉ thêm dòng còn thiếu, không đụng tới dòng đã có sẵn.

insert into public.profiles (id, full_name)
select u.id, null
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;
