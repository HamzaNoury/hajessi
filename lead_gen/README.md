# AI Lead Gen Agent

يقلب على شركات فـ Google Maps → أوديت PDF → ميساج واتساب بالدارجة → تتبع الردود.

## Setup

```bash
cd lead_gen
pip install -r requirements.txt
playwright install chromium
cp .env.example .env
# عمر .env بالمفاتيح ديالك
```

## Supabase

1. شغّل `supabase_schema.sql` (جدول جديد)
2. ولا `supabase_migration_v2.sql` (تحديث جدول موجود)

## Usage

```bash
# فحص المفاتيح
python main.py --check-env

# Scrape
python main.py --scrape --query "écoles privées" --location "Taroudant" --max 30

# Process: أوديت + PDF + ميساج (بلا واتساب)
python main.py --process --skip-whatsapp

# فلترة leads
python main.py --process --skip-whatsapp --require-phone --no-website-only --min-rating 3.5

# Sync Google Sheets
python main.py --sync-sheets

# Webhook واتساب (ردود → replied)
python main.py --webhook

# Dashboard
streamlit run dashboard.py
```

## Status Values

| Status    | معنى                                      |
|-----------|-------------------------------------------|
| `new`     | lead جديد، مازال ما تمعالجش              |
| `audited` | أوديت + PDF + ميساج — واتساب ما تصيفطش   |
| `sent`    | تصيفط الميساج بنجاح                       |
| `failed`  | فشل الأوديت أو توليد الميساج              |
| `replied` | الزبون جاوب (webhook أوتوماتيك)           |

## Architecture

```
main.py
├── search_maps()       → Google Maps → Supabase + Sheets
├── audit_business()    → Playwright + score
├── audit_pdf.py        → PDF (screenshot + 5 نقاط)
├── generate_message()  → Cursor API → ميساج دارجة
├── send_whatsapp()     → WA Cloud API
├── webhook_server.py   → ردود → replied
└── dashboard.py        → Streamlit UI
```

## PDF Audits

كل lead معالج كيتولّد PDF فـ `lead_gen/audits/`:
- Score /100
- Screenshot ديال الموقع (إلا كان)
- 5 نقاط تحسين
- معلومات Google Maps

## Webhook Setup

1. `ngrok http 5050` (أو deploy على server)
2. Meta Developers → WhatsApp → Configuration
3. Callback URL: `https://xxx.ngrok.io/webhook`
4. Verify token: نفس `WA_VERIFY_TOKEN` فـ `.env`

## Notes

- `--skip-whatsapp` = status `audited` (ماشي `failed`)
- Delay: 60s بين كل ميساج واتساب
- Logs: `lead_gen.log`
