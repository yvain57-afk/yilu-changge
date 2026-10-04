"""macOS generic password through Security.framework. Secret never appears in argv."""
import ctypes as C
from common import Fault
SERVICE=b'YiluProjectReader.yilu-changge'
def access(value=None,delete=False):
    cf=C.CDLL('/System/Library/Frameworks/CoreFoundation.framework/CoreFoundation');sec=C.CDLL('/System/Library/Frameworks/Security.framework/Security')
    ptr=C.c_void_p
    cf.CFStringCreateWithCString.argtypes=[ptr,C.c_char_p,C.c_uint32];cf.CFStringCreateWithCString.restype=ptr
    cf.CFDataCreate.argtypes=[ptr,C.c_char_p,C.c_long];cf.CFDataCreate.restype=ptr
    cf.CFDictionaryCreate.argtypes=[ptr,C.POINTER(ptr),C.POINTER(ptr),C.c_long,ptr,ptr];cf.CFDictionaryCreate.restype=ptr
    cf.CFRelease.argtypes=[ptr];cf.CFDataGetLength.argtypes=[ptr];cf.CFDataGetLength.restype=C.c_long;cf.CFDataGetBytePtr.argtypes=[ptr];cf.CFDataGetBytePtr.restype=ptr
    sec.SecItemCopyMatching.argtypes=[ptr,C.POINTER(ptr)];sec.SecItemAdd.argtypes=[ptr,ptr];sec.SecItemDelete.argtypes=[ptr]
    const=lambda name:ptr.in_dll(sec,name).value
    s=lambda raw:cf.CFStringCreateWithCString(None,raw,0x08000100)
    service=s(SERVICE);account=s(b'official-tunnel-runtime');owned=[service,account]
    pairs=[(const('kSecClass'),const('kSecClassGenericPassword')),(const('kSecAttrService'),service),(const('kSecAttrAccount'),account)]
    def dictionary(items):
        keys=(ptr*len(items))(*(x[0] for x in items));values=(ptr*len(items))(*(x[1] for x in items))
        d=cf.CFDictionaryCreate(None,keys,values,len(items),None,None);owned.append(d);return d
    try:
        query=dictionary(pairs)
        if delete:
            rc=sec.SecItemDelete(query)
            if rc not in (0,-25300):raise Fault('unavailable','Keychain deletion denied')
            return None
        if value is not None:
            raw=value.encode();data=cf.CFDataCreate(None,raw,len(raw));owned.append(data)
            rc=sec.SecItemAdd(dictionary(pairs+[(const('kSecValueData'),data)]),None)
            if rc==-25299:
                sec.SecItemUpdate.argtypes=[ptr,ptr];rc=sec.SecItemUpdate(query,dictionary([(const('kSecValueData'),data)]))
            if rc:raise Fault('unavailable','Keychain save denied; use system authorization prompt')
            return None
        result=ptr();true=ptr.in_dll(cf,'kCFBooleanTrue').value
        rc=sec.SecItemCopyMatching(dictionary(pairs+[(const('kSecReturnData'),true)]),C.byref(result))
        if rc==-25300:return None
        if rc:raise Fault('unavailable','Keychain read denied or locked')
        owned.append(result.value);return C.string_at(cf.CFDataGetBytePtr(result),cf.CFDataGetLength(result)).decode()
    finally:
        for p in reversed(owned):cf.CFRelease(p)
