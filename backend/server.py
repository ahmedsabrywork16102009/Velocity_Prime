"""
Velocity Prime Download Server — with progress tracking, playlist support, and adaptive queue
"""
import json
import subprocess
import os
import sys
import threading
import re
import time
import glob
import shutil
from pathlib import Path
from http.server import BaseHTTPRequestHandler, HTTPServer

PORT = 9527
PYTHON_EXE = r"C:\Users\Ahmed\AppData\Local\Python\pythoncore-3.14-64\python.exe"

# Global state
downloads = {}  # id -> { status, progress, filename, error, process, speed_bytes }
_dl_counter = 0
_lock = threading.Lock()

# Playlist queue
playlist_queue = []   # list of (dl_id, url, title, quality) pending
_queue_lock = threading.Lock()
_scheduler_started = False

MIN_SPEED_PER_DL = 1.0 * 1024 * 1024  # 1 MB/s in bytes

def next_id():
    global _dl_counter
    with _lock:
        _dl_counter += 1
        return str(_dl_counter)

def sanitize_filename(name):
    for ch in r'\/:*?"<>|':
        name = name.replace(ch, "_")
    return name.strip() or "VelocityPrime_Video"

def parse_speed_to_bytes(speed_str):
    """Convert '2.50MiB/s' or '500KiB/s' to bytes per second."""
    if not speed_str:
        return 0
    m = re.match(r'([\d.]+)\s*([KMGTPE]?i?B)/s', speed_str, re.IGNORECASE)
    if not m:
        return 0
    val = float(m.group(1))
    unit = m.group(2).upper().replace('I', '')
    multipliers = {'B': 1, 'KB': 1024, 'MB': 1024**2, 'GB': 1024**3}
    return val * multipliers.get(unit, 1)

def get_active_downloads():
    """Return list of download IDs currently downloading."""
    with _lock:
        return [k for k, v in downloads.items() if v.get('status') in ('downloading', 'started')]

def get_total_speed_bytes():
    """Sum up current speed of all active downloads in bytes/s."""
    with _lock:
        total = 0
        for v in downloads.values():
            if v.get('status') in ('downloading', 'started'):
                total += v.get('speed_bytes', 0)
        return total

def adaptive_queue_scheduler():
    """Background thread that pops downloads from the playlist_queue adaptively."""
    while True:
        time.sleep(1)
        active = get_active_downloads()
        
        with _queue_lock:
            if not playlist_queue:
                continue
            pending = playlist_queue[0]
        
        # Decide whether to start the next download
        should_start = False
        if len(active) == 0:
            # Nothing running → always start
            should_start = True
        else:
            total_speed = get_total_speed_bytes()
            speed_per_dl = total_speed / len(active) if active else 0
            # If every active download is getting more than 1 MB/s, we have spare bandwidth
            if speed_per_dl > MIN_SPEED_PER_DL:
                should_start = True

        if should_start:
            with _queue_lock:
                if playlist_queue:
                    dl_id, url, title, quality = playlist_queue.pop(0)
            t = threading.Thread(
                target=run_download,
                args=(dl_id, url, title, quality),
                daemon=False
            )
            t.start()

def ensure_scheduler():
    global _scheduler_started
    if not _scheduler_started:
        _scheduler_started = True
        t = threading.Thread(target=adaptive_queue_scheduler, daemon=True)
        t.start()

def run_download(dl_id, url, title, quality):
    with _lock:
        if dl_id not in downloads:
            downloads[dl_id] = {
                "status": "downloading",
                "progress": 0,
                "filename": title,
                "url": url,
                "quality": quality,
                "process": None,
                "speed_bytes": 0,
            }
        else:
            downloads[dl_id]["status"] = "downloading"
            downloads[dl_id]["progress"] = 0
            downloads[dl_id]["speed_bytes"] = 0

    downloads_path = str(Path.home() / "Downloads")
    temp_path = os.path.join(downloads_path, ".VelocityTemp")

    if not os.path.exists(temp_path):
        os.makedirs(temp_path, exist_ok=True)
        try:
            import ctypes
            ctypes.windll.kernel32.SetFileAttributesW(temp_path, 2)  # Hidden
        except:
            pass

    safe_title = sanitize_filename(title)
    quality_suffix = f"_{quality}p" if quality.isdigit() else f"_{quality}"
    temp_output_template = os.path.join(temp_path, f"{safe_title}{quality_suffix}.%(ext)s")

    if quality == "audio":
        fmt = "bestaudio/best"
        ext = "m4a"
    else:
        fmt = (f"bestvideo[height<={quality}][ext=mp4]+bestaudio[ext=m4a]"
               f"/bestvideo[height<={quality}]+bestaudio"
               f"/best[height<={quality}]/best")
        ext = "mp4"

    cmd = [
        PYTHON_EXE, "-m", "yt_dlp",
        "-f", fmt,
        "--merge-output-format", ext,
        "--no-playlist",
        "--newline",
        "-o", temp_output_template,
        url
    ]

    try:
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding='utf-8',
            errors='replace',
            creationflags=subprocess.CREATE_NO_WINDOW
        )
        with _lock:
            if dl_id in downloads:
                downloads[dl_id]["process"] = process

        for line in process.stdout:
            line = line.strip()
            m      = re.search(r'\[download\]\s+([\d.]+)', line)
            size_m = re.search(r'of\s+~?([\d.]+[a-zA-Z]+)', line)
            speed_m = re.search(r'at\s+([\d.]+[a-zA-Z/]+)', line)

            if m:
                pct = float(m.group(1))
                size_str  = size_m.group(1) if size_m else ""
                speed_str = speed_m.group(1) if speed_m else ""
                speed_bytes = parse_speed_to_bytes(speed_str)
                with _lock:
                    if dl_id in downloads:
                        downloads[dl_id]["progress"] = round(pct, 1)
                        if size_str:
                            downloads[dl_id]["size"] = size_str
                        if speed_str:
                            downloads[dl_id]["speed"] = speed_str
                        downloads[dl_id]["speed_bytes"] = speed_bytes

        process.wait()

        with _lock:
            info = downloads.get(dl_id, {})
            if info.get("status") == "cancelled":
                pass
            elif process.returncode == 0:
                pattern = os.path.join(temp_path, f"{safe_title}{quality_suffix}.*")
                for f in glob.glob(pattern):
                    if not f.endswith(".part") and not f.endswith(".ytdl"):
                        final_file = os.path.join(downloads_path, os.path.basename(f))
                        try:
                            if os.path.exists(final_file):
                                os.remove(final_file)
                            shutil.move(f, final_file)
                        except:
                            pass
                downloads[dl_id]["status"] = "done"
                downloads[dl_id]["progress"] = 100
                downloads[dl_id]["speed_bytes"] = 0
            else:
                downloads[dl_id]["status"] = "error"
                downloads[dl_id]["error"] = f"yt-dlp exited with code {process.returncode}"
                downloads[dl_id]["speed_bytes"] = 0

    except Exception as e:
        with _lock:
            if dl_id in downloads:
                downloads[dl_id]["status"] = "error"
                downloads[dl_id]["error"] = str(e)
                downloads[dl_id]["speed_bytes"] = 0


class Handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def send_json(self, code, data):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        if self.path == '/ping':
            self.send_json(200, {"status": "ok"})

        elif self.path == '/status/all':
            with _lock:
                safe = {}
                for k, v in downloads.items():
                    safe[k] = {ik: iv for ik, iv in v.items() if ik != 'process'}
            # Also include queued items
            with _queue_lock:
                for (dl_id, url, title, quality) in playlist_queue:
                    safe[dl_id] = {
                        "status": "queued",
                        "progress": 0,
                        "filename": title,
                        "url": url,
                        "quality": quality,
                    }
            self.send_json(200, safe)

        elif self.path.startswith('/status/'):
            dl_id = self.path.split('/')[-1]
            with _lock:
                info = downloads.get(dl_id)
            if info:
                self.send_json(200, {k: v for k, v in info.items() if k != 'process'})
            else:
                self.send_json(404, {"error": "Unknown download ID"})
        else:
            self.send_json(404, {"error": "Not found"})

    def do_DELETE(self):
        # DELETE /download/{id}  — fully purge from server state
        if self.path.startswith('/download/'):
            dl_id = self.path.split('/')[-1]
            with _lock:
                info = downloads.get(dl_id)
                if info:
                    proc = info.get("process")
                    if proc and proc.poll() is None:
                        try:
                            proc.kill()
                        except:
                            pass
                    del downloads[dl_id]
            # Also remove from queue if present
            with _queue_lock:
                playlist_queue[:] = [e for e in playlist_queue if e[0] != dl_id]
            self.send_json(200, {"status": "deleted"})
        else:
            self.send_json(404, {"error": "Not found"})

    def do_POST(self):
        if self.path == '/download':
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length)
            try:
                data    = json.loads(body)
                url     = data.get('url', '')
                title   = data.get('name', 'Video')
                quality = data.get('quality', '720')

                if not url:
                    self.send_json(400, {"error": "No URL provided"})
                    return

                dl_id = next_id()
                t = threading.Thread(
                    target=run_download,
                    args=(dl_id, url, title, quality),
                    daemon=False
                )
                t.start()
                self.send_json(200, {"status": "started", "id": dl_id})

            except Exception as e:
                self.send_json(500, {"error": str(e)})

        elif self.path == '/download/playlist':
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length)
            try:
                data    = json.loads(body)
                url     = data.get('url', '')
                quality = data.get('quality', '720')

                if not url:
                    self.send_json(400, {"error": "No URL provided"})
                    return

                # Run yt-dlp --flat-playlist to extract entries without downloading
                cmd = [
                    PYTHON_EXE, "-m", "yt_dlp",
                    "--flat-playlist",
                    "-j",      # Output each entry as JSON
                    "--no-warnings",
                    url
                ]
                result = subprocess.run(
                    cmd, capture_output=True, text=True,
                    encoding='utf-8', errors='replace',
                    creationflags=subprocess.CREATE_NO_WINDOW,
                    timeout=30
                )

                entries = []
                for line in result.stdout.strip().splitlines():
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        entry = json.loads(line)
                        video_url   = entry.get('url') or entry.get('webpage_url', '')
                        video_title = entry.get('title', f"Video_{len(entries)+1}")
                        if video_url and not video_url.startswith('http'):
                            video_url = f"https://www.youtube.com/watch?v={video_url}"
                        if video_url:
                            entries.append((video_url, video_title))
                    except:
                        continue

                if not entries:
                    self.send_json(400, {"error": "No videos found in playlist"})
                    return

                # Queue all entries — adaptive scheduler will start them intelligently
                ensure_scheduler()
                queued_ids = []
                with _queue_lock:
                    for (v_url, v_title) in entries:
                        dl_id = next_id()
                        playlist_queue.append((dl_id, v_url, v_title, quality))
                        queued_ids.append(dl_id)

                self.send_json(200, {"status": "queued", "count": len(entries), "ids": queued_ids})

            except subprocess.TimeoutExpired:
                self.send_json(500, {"error": "Timeout fetching playlist"})
            except Exception as e:
                self.send_json(500, {"error": str(e)})

        elif self.path.startswith('/cancel/'):
            dl_id = self.path.split('/')[-1]
            with _lock:
                info = downloads.get(dl_id)
            if info:
                proc = info.get("process")
                if proc and proc.poll() is None:
                    try:
                        proc.kill()
                    except:
                        pass
                with _lock:
                    if dl_id in downloads:
                        downloads[dl_id]["status"] = "cancelled"
                        downloads[dl_id]["speed_bytes"] = 0
                self.send_json(200, {"status": "cancelled"})
            else:
                # Maybe it's in the queue
                with _queue_lock:
                    playlist_queue[:] = [e for e in playlist_queue if e[0] != dl_id]
                self.send_json(200, {"status": "removed from queue"})
        else:
            self.send_json(404, {"error": "Not found"})


if __name__ == '__main__':
    ensure_scheduler()
    server = HTTPServer(('127.0.0.1', PORT), Handler)
    server.serve_forever()
