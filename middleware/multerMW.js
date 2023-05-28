const multer = require("multer");

const imgConfig = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "../uploads");
  },
  filename: (req, file, cb) => {
    cb(null, `image_${Date.now()}_${file.originalname}`);
  },
});

const isImage = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(null, Error("only images allowed"));
  }
};

const upload = multer({
  storage: imgConfig,
  fileFilter:isImage
});

module.exports = {
  upload,
};
