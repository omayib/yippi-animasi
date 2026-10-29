#!/usr/bin/env python3
"""Send rendered videos to a TikTok account's inbox as drafts (Content Posting API, video.upload).

Nothing is ever published by this tool: the video lands in the TikTok inbox and the creator
finishes and posts it in the TikTok app.

    python3 tools/tiktok_upload.py setup                 # once: client key + secret
    python3 tools/tiktok_upload.py login                 # connect a TikTok account
    python3 tools/tiktok_upload.py whoami                # show the connected account
    python3 tools/tiktok_upload.py upload out/wijen-gate/wijen-gate.mp4
    python3 tools/tiktok_upload.py logout                # revoke access, delete stored tokens

Credentials and tokens live in ~/.short-and-fun/ (override with SHORT_AND_FUN_HOME), never in
the repo. Tokens are encrypted at rest with a key kept in the same folder (file mode 600).
Requires Python 3.9+ and the `cryptography` package.
"""
import argparse, getpass, json, math, os, secrets, sys, time, urllib.error, urllib.parse, urllib.request, webbrowser
from pathlib import Path

try:
    from cryptography.fernet import Fernet, InvalidToken
except ImportError:  # pragma: no cover
    sys.exit('This tool needs the cryptography package: pip install cryptography')

API = os.environ.get('TIKTOK_API_BASE', 'https://open.tiktokapis.com')
AUTH_URL = os.environ.get('TIKTOK_AUTH_URL', 'https://www.tiktok.com/v2/auth/authorize/')
REDIRECT_URI = os.environ.get('TIKTOK_REDIRECT_URI', 'https://omayib.github.io/yippi-animasi/callback.html')
SCOPES = 'user.info.basic,video.upload'
HOME = Path(os.environ.get('SHORT_AND_FUN_HOME', Path.home() / '.short-and-fun'))
MB = 1024 * 1024
MIME = {'.mp4': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm'}


class ApiError(Exception):
    pass


# ---------- local storage ----------
def _private_write(path, data: bytes):
    HOME.mkdir(mode=0o700, parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + '.tmp')
    fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, 'wb') as f:
        f.write(data)
    os.replace(tmp, path)


def load_config():
    cfg = {}
    p = HOME / 'config.json'
    if p.exists():
        cfg = json.loads(p.read_text())
    cfg['client_key'] = os.environ.get('TIKTOK_CLIENT_KEY', cfg.get('client_key'))
    cfg['client_secret'] = os.environ.get('TIKTOK_CLIENT_SECRET', cfg.get('client_secret'))
    if not cfg.get('client_key') or not cfg.get('client_secret'):
        sys.exit('No client key/secret yet. Run: python3 tools/tiktok_upload.py setup')
    return cfg


def _fernet():
    kp = HOME / 'key'
    if not kp.exists():
        _private_write(kp, Fernet.generate_key())
    return Fernet(kp.read_bytes())


def save_tokens(tok):
    _private_write(HOME / 'tokens.enc', _fernet().encrypt(json.dumps(tok).encode()))


def load_tokens():
    p = HOME / 'tokens.enc'
    if not p.exists():
        sys.exit('No TikTok account connected. Run: python3 tools/tiktok_upload.py login')
    try:
        return json.loads(_fernet().decrypt(p.read_bytes()))
    except InvalidToken:
        sys.exit('Stored tokens could not be decrypted. Run logout, then login again.')


def delete_tokens():
    for name in ('tokens.enc', 'state'):
        (HOME / name).unlink(missing_ok=True)


# ---------- HTTP ----------
def _request(method, url, *, form=None, body=None, headers=None, token=None, raw=False):
    headers = dict(headers or {})
    data = None
    if form is not None:
        data = urllib.parse.urlencode(form).encode()
        headers['Content-Type'] = 'application/x-www-form-urlencoded'
    elif body is not None and not raw:
        data = json.dumps(body).encode()
        headers['Content-Type'] = 'application/json; charset=UTF-8'
    elif raw:
        data = body
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            status, text = r.status, r.read()
    except urllib.error.HTTPError as e:
        status, text = e.code, e.read()
    if raw:
        return status, text
    try:
        payload = json.loads(text) if text else {}
    except ValueError:
        raise ApiError(f'HTTP {status}: {text[:200]!r}')
    err = payload.get('error')
    if isinstance(err, dict) and err.get('code') not in (None, 'ok'):
        raise ApiError(f"{err.get('code')}: {err.get('message')} (log_id {payload.get('error', {}).get('log_id') or payload.get('log_id')})")
    if isinstance(err, str):  # oauth endpoints
        raise ApiError(f"{err}: {payload.get('error_description')}")
    if status >= 400:
        raise ApiError(f'HTTP {status}: {payload}')
    return payload


def _store_token_response(r, cfg):
    now = int(time.time())
    tok = {'access_token': r['access_token'], 'refresh_token': r['refresh_token'], 'open_id': r.get('open_id'),
           'scope': r.get('scope', ''), 'expires_at': now + int(r.get('expires_in', 86400)) - 120,
           'refresh_expires_at': now + int(r.get('refresh_expires_in', 31536000)) - 120}
    save_tokens(tok)
    return tok


def access_token(cfg):
    tok = load_tokens()
    if time.time() < tok['expires_at']:
        return tok
    if time.time() >= tok['refresh_expires_at']:
        delete_tokens()
        sys.exit('TikTok connection expired. Run login again.')
    r = _request('POST', f'{API}/v2/oauth/token/', form={
        'client_key': cfg['client_key'], 'client_secret': cfg['client_secret'],
        'grant_type': 'refresh_token', 'refresh_token': tok['refresh_token']})
    return _store_token_response(r, cfg)


# ---------- chunking ----------
def chunk_plan(size, chunk=10 * MB):
    """Return (chunk_size, total_chunk_count) following TikTok's media transfer rules:
    one chunk when the file is <= 64 MB, otherwise fixed chunks of 5-64 MB with the
    remainder merged into the last chunk (which may be up to 128 MB)."""
    if size <= 0:
        raise ValueError('empty file')
    if size <= 64 * MB:
        return size, 1
    chunk = max(5 * MB, min(chunk, 64 * MB))
    count = size // chunk
    if count > 1000:
        chunk = math.ceil(size / 1000)
        count = size // chunk
    return chunk, count


def chunk_ranges(size, chunk_size, count):
    for i in range(count):
        start = i * chunk_size
        end = size - 1 if i == count - 1 else start + chunk_size - 1
        yield start, end


# ---------- commands ----------
def cmd_setup(a):
    HOME.mkdir(mode=0o700, parents=True, exist_ok=True)
    old = json.loads((HOME / 'config.json').read_text()) if (HOME / 'config.json').exists() else {}
    key = input(f"Client key [{old.get('client_key', '')}]: ").strip() or old.get('client_key')
    secret = getpass.getpass('Client secret (hidden): ').strip() or old.get('client_secret')
    if not key or not secret:
        sys.exit('Both client key and client secret are required.')
    _private_write(HOME / 'config.json', json.dumps({'client_key': key, 'client_secret': secret}).encode())
    print(f'Saved to {HOME / "config.json"} (only readable by you).')


def cmd_login(a):
    cfg = load_config()
    state = secrets.token_hex(16)
    _private_write(HOME / 'state', state.encode())
    url = AUTH_URL + '?' + urllib.parse.urlencode({'client_key': cfg['client_key'], 'scope': SCOPES, 'response_type': 'code',
                                                   'redirect_uri': REDIRECT_URI, 'state': state})
    print('Open this link and approve Short-and-fun:\n\n  ' + url + '\n')
    if not a.no_browser:
        try:
            webbrowser.open(url)
        except Exception:
            pass
    pasted = input('Paste the code from the "TikTok connected" page: ').strip()
    if ':' in pasted and pasted.split(':', 1)[0] == state:
        code = pasted.split(':', 1)[1]
    elif ':' in pasted and len(pasted.split(':', 1)[0]) == 32:
        sys.exit('That code belongs to a different login attempt. Run login again and use the new link.')
    else:
        sys.exit('That does not look like a Short-and-fun connection code. Copy it with the "Copy code" button.')
    r = _request('POST', f'{API}/v2/oauth/token/', form={
        'client_key': cfg['client_key'], 'client_secret': cfg['client_secret'], 'code': code,
        'grant_type': 'authorization_code', 'redirect_uri': REDIRECT_URI})
    (HOME / 'state').unlink(missing_ok=True)
    tok = _store_token_response(r, cfg)
    missing = [s for s in ('video.upload',) if s not in tok['scope']]
    if missing:
        print(f"Warning: TikTok did not grant {', '.join(missing)}. Uploads will fail until it is approved.")
    cmd_whoami(a)


def cmd_whoami(a):
    cfg = load_config()
    tok = access_token(cfg)
    r = _request('GET', f'{API}/v2/user/info/?fields=open_id,display_name,avatar_url', token=tok['access_token'])
    u = r.get('data', {}).get('user', {})
    print(f"Connected TikTok account: {u.get('display_name') or '(no display name)'}  [open_id {u.get('open_id', tok.get('open_id'))}]")


def cmd_upload(a):
    cfg = load_config()
    path = Path(a.video)
    if not path.is_file():
        sys.exit(f'File not found: {path}')
    mime = MIME.get(path.suffix.lower())
    if not mime:
        sys.exit('TikTok accepts .mp4, .mov or .webm')
    size = path.stat().st_size
    chunk_size, count = chunk_plan(size)
    tok = access_token(cfg)
    init = _request('POST', f'{API}/v2/post/publish/inbox/video/init/', token=tok['access_token'], body={
        'source_info': {'source': 'FILE_UPLOAD', 'video_size': size, 'chunk_size': chunk_size, 'total_chunk_count': count}})
    publish_id, upload_url = init['data']['publish_id'], init['data']['upload_url']
    print(f'Uploading {path.name} ({size / MB:.1f} MB, {count} chunk{"s" if count > 1 else ""})')
    with open(path, 'rb') as f:
        for i, (start, end) in enumerate(chunk_ranges(size, chunk_size, count), 1):
            f.seek(start)
            data = f.read(end - start + 1)
            for attempt in range(4):
                status, text = _request('PUT', upload_url, body=data, raw=True, headers={
                    'Content-Type': mime, 'Content-Length': str(len(data)), 'Content-Range': f'bytes {start}-{end}/{size}'})
                if status in (201, 206):
                    break
                if status >= 500 and attempt < 3:
                    time.sleep(2 ** attempt)
                    continue
                raise ApiError(f'chunk {i}/{count} failed with HTTP {status}: {text[:200]!r}')
            print(f'  chunk {i}/{count} sent')
    if a.no_wait:
        print(f'Sent. publish_id {publish_id}')
        return
    for _ in range(60):
        time.sleep(5)
        r = _request('POST', f'{API}/v2/post/publish/status/fetch/', token=access_token(cfg)['access_token'], body={'publish_id': publish_id})
        st = r.get('data', {}).get('status')
        if st == 'SEND_TO_USER_INBOX':
            print('Done. Open the TikTok app and tap the inbox notification to finish and post the video.')
            return
        if st == 'PUBLISH_COMPLETE':
            print('Done. TikTok reports the video as posted.')
            return
        if st == 'FAILED':
            raise ApiError(f"TikTok could not process the video: {r.get('data', {}).get('fail_reason')}")
        print(f'  TikTok status: {st}')
    print(f'Still processing. Check later with publish_id {publish_id}.')


def cmd_logout(a):
    p = HOME / 'tokens.enc'
    if p.exists():
        try:
            cfg = load_config()
            tok = load_tokens()
            _request('POST', f'{API}/v2/oauth/revoke/', form={'client_key': cfg['client_key'], 'client_secret': cfg['client_secret'], 'token': tok['access_token']})
            print('Access revoked on TikTok.')
        except (ApiError, SystemExit, OSError) as e:
            print(f'Could not revoke on TikTok ({e}); remove the app in TikTok settings to be sure.')
    delete_tokens()
    print('Local tokens deleted.')


def main(argv=None):
    ap = argparse.ArgumentParser(description='Send videos to your TikTok drafts (Short-and-fun).')
    sub = ap.add_subparsers(dest='cmd', required=True)
    sub.add_parser('setup', help='save client key and secret')
    lg = sub.add_parser('login', help='connect a TikTok account')
    lg.add_argument('--no-browser', action='store_true')
    sub.add_parser('whoami', help='show the connected account')
    up = sub.add_parser('upload', help='send a video to the TikTok inbox')
    up.add_argument('video')
    up.add_argument('--no-wait', action='store_true', help='do not wait for TikTok to finish processing')
    sub.add_parser('logout', help='revoke access and delete stored tokens')
    a = ap.parse_args(argv)
    try:
        {'setup': cmd_setup, 'login': cmd_login, 'whoami': cmd_whoami, 'upload': cmd_upload, 'logout': cmd_logout}[a.cmd](a)
    except ApiError as e:
        sys.exit(f'TikTok API error: {e}')
    except urllib.error.URLError as e:
        sys.exit(f'Could not reach TikTok: {e.reason}')


if __name__ == '__main__':
    main()
