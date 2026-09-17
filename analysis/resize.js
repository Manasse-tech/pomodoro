const sharp = require("sharp");

async function run() {
  // App icon (Next.js app-dir icon convention)
  await sharp("/tmp/focusly-icon.png")
    .resize(512, 512, { fit: "cover" })
    .toFile("/home/z/my-project/src/app/icon.png");
  await sharp("/tmp/focusly-icon.png")
    .resize(180, 180, { fit: "cover" })
    .toFile("/home/z/my-project/src/app/apple-icon.png");

  // OG image 1200x630
  await sharp("/tmp/focusly-og.png")
    .resize(1200, 630, { fit: "cover", position: "centre" })
    .toFile("/home/z/my-project/public/og-image.png");

  // Manifest icons
  await sharp("/tmp/focusly-icon.png")
    .resize(192, 192, { fit: "cover" })
    .toFile("/home/z/my-project/public/icon-192.png");
  await sharp("/tmp/focusly-icon.png")
    .resize(512, 512, { fit: "cover" })
    .toFile("/home/z/my-project/public/icon-512.png");

  console.log("done");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
