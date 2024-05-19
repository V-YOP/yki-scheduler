import win32clipboard
import base64
import json
import hashlib
import tempfile
import os
import sys

WORKING_DIR = os.path.join(tempfile.gettempdir(), 'yki_scheduler')
os.makedirs(WORKING_DIR, exist_ok=True) 
os.chdir(WORKING_DIR)

def md5(bytes):
    md5 = hashlib.md5()
    md5.update(bytes)
    return md5.hexdigest()

clipboard_type_map = {
    win32clipboard.CF_UNICODETEXT: "TEXT",
    win32clipboard.CF_DIB: "IMAGE",
    win32clipboard.CF_HDROP: "FILE_LIST",
    # win32clipboard.CF_BITMAP: "CF_BITMAP",
    # win32clipboard.CF_TEXT: "CF_TEXT",
    # win32clipboard.CF_METAFILEPICT: "CF_METAFILEPICT",
    # win32clipboard.CF_SYLK: "CF_SYLK",
    # win32clipboard.CF_DIF: "CF_DIF",
    # win32clipboard.CF_TIFF: "CF_TIFF",
    # win32clipboard.CF_OEMTEXT: "CF_OEMTEXT",
    # win32clipboard.CF_PALETTE: "CF_PALETTE",
    # win32clipboard.CF_PENDATA: "CF_PENDATA",
    # win32clipboard.CF_RIFF: "CF_RIFF",
    # win32clipboard.CF_WAVE: "CF_WAVE",
    # win32clipboard.CF_ENHMETAFILE: "CF_ENHMETAFILE",
    # win32clipboard.CF_LOCALE: "CF_LOCALE",
    # win32clipboard.CF_DIBV5: "CF_DIBV5",
    # win32clipboard.CF_OWNERDISPLAY: "CF_OWNERDISPLAY",
    # win32clipboard.CF_DSPTEXT: "CF_DSPTEXT",
    # win32clipboard.CF_DSPBITMAP: "CF_DSPBITMAP",
    # win32clipboard.CF_DSPMETAFILEPICT: "CF_DSPMETAFILEPICT",
    # win32clipboard.CF_DSPENHMETAFILE: "CF_DSPENHMETAFILE",
}

# 尝试获取剪切板中的内容
def get_clipboard_data():
    try:
        win32clipboard.OpenClipboard()
        data = None
        for clip_type in clipboard_type_map.keys():
            try:
                data = win32clipboard.GetClipboardData(clip_type)
                if data:
                    data = (clipboard_type_map[clip_type], data)
                    break
            except Exception as e:
                pass
        win32clipboard.CloseClipboard()
        if data is None:
            return ('UNKNOWN', None)
        return data
    except Exception as e:
        return ('UNKNOWN', None)

def get_last_seq_id():
    if not os.path.exists('last_seq_id'):
        return None
    with open('last_seq_id', 'r') as f:
        return int(f.read())

# 先尝试获取seqMember，如果和上次相同，读cache的
seq_id = win32clipboard.GetClipboardSequenceNumber()

if len(sys.argv) > 1 and int(sys.argv[1]) == seq_id:
    print(json.dumps({
        'type': 'UNKNOWN',
        'data': None,
        'md5': -1,
        'seq_id': seq_id,
    }))
    exit(0)

last_seq_id = get_last_seq_id()

def main():
    if last_seq_id is not None and last_seq_id == seq_id:
        with open(str(last_seq_id), 'r') as f:
            print(f.read())
        return

    # 获取剪切板中的内容
    clipboard_data = get_clipboard_data()

    if clipboard_data[0] == 'TEXT':
        res = json.dumps({
            'type': 'TEXT',
            'data': clipboard_data[1],
            'md5': md5(clipboard_data[1].encode('utf-8')),
            'seq_id': seq_id,
        })
    elif clipboard_data[0] == 'IMAGE':
        res = json.dumps({
            'type': 'IMAGE',
            'data': base64.b64encode(clipboard_data[1]).decode('utf-8'),
            'md5': md5(clipboard_data[1]),
            'seq_id': seq_id,
        })
    elif clipboard_data[0] == 'FILE_LIST':
        res = json.dumps({
            'type': 'FILE_LIST',
            'data': clipboard_data[1],
            'md5': md5(''.join(clipboard_data[1]).encode('utf-8')),
            'seq_id': seq_id,
        })
    else:
        res = json.dumps({
            'type': 'UNKNOWN',
            'data': None,
            'md5': -1,
            'seq_id': seq_id,
        })

    with open(str(seq_id), 'w+') as data_file, open('last_seq_id', 'w+') as last_seq_file:
        data_file.write(res)
        last_seq_file.write(str(seq_id))
        print(res)

main()