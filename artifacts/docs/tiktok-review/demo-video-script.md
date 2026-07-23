# Screencast Script for App Review Demo Video

**Total Estimated Duration:** 2 minutes

**[0:00 - 0:15] Scene 1: Introduction & Login**
*Visual: Screen recording showing the OCTOPUS AI LAB login page on a desktop browser.*
*Narration:* "Hello TikTok Review Team. This is a demonstration of the OCTOPUS AI LAB integration. We are logging into our secure dashboard."

**[0:15 - 0:45] Scene 2: OAuth Connection**
*Visual: Navigating to the Social Hub. Clicking 'Connect' on the TikTok card.*
*Narration:* "Here, the user connects their TikTok account. As you can see, the OAuth consent screen clearly requests `user.info.basic`, `video.upload`, and `video.publish`. The user explicitly grants access."
*Visual: Redirects back to OCTOPUS. The TikTok card now shows the user's Display Name and 'Connected' badge.*

**[0:45 - 1:20] Scene 3: Drafting & Publishing**
*Visual: Clicking 'Smart Publish'. Entering a title. Clicking 'Publish'.*
*Narration:* "Now we will demonstrate the video publishing flow. The user initiates a publish action. Our system uses the `video.upload` API to send the video directly to the user's TikTok Inbox. For Direct Post users, it uses `video.publish` honoring their privacy selection."
*Visual: Opening the TikTok mobile app emulator to show the Inbox notification.*

**[1:20 - 1:50] Scene 4: Disconnection & Data Deletion**
*Visual: Back in OCTOPUS, clicking 'Disconnect'. The card returns to 'Disconnected'.*
*Narration:* "Users retain full control. Clicking disconnect instantly scrubs the token and profile data from our databases. Alternatively, if they remove access from within the TikTok app, our system detects the revocation on the next request and permanently purges the cache."

**[1:50 - 2:00] Scene 5: Outro**
*Visual: Showing the `/privacy` and `/data-deletion` pages.*
*Narration:* "Our privacy policy and data deletion instructions are publicly accessible. Thank you for your review."
