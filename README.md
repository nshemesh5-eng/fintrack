# FinTrack – ניהול פיננסי חכם

אפליקציית React + Supabase + Claude AI למעקב אחרי הכנסות, הוצאות, תקציבים ויעדים.

---

## שלב 1 – Supabase (מסד נתונים)

1. כנס ל-https://supabase.com ולחץ "Start your project"
2. צור חשבון חינמי והגדר פרויקט חדש (בחר אזור Europe London לביצועים טובים)
3. עבור ל-**SQL Editor** בתפריט הצד
4. פתח את הקובץ `supabase-schema.sql` מהפרויקט, העתק את כל התוכן והרץ אותו
5. עבור ל-**Settings → API**:
   - העתק את `Project URL` → זה ה-`VITE_SUPABASE_URL`
   - העתק את `anon public key` → זה ה-`VITE_SUPABASE_ANON_KEY`

---

## שלב 2 – Anthropic API (ניתוח AI)

1. כנס ל-https://console.anthropic.com
2. עבור ל-API Keys ולחץ "Create Key"
3. שמור את ה-key → זה ה-`VITE_ANTHROPIC_API_KEY`

> **הערה:** בשביל שימוש אישי זה בסדר. לשימוש מסחרי, העבר את קריאות ה-AI לפונקציית backend.

---

## שלב 3 – הרצה מקומית

```bash
# התקן תלויות
npm install

# הגדר משתני סביבה
cp .env.example .env.local
# פתח .env.local ומלא את הערכים מהשלבים הקודמים

# הרץ בסביבת פיתוח
npm run dev
```

פתח http://localhost:3000

---

## שלב 4 – פרסום ב-Vercel (חינמי, קבוע)

1. כנס ל-https://github.com וצור repository חדש (קרא לו `fintrack`)
2. אתחל git ודחף את הקוד:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/fintrack.git
   git push -u origin main
   ```
3. כנס ל-https://vercel.com → "Add New Project" → בחר את ה-repository
4. תחת **Environment Variables** הוסף:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_ANTHROPIC_API_KEY`
5. לחץ **Deploy**

תוך דקה תקבל לינק קבוע כמו `fintrack-your-name.vercel.app`

---

## מבנה הפרויקט

```
src/
├── components/
│   ├── AddTransaction.tsx   # טופס הוספת עסקה
│   ├── TransactionList.tsx  # טבלת עסקאות
│   ├── BudgetPanel.tsx      # תקציבים לפי קטגוריה
│   ├── GoalsPanel.tsx       # יעדים פיננסיים
│   ├── InsightCard.tsx      # כרטיס תובנת AI
│   └── MonthlyChart.tsx     # גרף חודשי
├── hooks/
│   ├── useTransactions.ts   # CRUD עסקאות
│   ├── useBudgets.ts        # CRUD תקציבים
│   └── useGoals.ts          # CRUD יעדים
├── lib/
│   ├── supabase.ts          # Supabase client
│   └── ai.ts                # ניתוח AI עם Claude
├── pages/
│   ├── Auth.tsx             # דף כניסה/הרשמה
│   └── Dashboard.tsx        # דשבורד ראשי
└── types/index.ts           # TypeScript types
```

---

## פיצ'רים

- ✅ כניסה/הרשמה עם אימייל+סיסמה
- ✅ הוספה ומחיקה של הכנסות והוצאות
- ✅ קטגוריות מפורטות
- ✅ תקציבים חודשיים לפי קטגוריה עם progress bar
- ✅ יעדים פיננסיים עם מעקב התקדמות
- ✅ גרף 6 חודשים אחרונים
- ✅ ניתוח AI חכם עם Claude – המלצות, אזהרות, תחזיות
- ✅ כל הנתונים נשמרים בענן (Supabase)
- ✅ עיצוב עברי RTL מלא
- ✅ Responsive למובייל
