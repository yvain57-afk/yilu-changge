// Read-only diagnostic. Does not create taps, devices, or change volume/permissions.
import Foundation
import CoreAudio
func uint(_ id:AudioObjectID,_ key:AudioObjectPropertySelector,_ scope:AudioObjectPropertyScope=kAudioObjectPropertyScopeGlobal)->[String:Any] {
 var a=AudioObjectPropertyAddress(mSelector:key,mScope:scope,mElement:kAudioObjectPropertyElementMain),v:UInt32=0,n:UInt32=4
 let e=AudioObjectGetPropertyData(id,&a,0,nil,&n,&v)
 return ["status":e,"value":v]
}
func ids(_ id:AudioObjectID,_ key:AudioObjectPropertySelector,_ scope:AudioObjectPropertyScope=kAudioObjectPropertyScopeGlobal)->[AudioObjectID] {
 var a=AudioObjectPropertyAddress(mSelector:key,mScope:scope,mElement:kAudioObjectPropertyElementMain),n:UInt32=0
 guard AudioObjectGetPropertyDataSize(id,&a,0,nil,&n)==0 else{return []}
 var out=[AudioObjectID](repeating:0,count:Int(n)/4)
 guard AudioObjectGetPropertyData(id,&a,0,nil,&n,&out)==0 else{return []};return out
}
let selected=Set(CommandLine.arguments.dropFirst().compactMap(UInt32.init))
var rows=[[String:Any]]()
for id in ids(AudioObjectID(kAudioObjectSystemObject),kAudioHardwarePropertyProcessObjectList) {
 let p=uint(id,kAudioProcessPropertyPID);guard let pid=p["value"] as? UInt32,selected.contains(pid) else{continue}
 let devices=ids(id,kAudioProcessPropertyDevices,kAudioObjectPropertyScopeOutput)
 rows.append(["pid":pid,"object":id,"runningOutput":uint(id,kAudioProcessPropertyIsRunningOutput),"outputDevices":devices,"devices":devices.map{d in ["id":d,"alive":uint(d,kAudioDevicePropertyDeviceIsAlive),"running":uint(d,kAudioDevicePropertyDeviceIsRunning),"mute":uint(d,kAudioDevicePropertyMute,kAudioObjectPropertyScopeOutput),"processMute":uint(d,kAudioDevicePropertyProcessMute,kAudioObjectPropertyScopeOutput)] as [String:Any]}])
}
let result:[String:Any] = ["captureTime":ISO8601DateFormatter().string(from:Date()),"defaultOutput":uint(AudioObjectID(kAudioObjectSystemObject),kAudioHardwarePropertyDefaultOutputDevice),"processes":rows,"requestedPIDs":Array(selected).sorted(),"scope":"read-only current host CoreAudio properties; not historical or audible proof"]
print(String(data:try JSONSerialization.data(withJSONObject:result,options:[.prettyPrinted,.sortedKeys]),encoding:.utf8)!)
