import win32clipboard
import sys
import ctypes
from PIL import Image
import io

def set_text(text):
    # 将文本编码为UTF-16格式
    text_utf16 = text.encode("utf-16le") + b'\0'
    
    win32clipboard.OpenClipboard()
    win32clipboard.EmptyClipboard()
    
    # 将内存中的文本写入剪贴板
    res = win32clipboard.SetClipboardData(win32clipboard.CF_UNICODETEXT, text_utf16)
    
    # 释放内存和剪贴板
    # ctypes.windll.kernel32.GlobalUnlock(handle)
    win32clipboard.CloseClipboard()
    return True


def set_image(imageBytes):
    # check if imageBytes is real Image
    # if not, return False
    # try:
    #     Image.open(io.BytesIO(imageBytes))
    # except:
    #     return False
    
    # 将内存中的图片写入剪贴板
    win32clipboard.OpenClipboard()
    win32clipboard.EmptyClipboard()
    res = win32clipboard.SetClipboardData(win32clipboard.CF_DIB, imageBytes)
    win32clipboard.CloseClipboard()
    return True

arguments = sys.argv[1:]

input_bytes = sys.stdin.buffer.read()

if arguments[0] == 'text' or arguments[0] == 't':    
    res = set_text(input_bytes.decode('utf-8'))
    print(res)
else:
# elif arguments[0] == 'image' or arguments[0] == 'i':
    print(set_image(input_bytes))
