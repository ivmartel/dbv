dbv
===

Volume/mesh database visualisation. Using a locally modified version of XTK, see https://github.com/ivmartel/X. Modify the 'data.json' file to link to your data. 

For development purposes, browsers do have a switch to allow accessing local file(s):
 * Google Chrome: launch with the `--disable-web-security` argument (see the [list](http://peter.sh/experiments/chromium-command-line-switches/#disable-web-security)),
 * Apple Safari: in Safari preferences, Advanced, tick 'Show Develop menu in menu bar'. Then in the develop menu, tick: 'Disable Local File Restrictions'.
 * Mozilla Firefox: in `about:config` set `security.fileuri.strict_origin_policy` to false (see [fileuri.strict_origin_policy](http://kb.mozillazine.org/Security.fileuri.strict_origin_policy)).

XTK notes
---------
XTK official release files can be found at: http://get.goXTK.com. They are: 'xtk.js', 'xtk_xdat.gui.js' and the latest 'xtk_edge.js'.

To run from a local version:
 * download and uncompress [xtk-master](https://github.com/xtk/X/archive/master.zip) in a 'X' folder
 * download and uncompress [google-closure-library](https://github.com/google/closure-library/archive/master.zip) in 'X/lib'
 * In your HTML:

 ```html
<script type='text/javascript' src='../ext/X/lib/google-closure-library/closure/goog/base.js'></script>
<script type='text/javascript' src='../ext/X/xtk-deps.js'></script>
<script type='text/javascript'>
goog.require('X.renderer3D');
goog.require('X.scalars');
goog.require('X.mesh');
// ...
</script>
```

If you add new files, you need to rebuild the xtk-deps.js:
 * cd X/utils
 * Replace _core/_depsgenerator.py#L55 by 'command = [sys.executable, config.CLOSUREDEPSWRITER_PATH]'
 * Run: `python deps.py`
 * Replace '\' by '/' in xtk-deps.js

To build the compressed xtk.js:
 * cd X/utils
 * Run: `python build.py`
