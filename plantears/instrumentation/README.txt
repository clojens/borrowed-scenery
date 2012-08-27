
== plant ears ==

various instruments for plant listening using PdDroidParty-debug-179.apk

== borrowed scenery ==

http://fo.am/borrowed-scenery/

== PdDroidParty ==

You can use the PdDroidParty code base to bundle your own Pd patches as standalone Android apps.

 - Clone the source code with bazaar: `bzr branch http://droidparty.net/PdDroidParty MySynthesizer`
 - Convert the app name to whatever you like: `./convert-app-name mysynth "My Synthesizer"`
 - In the cloned directory re-generate the Android build.xml file: `android update project --path .`
 - Replace your own icon 72x72 PNG icon over res/drawable/icon.png
 - (optional) Place a splash.svg graphic with 1.333 aspect ratio (e.g. 640x480) in res/raw/
 - (optional) edit assets/about.html with your own "about" text
 - Place your patch and files with a droidparty_main.pd in the "patch" subfolder
 - Pack the patch subfolder into an Android zip resource: `./pack-patch`
 - Install on your device for testing: `ant install`

http://www.droidparty.net/

== building externals for android ==

http://puredata.info/docs/developer/BuildingPdForAndroid/

