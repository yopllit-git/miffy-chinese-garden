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

## Firebase

正式版使用 Firebase Auth + Firestore 同步資料。

Firebase Console 需要啟用：

- Authentication → Sign-in method → Google
- Firestore Database

Firestore rules：

```text
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

資料路徑：

```text
users/{uid}/app/miffy-chinese-garden
```
