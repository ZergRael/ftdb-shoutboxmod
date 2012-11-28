require 'fileutils'
p "Start"

FileUtils.cp "chrome/dev/FTDB_Shoutbox_Mod.js", "userscript/dev/FTDB_Shoutbox_Mod.user.js"
FileUtils.cp "chrome/dev/FTDB_Shoutbox_Mod.js", "firefox/dev/FTDB_Shoutbox_Mod.user.js"

p "Ended"
sleep(1)