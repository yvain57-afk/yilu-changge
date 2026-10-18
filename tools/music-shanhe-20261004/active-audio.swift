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
 var output:UInt32=0;sz=4;p.mSelector=kAudioProcessPropertyIsRunningOutput;AudioObjectGetPropertyData(id,&p,0,nil,&sz,&output)
 if output>0 {
 print("\(id) \(pid) \(name) runningOutput=\(output)")
 p.mSelector=kAudioProcessPropertyDevices;p.mScope=kAudioObjectPropertyScopeOutput;sz=0
 AudioObjectGetPropertyDataSize(id,&p,0,nil,&sz)
 var ds=[AudioObjectID](repeating:0,count:Int(sz)/4);AudioObjectGetPropertyData(id,&p,0,nil,&sz,&ds)
 for dev in ds {
 var label:CFString="" as CFString;var bytes=UInt32(MemoryLayout<CFString>.size)
 var q=AudioObjectPropertyAddress(mSelector:kAudioDevicePropertyDeviceUID,mScope:kAudioObjectPropertyScopeGlobal,mElement:kAudioObjectPropertyElementMain)
 AudioObjectGetPropertyData(dev,&q,0,nil,&bytes,&label);print("device \(dev) \(label)")
 var mute:UInt32=0;bytes=4;q.mSelector=kAudioDevicePropertyMute;q.mScope=kAudioObjectPropertyScopeOutput
 let err=AudioObjectGetPropertyData(dev,&q,0,nil,&bytes,&mute);print("mute \(mute) status \(err)")
 }
}
}
