import Foundation
import CoreAudio
var a=AudioObjectPropertyAddress(mSelector:kAudioHardwarePropertyProcessObjectList,mScope:kAudioObjectPropertyScopeGlobal,mElement:kAudioObjectPropertyElementMain)
var size:UInt32=0
AudioObjectGetPropertyDataSize(AudioObjectID(kAudioObjectSystemObject),&a,0,nil,&size)
var list=[AudioObjectID](repeating:0,count:Int(size)/4)
AudioObjectGetPropertyData(AudioObjectID(kAudioObjectSystemObject),&a,0,nil,&size,&list)
for id in list {
 var pid:Int32=0;var sz:UInt32=4;var p=AudioObjectPropertyAddress(mSelector:kAudioProcessPropertyPID,mScope:kAudioObjectPropertyScopeGlobal,mElement:kAudioObjectPropertyElementMain);AudioObjectGetPropertyData(id,&p,0,nil,&sz,&pid)
 var name:CFString="" as CFString;sz=UInt32(MemoryLayout<CFString>.size);p.mSelector=kAudioProcessPropertyBundleID;AudioObjectGetPropertyData(id,&p,0,nil,&sz,&name)
 print("\(id) \(pid) \(name)")
}
