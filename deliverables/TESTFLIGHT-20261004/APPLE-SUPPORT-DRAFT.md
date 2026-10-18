# Apple 技术支持工单草稿（尚未发送）

Subject: TestFlight internal install fails before download; external beta submission also fails

App: 一路长歌
App Apple ID: 6818429253
Bundle ID: com.yvainair.yiluchangge
Developer Team ID: 325CW4AZ5L
Version: 0.12.8 (2026100403)
App Store Connect build ID: 5e72372d-ab74-4ad7-9c8d-6506b0b0db9a

The archive upload succeeded on October 4, 2026 at 18:53:55 China Standard Time. Processing completed. The internal testing group shows the build as Testing, with 90 days remaining. The internal tester accepted the invitation and sees the current version in TestFlight.

Installation fails with: “The requested app is not available or doesn't exist.”

We reproduced the failure on a connected iPhone 16 Pro running iOS 27.0 and captured the TestFlight process log in Console at 19:53:37 China Standard Time:

```text
bundleID=com.yvainair.yiluchangge
buildID=241088999
version=0.12.8 (2026100403)
serverFailureReason=Error Downloading Install Data
code=-1, serverCode=200
previousPhaseDescription=ProcessingInstallInitiateResponse
progressPhase=No Progress
downloadProgress=(null)
installProgress=(null)
installStatusDescription=None
```

The existing development build remains installed (0.12.5 / 2026100304). The error occurs before package download or device installation. The archive targets iOS 16+, iPhone, arm64 and Metal; this device meets those requirements. The Free Apps Agreement is Active.

Submitting this build for external TestFlight review also fails with the generic “There was an error processing your request. Please try again later.” The external group remains empty; we have not claimed review submission success.

Please investigate the TestFlight distribution record and install-data availability for this app/build. Please also check whether the app's beta contract association is missing or otherwise invalid. We have seen analogous reports on your Developer Forums but have not confirmed that specific backend error on this account.

Please preserve the existing bundle identifier and tester records. We can provide the failure screenshot and focused log excerpt if needed. No player save data is included.
