const { zip } = require("zip-a-folder");
const fs = require("fs-extra");

(async () => {
  await fs.copyFile("./extension.json", "./build/extension.json");
  console.log("copied");

  await zip("./build/", "./build.zip");

  console.log("saved");
})();
