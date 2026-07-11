# 咪菲認字小花園

一個給小朋友練習繁體中文認字的小型 Web App。目前版本重點是手機和平板上的「聽音選字」練習：預設每次 15 題，完成後得到 1 顆星，每天最多 3 顆星。家長可以在設定頁建立小孩 Profile、最多 10 組字詞課程，並調整每次練習題數。

設計紀錄請看 [DESIGN.md](./DESIGN.md)。

## 本機預覽

```bash
python3 -m http.server 5174
```

然後打開：

```text
http://localhost:5174/index.html
```

## 部署

這是純靜態網站，可以直接部署到 Vercel。

## 資料儲存

目前資料會存在 Firebase Firestore，並保留 localStorage 作為本機備份。開啟 App 即自動同步小孩、課程、題數和星星，不需要輸入密碼。

目前 Firestore rules 是家庭自用快速版：

```text
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /families/miffy-chinese-garden {
      allow read, write: if true;
    }
  }
}
```
