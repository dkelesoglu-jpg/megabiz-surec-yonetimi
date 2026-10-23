-- İçerik yöneticisi rolü. Enum değeri, kullanılacağı migration'dan ayrı bir
-- işlemde eklenmelidir (PostgreSQL kuralı).
alter type public.user_role add value if not exists 'editor';
