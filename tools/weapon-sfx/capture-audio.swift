import Foundation
import ScreenCaptureKit
import AVFoundation
import CoreGraphics
final class Sink: NSObject, SCStreamOutput {
 var file: AVAudioFile?; var frames:Int64=0; let path:String
 init(_ path:String){self.path=path}
 func stream(_ stream:SCStream,didOutputSampleBuffer sampleBuffer:CMSampleBuffer,of type:SCStreamOutputType){
  guard type == .audio, let desc=sampleBuffer.formatDescription,let asbd=CMAudioFormatDescriptionGetStreamBasicDescription(desc),let format=AVAudioFormat(streamDescription:asbd) else{return}
  let count=CMSampleBufferGetNumSamples(sampleBuffer)
  guard let buffer=AVAudioPCMBuffer(pcmFormat:format,frameCapacity:AVAudioFrameCount(count)) else{return}
  buffer.frameLength=AVAudioFrameCount(count)
  let result=CMSampleBufferCopyPCMDataIntoAudioBufferList(sampleBuffer,at:0,frameCount:Int32(count),into:buffer.mutableAudioBufferList)
  guard result==noErr else{return}
  do {if file == nil {file=try AVAudioFile(forWriting:URL(fileURLWithPath:path),settings:format.settings)};try file!.write(from:buffer);frames+=Int64(count)}catch{fputs("audio write failed: \(error)\n",stderr)}
 }
}
@main struct Capture {
 static func main() async {
  do {
   let content=try await SCShareableContent.excludingDesktopWindows(false,onScreenWindowsOnly:false)
   for a in content.applications where a.applicationName.lowercased().contains("sim") || a.applicationName.lowercased().contains("cocos") || a.applicationName.lowercased().contains("device") {print("AUDIO APP \(a.applicationName) \(a.bundleIdentifier) \(a.processID)")}
   let apps=content.applications.filter{$0.bundleIdentifier=="com.apple.iphonesimulator" || $0.bundleIdentifier=="com.apple.dt.Devices" || $0.bundleIdentifier=="com.yvainair.yiluchangge"}
   guard let display=content.displays.first,!apps.isEmpty else{print("BLOCKED: Simulator app not visible to ScreenCaptureKit");return}
   let filter=SCContentFilter(display:display,including:apps,exceptingWindows:[])
   let config=SCStreamConfiguration();config.width=2;config.height=2;config.minimumFrameInterval=CMTime(value:1,timescale:1);config.capturesAudio=true;config.excludesCurrentProcessAudio=true;config.sampleRate=48000;config.channelCount=2
   let sink=Sink(CommandLine.arguments[1]);let stream=SCStream(filter:filter,configuration:config,delegate:nil)
   try stream.addStreamOutput(sink,type:.audio,sampleHandlerQueue:DispatchQueue(label:"yilu.audio.capture"))
   try await stream.startCapture();print("START \(Date().timeIntervalSince1970) Simulator-only audio");fflush(stdout)
   try await Task.sleep(nanoseconds:UInt64(Double(CommandLine.arguments[2])!*1e9));try await stream.stopCapture();print("END frames=\(sink.frames)")
  }catch{print("BLOCKED: \(error)")}
 }
}
