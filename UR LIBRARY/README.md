# 📚 UR LIBRARY

**مكتبتي الشخصية السحابية للملفات الدراسية**

مكتبة PDF سحابية شخصية مجانية 100% مع Cloudflare، بدون أي رسوم أو حدود.

---

## ✨ المميزات

- 📤 **رفع سهل**: أرفع PDF وصنّفه فوراً
- 🔍 **بحث وفلترة**: ابحث في ملفاتك بسرعة
- 🌙 **Dark Mode**: دعم الوضع الليلي الكامل
- ☁️ **سحابي**: ملفاتك متاحة من أي جهاز
- 💰 **مجاني 100%**: بدون تكاليف أبداً
- 📱 **Responsive**: يعمل على الموبايل والتابلت
- 🚀 **سريع جداً**: تحميل فوري للملفات

---

## 🛠️ المتطلبات

- حساب **Cloudflare** (مجاني)
- **Node.js** 14+ و **npm**
- محرر أكواد (VS Code اختياري)
- متصفح حديث

---

## 📋 خطوات الـ Setup

### 1️⃣ الخطوة الأولى: إنشاء حساب Cloudflare

1. اذهب إلى [cloudflare.com](https://cloudflare.com)
2. اضغط "Sign Up" (مجاني)
3. أنشئ حسابك وتأكيد البريد الإلكتروني

### 2️⃣ الخطوة الثانية: استنساخ أو تحضير الملفات

```bash
# انسخ جميع الملفات أعلاه في مجلد جديد
mkdir ur-library
cd ur-library

# تثبيت المكتبات
npm install
```

### 3️⃣ الخطوة الثالثة: إنشاء R2 Bucket

1. من لوحة Cloudflare → **R2**
2. اضغط **"Create bucket"**
3. الاسم: `ur-library-files`
4. اتركه مع الإعدادات الافتراضية
5. اضغط **Create**

#### ⚠️ تفعيل الوصول العام (مهم جداً):

1. افتح الـ bucket `ur-library-files`
2. اذهب إلى **Settings**
3. في **Public access**، اختر **"Allow public access"**
4. اضغط **Save**

### 4️⃣ الخطوة الرابعة: ربط الـ Worker

1. من لوحة Cloudflare → **Workers and Pages**
2. اضغط **Create application**
3. اختر **Create a Worker**
4. اسم Worker: `ur-library-api`
5. اضغط **Create service**

### 5️⃣ الخطوة الخامسة: Deploy الـ Worker

```bash
# تسجيل الدخول إلى Cloudflare
wrangler login

# Deploy الـ Worker
wrangler deploy
```

بعد الـ Deploy ستحصل على URL مثل:
```
https://ur-library-api.YOUR_ACCOUNT.workers.dev
```

### 6️⃣ الخطوة السادسة: تحديث الإعدادات

في ملف `app.js`، غيّر الـ URLs:

```javascript
// Configuration
const CONFIG = {
  API_URL: 'https://ur-library-api.YOUR_ACCOUNT.workers.dev',
  R2_URL: 'https://ur-library-files.YOUR_ACCOUNT.r2.cloudflarestorage.com',
  STORAGE_KEY: 'ur-library-files',
};
```

و في ملف `worker.js`:

```javascript
// غيّر YOUR_ACCOUNT في رد الـ upload:
url: `https://ur-library-files.YOUR_ACCOUNT.r2.cloudflarestorage.com/uploads/${fileName}`,
```

### 7️⃣ الخطوة السابعة: Deploy الموقع (Frontend)

#### الخيار أ: Cloudflare Pages

1. اضفع الملفات إلى GitHub
2. من Cloudflare Dashboard → **Pages**
3. **Create a project** → **Connect to Git**
4. اختر Repository
5. Build settings:
   - Build command: (اتركه فارغ)
   - Build output directory: `.`
6. **Save and Deploy**

#### الخيار ب: نشر محلي للاختبار

```bash
# تشغيل محلي
npx http-server

# أو استخدم Python
python -m http.server 8000
```

---

## 🚀 الاستخدام

### رفع ملف:

1. اضغط **+ رفع ملف PDF**
2. اختر ملف PDF
3. اختر المادة والنوع والترم والسنة
4. اضغط **حفظ الملف**

### فتح ملف:

1. جد الملف في المكتبة
2. اضغط **فتح**
3. يفتح في tab جديد

### حذف ملف:

1. جد الملف
2. اضغط **حذف**
3. أكد الحذف

### البحث:

1. اكتب في صندوق البحث
2. ستظهر النتائج فوراً

---

## 📊 الحدود المجانية

| الخدمة | الحد الأقصى | الملاحظة |
|--------|----------|--------|
| **R2 Storage** | 10 GB/شهر | = 200-300 ملف PDF متوسط |
| **Workers Requests** | 100,000/يوم | يكفي لـ 1000+ استخدام يومي |
| **Pages** | Unlimited | بدون حدود للاستضافة |

---

## 🔧 المتغيرات البيئية

إنشاء ملف `.env` (اختياري):

```env
API_URL=https://ur-library-api.YOUR_ACCOUNT.workers.dev
R2_URL=https://ur-library-files.YOUR_ACCOUNT.r2.cloudflarestorage.com
```

---

## 🐛 استكشاف الأخطاء

### الملفات لا تفتح:

- تأكد من تفعيل **Public access** في R2
- تحقق من صحة URLs في `app.js`

### الـ Upload لا يعمل:

- تأكد من تنشيط R2 Bucket
- تحقق من Worker API URL صحيح
- تأكد من CORS headers في Worker

### البحث لا يعمل:

- حاول تحديث الصفحة
- امسح localStorage: `localStorage.clear()`

---

## 📝 ملاحظات مهمة

1. **الملفات المحفوظة**: جميع الملفات محفوظة في R2 ويمكن الوصول إليها من أي جهاز
2. **الخصوصية**: مكتبتك شخصية تماماً (لا يوجد تسجيل دخول بعد، فقط local storage)
3. **الحجم**: كل ملف يمكن أن يصل إلى 50 MB
4. **المتصفح**: ستحتاج إلى دعم localStorage و Fetch API

---

## 🎨 تخصيص الموقع

### تغيير الألوان:

في ملف `style.css`:

```css
:root {
  --accent-color: #3b82f6; /* غيّر اللون الأساسي */
}
```

### إضافة موادّ جديدة:

في ملف `index.html`:

```html
<option>موادك الجديدة</option>
```

---

## 📦 البنية النهائية

```
ur-library/
├── index.html          # الصفحة الرئيسية
├── style.css           # التصميم مع Dark Mode
├── app.js              # منطق الموقع
├── worker.js           # API الـ Worker
├── wrangler.toml       # إعدادات Worker
├── package.json        # المكتبات
├── .gitignore          # ملفات لا تُرفع
└── README.md           # هذا الملف
```

---

## 🌐 الـ URLs النهائية

بعد الـ Deploy:

- **Frontend**: `https://ur-library.pages.dev`
- **Backend API**: `https://ur-library-api.YOUR_ACCOUNT.workers.dev`
- **R2 Files**: `https://ur-library-files.YOUR_ACCOUNT.r2.cloudflarestorage.com`

---

## 🤝 المساهمة

هذا المشروع شخصي، لكن يمكنك نسخه وتطويره حسب احتياجاتك.

---

## 📄 الترخيص

MIT License - استخدمه كما تريد

---

## 💬 الدعم

إذا واجهت مشاكل:

1. تحقق من **Console** في المتصفح (F12)
2. اقرأ الخطأ بعناية
3. تحقق من جميع الـ URLs صحيحة
4. حاول مسح localStorage وأعد تحميل الصفحة

---

## 🎯 التطويرات المستقبلية

- [ ] Login/Register حقيقي
- [ ] Sharing الملفات
- [ ] PDF Annotations
- [ ] PWA (Offline mode)
- [ ] Backup & Export
- [ ] Advanced Search

---

**استمتع بـ UR LIBRARY! 🚀**
