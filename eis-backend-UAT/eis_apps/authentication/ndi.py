# backend/eis_apps/authentication/ndi.py
"""
Bhutan NDI API client.
Credentials are read from SystemSetting DB model at runtime — no restart needed.
"""
import logging
import time
import requests
from django.core.cache import cache

logger = logging.getLogger(__name__)

CACHE_KEY_TOKEN = "ndi_access_token"


def _cfg():
    """Get NDI config from SystemSetting DB."""
    from eis_apps.administration.models import SystemSetting
    return SystemSetting.get()


# ── Step 1: Get NDI access token (cached) ────────────────────────
def get_ndi_token() -> str:
    """
    Fetch and cache the NDI OAuth2 access token.
    Reads credentials from SystemSetting DB — changes take effect within 60s.
    """
    cached = cache.get(CACHE_KEY_TOKEN)
    if cached:
        return cached

    cfg = _cfg()
    if not cfg.ndi_client_id or not cfg.ndi_client_secret:
        raise ValueError(
            "NDI Client ID and Secret are not configured. "
            "Set them in System Settings → NDI tab."
        )

    resp = requests.post(
        cfg.ndi_auth_url,
        json={
            "client_id":     cfg.ndi_client_id,
            "client_secret": cfg.ndi_client_secret,
            "grant_type":    "client_credentials",
        },
        timeout=10,
    )
    resp.raise_for_status()
    data       = resp.json()
    token      = data.get("access_token") or data.get("data", {}).get("access_token")
    expires_in = int(data.get("expires_in", 3600))

    cache.set(CACHE_KEY_TOKEN, token, timeout=max(expires_in - 60, 60))
    logger.info("NDI access token obtained and cached for %ds", expires_in)
    return token


# ── Step 2: Create proof request ─────────────────────────────────
def create_proof_request(proof_name: str = "EIS Login - Verify Identity") -> dict:
    """
    Create a proof request using the Foundational ID schema.
    Returns: { proofRequestURL, deepLinkURL, proofRequestThreadId }
    """
    token = get_ndi_token()
    cfg   = _cfg()

    payload = {
        "proofName": proof_name,
        "purpose":   "login",
        "proofAttributes": [
            {
                "name": "ID Number",
                "restrictions": [{"schema_name": cfg.ndi_schema_id}],
            },
            {
                "name": "Full Name",
                "restrictions": [{"schema_name": cfg.ndi_schema_id}],
            },
        ],
    }

    resp = requests.post(
        cfg.ndi_verifier_url,
        json=payload,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type":  "application/json",
        },
        timeout=15,
    )

    logger.debug("NDI proof request response: status=%s body=%s", resp.status_code, resp.text)

    if not resp.ok:
        logger.error("NDI proof request failed: status=%s body=%s", resp.status_code, resp.text)
        raise Exception(f"NDI verifier returned {resp.status_code}: {resp.text}")

    resp.raise_for_status()
    data = resp.json().get("data", {})

    logger.info("NDI proof request created: threadId=%s", data.get("proofRequestThreadId"))
    return {
        "proof_request_url": data.get("proofRequestURL"),
        "deep_link_url":     data.get("deepLinkURL"),
        "thread_id":         data.get("proofRequestThreadId"),
    }


# ── Step 3: Get proof status (poll) ──────────────────────────────
def get_proof_status(thread_id: str) -> dict:
    """
    Poll NDI verifier for proof request status.
    Returns: { status, relationshipDid }
    """
    token = get_ndi_token()
    cfg   = _cfg()

    resp = requests.get(
        cfg.ndi_verifier_url,
        params={"threadId": thread_id, "page": 1, "pageSize": 1},
        headers={"Authorization": f"Bearer {token}"},
        timeout=10,
    )
    resp.raise_for_status()
    data = resp.json().get("data", {})

    return {
        "status":           data.get("status"),
        "relationship_did": data.get("relationshipDid"),
        "thread_id":        thread_id,
    }


# ── Webhook: register with NDI ────────────────────────────────────
def register_webhook(webhook_id: str = None, webhook_url: str = None, token_secret: str = None) -> dict:
    """
    Register (or update) our webhook endpoint with NDI.
    Uses OAuth2 v2 (fixed token) authentication.
    Reads config from SystemSetting DB if params not provided.
    Automatically tries UPDATE if webhook ID is already registered.
    """
    cfg = _cfg()
    ndi_token    = get_ndi_token()
    webhook_id   = webhook_id   or cfg.ndi_webhook_id
    webhook_url  = webhook_url  or (cfg.ndi_webhook_base_url.rstrip("/") + "/api/auth/ndi/webhook/")
    token_secret = token_secret or cfg.ndi_webhook_secret
    webhook_base = (cfg.ndi_webhook_register_url or "https://demo-client.bhutanndi.com/webhook/v1").rstrip("/")

    if not webhook_url or "your-ngrok" in webhook_url:
        raise ValueError("Webhook Base URL not set. Update it in System Settings → NDI tab.")

    if not token_secret:
        raise ValueError(
            "NDI Webhook Secret is empty. Set it in System Settings → NDI tab.\n"
            "This is the fixed token NDI uses to authenticate calls to your webhook.\n"
            "Choose any strong random string e.g. 'eis-bhutan-2026-secret'"
        )

    payload = {
        "webhookId":  webhook_id,
        "webhookURL": webhook_url,
        "authentication": {
            "type":    "OAuth2",
            "version": "v2",
            "data":    {"token": token_secret},
        },
    }
    headers = {"Authorization": f"Bearer {ndi_token}", "Content-Type": "application/json"}

    # Try register first
    resp = requests.post(f"{webhook_base}/register", json=payload, headers=headers, timeout=10)

    # 409 = duplicate webhookId OR webhookURL already exists on NDI side
    if resp.status_code == 409:
        error_body = resp.text
        logger.info("409 conflict: %s", error_body[:200])

        # If URL is the conflict, try with a unique path suffix
        if "webhookURL" in error_body or "Duplicate" in error_body:
            import time as _time
            unique_url = webhook_url.rstrip("/") + f"?v={int(_time.time())}"
            payload_v2 = {**payload, "webhookURL": unique_url}
            resp2 = requests.post(f"{webhook_base}/register", json=payload_v2, headers=headers, timeout=10)
            if resp2.ok:
                logger.info("NDI webhook registered with unique URL: %s", unique_url)
                # Save the working URL back to DB
                try:
                    from eis_apps.administration.models import SystemSetting
                    SystemSetting.invalidate_cache()
                except Exception:
                    pass
                return resp2.json()

        raise Exception(
            f"409 Conflict: {error_body[:300]}\n\n"
            "The webhook ID or URL is already registered on NDI's system.\n"
            "Fix: Go to System Settings → NDI tab and change Webhook ID to a "
            "completely new unique value like 'eis-doe-2026-01' then save and run again."
        )

    if not resp.ok:
        raise Exception(f"{resp.status_code} Error: {resp.text[:500]}")

    resp.raise_for_status()
    logger.info("NDI webhook registered: %s → %s", webhook_id, webhook_url)
    return resp.json()


def subscribe_webhook(webhook_id: str, thread_id: str) -> dict:
    """Subscribe webhook to a specific threadId."""
    cfg       = _cfg()
    ndi_token = get_ndi_token()
    base      = cfg.ndi_webhook_register_url or "https://demo-client.bhutanndi.com/webhook/v1"
    resp = requests.post(
        f"{base}/subscribe",
        json={"webhookId": webhook_id, "threadId": thread_id},
        headers={"Authorization": f"Bearer {ndi_token}"},
        timeout=10,
    )
    resp.raise_for_status()
    return resp.json()


def unsubscribe_webhook(thread_id: str) -> dict:
    """Unsubscribe webhook from a threadId after process completes."""
    cfg       = _cfg()
    ndi_token = get_ndi_token()
    base      = cfg.ndi_webhook_register_url or "https://demo-client.bhutanndi.com/webhook/v1"
    resp = requests.post(
        f"{base}/unsubscribe",
        json={"threadId": thread_id},
        headers={"Authorization": f"Bearer {ndi_token}"},
        timeout=10,
    )
    resp.raise_for_status()
    return resp.json()
    resp.raise_for_status()
    return resp.json()