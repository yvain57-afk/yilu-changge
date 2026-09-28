/****************************************************************************
 Copyright (c) 2010-2013 cocos2d-x.org
 Copyright (c) 2013-2016 Chukong Technologies Inc.
 Copyright (c) 2017-2022 Xiamen Yaji Software Co., Ltd.

 http://www.cocos.com

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated engine source code (the "Software"), a limited,
 worldwide, royalty-free, non-assignable, revocable and non-exclusive license
 to use Cocos Creator solely to develop games on your target platforms. You shall
 not use Cocos Creator software for developing other software or tools that's
 used for developing games. You are not granted to publish, distribute,
 sublicense, and/or sell copies of Cocos Creator.

 The software or tools in this License Agreement are licensed, not sold.
 Xiamen Yaji Software Co., Ltd. reserves all rights not expressly granted to you.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
****************************************************************************/

#import "AppDelegate.h"
#import "ViewController.h"
#import "View.h"

#include "platform/ios/IOSPlatform.h"
#import "platform/ios/AppDelegateBridge.h"
#import "service/SDKWrapper.h"

@interface AppDelegate ()
@property(nonatomic, strong) NSDictionary *launchOptions;
- (void)connectWindowScene:(UIWindowScene *)scene;
@end
@interface YiluSceneDelegate : UIResponder <UIWindowSceneDelegate>
@property(nonatomic, strong) UIWindow *window;
@end
@implementation YiluSceneDelegate
- (void)scene:(UIScene *)scene willConnectToSession:(UISceneSession *)session options:(UISceneConnectionOptions *)options {
    AppDelegate *app=(AppDelegate *)UIApplication.sharedApplication.delegate;
    [app connectWindowScene:(UIWindowScene *)scene];
    self.window=app.window;
}
- (void)sceneWillResignActive:(UIScene *)scene {[(AppDelegate *)UIApplication.sharedApplication.delegate applicationWillResignActive:UIApplication.sharedApplication];}
- (void)sceneDidBecomeActive:(UIScene *)scene {[(AppDelegate *)UIApplication.sharedApplication.delegate applicationDidBecomeActive:UIApplication.sharedApplication];}
- (void)sceneDidEnterBackground:(UIScene *)scene {[(AppDelegate *)UIApplication.sharedApplication.delegate applicationDidEnterBackground:UIApplication.sharedApplication];}
- (void)sceneWillEnterForeground:(UIScene *)scene {[(AppDelegate *)UIApplication.sharedApplication.delegate applicationWillEnterForeground:UIApplication.sharedApplication];}
@end

@implementation AppDelegate
@synthesize window;
@synthesize appDelegateBridge;

#pragma mark -
#pragma mark Application lifecycle

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
    [[SDKWrapper shared] application:application didFinishLaunchingWithOptions:launchOptions];
    appDelegateBridge = [[AppDelegateBridge alloc] init];
    
    self.launchOptions = launchOptions;
    return YES;
}

- (void)connectWindowScene:(UIWindowScene *)scene {
    if(self.window)return;
    CGRect bounds=scene.coordinateSpace.bounds;
    self.window=[[UIWindow alloc] initWithWindowScene:scene];
    _viewController=[[ViewController alloc] init];
    _viewController.view=[[View alloc] initWithFrame:bounds];
    _viewController.view.contentScaleFactor=scene.screen.scale;
    _viewController.view.multipleTouchEnabled=YES;
    self.window.rootViewController=_viewController;
    [self.window makeKeyAndVisible];
    [appDelegateBridge application:UIApplication.sharedApplication didFinishLaunchingWithOptions:self.launchOptions];
}

- (void)applicationWillResignActive:(UIApplication *)application {
    /*
     Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
     Use this method to pause ongoing tasks, disable timers, and throttle down OpenGL ES frame rates. Games should use this method to pause the game.
     */
    [[SDKWrapper shared] applicationWillResignActive:application];
    [appDelegateBridge applicationWillResignActive:application];
}

- (void)applicationDidBecomeActive:(UIApplication *)application {
    /*
     Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
     */
    [[SDKWrapper shared] applicationDidBecomeActive:application];
    [appDelegateBridge applicationDidBecomeActive:application];
}

- (void)applicationDidEnterBackground:(UIApplication *)application {
    /*
     Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
     If your application supports background execution, called instead of applicationWillTerminate: when the user quits.
     */
    [[SDKWrapper shared] applicationDidEnterBackground:application];
}

- (void)applicationWillEnterForeground:(UIApplication *)application {
    /*
     Called as part of  transition from the background to the inactive state: here you can undo many of the changes made on entering the background.
     */
    [[SDKWrapper shared] applicationWillEnterForeground:application];
}

- (void)applicationWillTerminate:(UIApplication *)application {
    [[SDKWrapper shared] applicationWillTerminate:application];
    [appDelegateBridge applicationWillTerminate:application];
}

#pragma mark -
#pragma mark Memory management

- (void)applicationDidReceiveMemoryWarning:(UIApplication *)application {
    [[SDKWrapper shared] applicationDidReceiveMemoryWarning:application];
}

@end

// Standard VoiceOver actions use the same touch event path as a physical tap.
static CGFloat yiluCurrentTarget=0;
@interface YiluButtonElement : UIAccessibilityElement
@property(nonatomic) CGPoint touchPoint;
@property(nonatomic) CGFloat moveDelta;
@property(nonatomic, strong) NSNumber *lane;
@property(nonatomic) CGFloat laneScale;
@end
@implementation YiluButtonElement
- (BOOL)accessibilityActivate {
    if(self.lane)self.moveDelta=(self.lane.doubleValue-yiluCurrentTarget)*self.laneScale;
    cc::TouchEvent event;
    event.windowId=1;
    event.touches.push_back({(float)self.touchPoint.x,(float)self.touchPoint.y,9001});
    event.type=cc::TouchEvent::Type::BEGAN;cc::events::Touch::broadcast(event);
    if(self.moveDelta!=0){event.touches[0].x+=self.moveDelta;event.type=cc::TouchEvent::Type::MOVED;cc::events::Touch::broadcast(event);}
    if(self.moveDelta!=0){cc::TouchEvent ended=event;ended.type=cc::TouchEvent::Type::ENDED;dispatch_after(dispatch_time(DISPATCH_TIME_NOW,(int64_t)(.65*NSEC_PER_SEC)),dispatch_get_main_queue(),^{cc::events::Touch::broadcast(ended);});}
    else {event.type=cc::TouchEvent::Type::ENDED;cc::events::Touch::broadcast(event);}
    return YES;
}
@end
@interface YiluNativeBridge : NSObject
+ (void)syncButtons:(NSString *)json;
+ (void)reviewState:(NSString *)json;
+ (void)position:(NSString *)value;
+ (NSString *)reviewFixture:(NSString *)unused;
+ (void)impact:(NSString *)style;
@end
@implementation YiluNativeBridge
+ (NSString *)reviewFixture:(NSString *)unused {
#if CC_DEBUG
    for(NSString *arg in NSProcessInfo.processInfo.arguments)if([arg hasPrefix:@"--yilu-review="])return [arg substringFromIndex:14];
#endif
    return @"";
}
+ (void)position:(NSString *)value {yiluCurrentTarget=value.doubleValue;}
+ (void)reviewState:(NSString *)json {
#if CC_DEBUG
    UIView *view=UIApplication.sharedApplication.delegate.window.rootViewController.view;
    NSMutableArray *elements=[view.accessibilityElements mutableCopy]?:[NSMutableArray array];
    UIAccessibilityElement *status=nil;
    for(UIAccessibilityElement *e in elements)if([e.accessibilityIdentifier isEqualToString:@"review-state"])status=e;
    if(!status){status=[[UIAccessibilityElement alloc] initWithAccessibilityContainer:view];status.accessibilityIdentifier=@"review-state";status.accessibilityLabel=@"开发验证状态（只读）";status.accessibilityTraits=UIAccessibilityTraitStaticText;status.accessibilityFrameInContainerSpace=CGRectMake(0,0,1,1);[elements addObject:status];view.accessibilityElements=elements;}
    status.accessibilityValue=json;
#endif
}

+ (void)syncButtons:(NSString *)json {
    NSDictionary *data=[NSJSONSerialization JSONObjectWithData:[json dataUsingEncoding:NSUTF8StringEncoding] options:0 error:nil];
    UIView *view=UIApplication.sharedApplication.delegate.window.rootViewController.view;
    if(!view||!data)return;
    CGFloat sx=view.bounds.size.width/[data[@"width"] doubleValue],sy=view.bounds.size.height/[data[@"height"] doubleValue];
    NSMutableArray *elements=[NSMutableArray array];
    for(NSDictionary *b in data[@"buttons"]){
        YiluButtonElement *e=[[YiluButtonElement alloc] initWithAccessibilityContainer:view];
        e.lane=b[@"lane"];e.laneScale=view.bounds.size.width*.4;e.moveDelta=[b[@"moveDelta"] doubleValue]*sx;
        e.accessibilityLabel=b[@"label"];e.accessibilityIdentifier=b[@"id"];e.accessibilityTraits=UIAccessibilityTraitButton;
        CGRect r=CGRectMake([b[@"x"] doubleValue]*sx,[b[@"y"] doubleValue]*sy,[b[@"w"] doubleValue]*sx,[b[@"h"] doubleValue]*sy);
        e.accessibilityFrameInContainerSpace=r;e.touchPoint=CGPointMake(CGRectGetMidX(r),CGRectGetMidY(r));[elements addObject:e];
    }
    view.accessibilityElements=elements;
}
+ (void)impact:(NSString *)style {UIImpactFeedbackGenerator *g=[[UIImpactFeedbackGenerator alloc] initWithStyle:UIImpactFeedbackStyleLight];[g impactOccurred];}
@end
