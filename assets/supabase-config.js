/**
 * Supabase 連線設定
 *
 * 請把下面兩個值換成你自己的 Supabase 專案資訊：
 *   1. 登入 https://supabase.com 建立一個專案
 *   2. 到 Project Settings → API
 *   3. 複製 Project URL 與 anon public key 貼到這裡
 *
 * anon key 是設計成可以公開的（它受資料表的 RLS 政策保護），
 * 放進前端原始碼並提交到 GitHub 是正常做法。
 * 千萬不要把 service_role key 放在這裡。
 *
 * 尚未設定時，計數器會自動隱藏，網站其他功能一切正常。
 */
window.SUPABASE_CONFIG = {
  url: '', // 例如 https://abcdefghijkl.supabase.co
  anonKey: '', // 例如 eyJhbGciOi...
};
