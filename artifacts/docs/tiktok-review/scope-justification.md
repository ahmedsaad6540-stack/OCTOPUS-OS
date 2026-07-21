# TikTok Scope Justification

This document details why our application requires each requested OAuth scope to provide the core functionality described in our App Description.

### Scope: `user.info.basic`
**Why it's needed:** We use this scope to display the creator's TikTok avatar and Display Name inside our Social Hub. This provides visual confirmation to the user that they have successfully connected the correct TikTok account to our dashboard.

### Scope: `video.upload`
**Why it's needed:** This scope is the core of our "Draft Upload Bridge." It allows us to seamlessly push rendered vertical videos directly to the user's TikTok Inbox. We do this to save the user from having to manually transfer large video files from their desktop to their phone. The user retains full control and manually completes the publishing process inside the TikTok app.

### Scope: `video.publish`
**Why it's needed:** For our verified users who opt-in to full automation, this scope powers our "Direct Post Bridge." It enables OCTOPUS AI LAB to automatically publish the video with the user's pre-approved caption and hashtags, strictly honoring the privacy settings (Public, Friends, or Private) selected by the creator in our dashboard.
