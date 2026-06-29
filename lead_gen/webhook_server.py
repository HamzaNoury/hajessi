#!/usr/bin/env python3
"""Webhook واتساب — كيسمع للردود ويحدّث status → replied."""

from __future__ import annotations

import logging
import os
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, request

load_dotenv(Path(__file__).parent / ".env")

from main import SUPABASE_KEY, SUPABASE_URL, _get_supabase  # noqa: E402

log = logging.getLogger(__name__)

WA_VERIFY_TOKEN = os.getenv("WA_VERIFY_TOKEN", "lead_gen_verify_token")
WEBHOOK_PORT = int(os.getenv("WEBHOOK_PORT", "5050"))

app = Flask(__name__)


def _normalize_phone(phone: str) -> str:
    digits = "".join(c for c in (phone or "") if c.isdigit())
    if digits.startswith("0") and len(digits) == 10:
        return "212" + digits[1:]
    return digits


def _mark_lead_replied(phone: str, text: str = "") -> bool:
    try:
        sb = _get_supabase()
    except SystemExit:
        from supabase import create_client
        sb = create_client(SUPABASE_URL, SUPABASE_KEY)

    normalized = _normalize_phone(phone)
    if not normalized:
        return False

    candidates = {normalized, f"+{normalized}"}
    if normalized.startswith("212"):
        candidates.add("0" + normalized[3:])

    updated = False
    for candidate in candidates:
        result = (
            sb.table("leads")
            .update({
                "status": "replied",
                "replied_at": datetime.now(timezone.utc).isoformat(),
            })
            .eq("phone", candidate)
            .execute()
        )
        if result.data:
            name = result.data[0].get("business_name", candidate)
            log.info(f"✅ replied: {name} — {text[:60]}")
            updated = True
            break

    if not updated:
        log.warning(f"ما لقيناش lead للرقم {phone}")
    return updated


@app.route("/webhook", methods=["GET"])
def verify():
    mode = request.args.get("hub.mode")
    token = request.args.get("hub.verify_token")
    challenge = request.args.get("hub.challenge")
    if mode == "subscribe" and token == WA_VERIFY_TOKEN:
        log.info("Webhook verified")
        return challenge or "", 200
    return "Forbidden", 403


@app.route("/webhook", methods=["POST"])
def incoming():
    data = request.get_json(silent=True) or {}
    try:
        for entry in data.get("entry", []):
            for change in entry.get("changes", []):
                value = change.get("value", {})
                for msg in value.get("messages", []):
                    if msg.get("type") != "text":
                        continue
                    phone = msg.get("from", "")
                    text = msg.get("text", {}).get("body", "")
                    _mark_lead_replied(phone, text)
    except Exception as e:
        log.error(f"Webhook parse error: {e}")
    return {"status": "ok"}, 200


@app.route("/health", methods=["GET"])
def health():
    return {"ok": True, "service": "whatsapp-webhook"}, 200


def run_webhook_server() -> None:
    logging.basicConfig(level=logging.INFO)
    print(f"🌐 Webhook: http://localhost:{WEBHOOK_PORT}/webhook")
    print(f"   Verify token: {WA_VERIFY_TOKEN}")
    print("   Meta → WhatsApp → Configuration → Callback URL")
    app.run(host="0.0.0.0", port=WEBHOOK_PORT, debug=False)


if __name__ == "__main__":
    run_webhook_server()
