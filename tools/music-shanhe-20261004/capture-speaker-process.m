#import <Foundation/Foundation.h>
#import <CoreAudio/CoreAudio.h>
#import <CoreAudio/CATapDescription.h>
#import <CoreAudio/AudioHardwareTapping.h>
#import <AudioToolbox/AudioToolbox.h>
#import <unistd.h>
int main(int argc,const char **argv){@autoreleasepool{
 if(argc<4){fprintf(stderr,"usage: capture-process-audio PID OUTPUT.caf SECONDS\n");return 2;}
 pid_t pid=atoi(argv[1]);AudioObjectID proc=0;UInt32 size=sizeof(proc);AudioObjectPropertyAddress a={kAudioHardwarePropertyTranslatePIDToProcessObject,kAudioObjectPropertyScopeGlobal,kAudioObjectPropertyElementMain};OSStatus err=AudioObjectGetPropertyData(kAudioObjectSystemObject,&a,sizeof(pid),&pid,&size,&proc);if(err||!proc){printf("BLOCKED process lookup %d\n",err);return 1;}
 CATapDescription *desc=[[CATapDescription alloc]initWithProcesses:@[@(proc)] andDeviceUID:@"BuiltInSpeakerDevice" withStream:0];desc.name=@"Yilu scoped game audio evidence";desc.privateTap=YES;desc.muteBehavior=CATapUnmuted;
 AudioObjectID tap=0;err=AudioHardwareCreateProcessTap(desc,&tap);if(err){printf("BLOCKED create tap %d\n",err);return 1;}
 AudioStreamBasicDescription fmt={0};a.mSelector=kAudioTapPropertyFormat;size=sizeof(fmt);err=AudioObjectGetPropertyData(tap,&a,0,NULL,&size,&fmt);
 NSString *uid=NSUUID.UUID.UUIDString;NSDictionary *agg=@{@kAudioAggregateDeviceNameKey:@"Yilu temporary private recording tap",@kAudioAggregateDeviceUIDKey:uid,@kAudioAggregateDeviceIsPrivateKey:@YES,@kAudioAggregateDeviceIsStackedKey:@NO,@kAudioAggregateDeviceTapAutoStartKey:@YES,@kAudioAggregateDeviceTapListKey:@[@{@kAudioSubTapUIDKey:desc.UUID.UUIDString,@kAudioSubTapDriftCompensationKey:@YES}]};
 AudioDeviceID dev=0;err=AudioHardwareCreateAggregateDevice((__bridge CFDictionaryRef)agg,&dev);if(err){printf("BLOCKED aggregate %d\n",err);AudioHardwareDestroyProcessTap(tap);return 1;}
 ExtAudioFileRef file=NULL;NSURL *url=[NSURL fileURLWithPath:[NSString stringWithUTF8String:argv[2]]];err=ExtAudioFileCreateWithURL((__bridge CFURLRef)url,kAudioFileCAFType,&fmt,NULL,kAudioFileFlags_EraseFile,&file);if(err){printf("BLOCKED output %d\n",err);return 1;}
 ExtAudioFileSetProperty(file,kExtAudioFileProperty_ClientDataFormat,sizeof(fmt),&fmt);__block UInt64 frames=0;__block OSStatus writeError=0;
 AudioDeviceIOProcID io=NULL;err=AudioDeviceCreateIOProcIDWithBlock(&io,dev,dispatch_queue_create("yilu.game.record",DISPATCH_QUEUE_SERIAL),^(const AudioTimeStamp *now,const AudioBufferList *in,const AudioTimeStamp *when,AudioBufferList *out,const AudioTimeStamp *outTime){if(in->mNumberBuffers&&in->mBuffers[0].mDataByteSize){UInt32 n=in->mBuffers[0].mDataByteSize/fmt.mBytesPerFrame;writeError=ExtAudioFileWrite(file,n,in);frames+=n;}});
 if(!err)err=AudioDeviceStart(dev,io);printf("START %.6f pid=%d object=%u sampleRate=%.0f status=%d\n",NSDate.date.timeIntervalSince1970,pid,proc,fmt.mSampleRate,err);fflush(stdout);
 if(!err)[NSThread sleepForTimeInterval:atof(argv[3])];AudioDeviceStop(dev,io);AudioDeviceDestroyIOProcID(dev,io);ExtAudioFileDispose(file);AudioHardwareDestroyAggregateDevice(dev);AudioHardwareDestroyProcessTap(tap);printf("END frames=%llu writeError=%d\n",frames,writeError);return err?1:0;
}}
