# Script to automatically download the Javascript libraries into the assets before compiling the app. Called from build.gradle from `commandLine "python", layout.projectDirectory.file("jslibs.py")`.
# Using https://github.com/michel-kraemer/gradle-download-task directly in the gradle script would have been easier but there"s a bug that doens"t allow downloading stuff into the assets directory.

import os
import shutil
import urllib.request

libsDir = "src/main/assets/libs/"
libUrls = [
    "https://unpkg.com/peerjs/dist/peerjs.min.js",
    "https://unpkg.com/@popperjs/core@2",
    "https://unpkg.com/tippy.js@6",
    "https://unpkg.com/@flatten-js/core@1.4.8/dist/main.mjs",
    "https://cdn.jsdelivr.net/gh/xxjapp/xdialog@3/xdialog.min.js",
    "https://cdn.jsdelivr.net/gh/xxjapp/xdialog@3/xdialog.min.css",
    "https://cdn.jsdelivr.net/npm/lodash@4.17.21/+esm",
    "https://gustavlindberg99.github.io/Typecheck.js/min/typecheck-v1.min.js",
    "https://gustavlindberg99.github.io/QtLinguistWeb/qtranslator-v1.min.js"
]

# Create an empty libs folder (if it already exists, delete everything in it so that if we stop using a library it gets removed automatically)
if os.path.exists(libsDir):
    shutil.rmtree(libsDir)
os.mkdir(libsDir)

# Download the library JS and CSS files into the libs folder
for url in libUrls:
    filename = os.path.basename(url)
    urllib.request.urlretrieve(url, libsDir + "/" + filename)