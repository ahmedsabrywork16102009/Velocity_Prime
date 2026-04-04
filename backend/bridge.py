"""
Velocity Prime Launcher Bridge
Only job: start the HTTP server as a detached background process, then exit.
"""
import sys
import json
import struct
import subprocess
import os

PYTHON_EXE = r"C:\Users\Ahmed\AppData\Local\Python\pythoncore-3.14-64\python.exe"
PYTHONW_EXE = r"C:\Users\Ahmed\AppData\Local\Python\pythoncore-3.14-64\pythonw.exe"
SERVER_PY  = os.path.join(os.path.dirname(os.path.abspath(__file__)), "server.py")

def send(msg):
    data = json.dumps(msg).encode('utf-8')
    sys.stdout.buffer.write(struct.pack('I', len(data)))
    sys.stdout.buffer.write(data)
    sys.stdout.buffer.flush()

def read():
    raw = sys.stdin.buffer.read(4)
    if len(raw) < 4:
        return None
    length = struct.unpack('I', raw)[0]
    return json.loads(sys.stdin.buffer.read(length).decode('utf-8'))

def main():
    read()  # consume the incoming message (we don't care about content)
    try:
        # Use pythonw.exe — runs completely hidden, no console window
        exe = PYTHONW_EXE if os.path.exists(PYTHONW_EXE) else PYTHON_EXE
        subprocess.Popen(
            [exe, SERVER_PY],
            creationflags=subprocess.CREATE_NEW_PROCESS_GROUP | subprocess.CREATE_NO_WINDOW,
            close_fds=True
        )
        send({"status": "launched"})
    except Exception as e:
        send({"status": "error", "message": str(e)})

if __name__ == '__main__':
    main()
