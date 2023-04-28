import Jimp from "jimp";
// import {readFileSync} from 'fs';

//https://github.com/oliver-moran/jimp/tree/master/packages/jimp

export interface ThumbailResult {
  buffer: Buffer;
  mimeType: string;
}

const checkImgType = (fileName: string) => {
  if (!/\.(jpg|jpeg|png|gif|bmp|tiff)$/i.test(fileName)) { //i: ignore case
    return false;
  } else {
    return true;
  }
};

export const getBlurThumbnail = async (
  imageArrayBuffer: ArrayBuffer | Buffer | string,
  fileName: string,
): Promise<ThumbailResult | null> => {
  //TODO:  Currently, only thumbnail images and Gaussian blur are supported.  Add other kinds of file to thumbnail later

  if (!checkImgType(fileName)) {
    console.log("unsupported convert to the thumbnail file name: ", fileName);
    return null;
  }
  //image: ArrayBuffer or image file path
  //return Buffer is thumbnail's buffer, string is image MiME type string, eg: 'image/png'

  //const myArrayBuffer = readFileSync("C:/Users/wangyi/Desktop/5.png", null).buffer;
  //const buf = Buffer.from(myArrayBuffer, 0, myArrayBuffer.byteLength);
  let buf /* :Buffer | string */;
  if (imageArrayBuffer instanceof ArrayBuffer) {
    buf = Buffer.from(imageArrayBuffer, 0, imageArrayBuffer.byteLength) as Buffer;
  } else if (imageArrayBuffer instanceof Buffer) {
    buf = imageArrayBuffer as Buffer;
  } else {
    //string
    buf = imageArrayBuffer as string;
  }

  const image = await Jimp.read(buf);
  // const image = await Jimp.read("C:/Users/wangyi/Desktop/5.png");
  // const w = image.getWidth();
  // const h = image.getHeight();
  const rw = 256;
  const mimeType = image.getMIME();

  return new Promise<ThumbailResult>((resolve, reject) => {
    try {
      image
        .resize(rw, Jimp.AUTO /* Math.round((rw * h * 1.0) / w) */) // resize
        //.quality(60) // set JPEG quality
        .blur(30)
        // .getBase64(Jimp.AUTO, (err, res) => {
        //   console.log(res);
        // if(!!err)
        // {
        //     reject(err);
        // }
        // else{
        //     //console.log(res); //base64 string
        //     resolve({ buffer: res, mimeType: mimeType });
        // }
        // })
        .getBuffer(image.getMIME() || Jimp.MIME_PNG, (err, buffer) => {
          if (!!err) {
            reject(err);
          } else {
            //console.log(buffer);
            resolve({ buffer: buffer, mimeType: mimeType });
          }
        });
      // .getBuffer(Jimp.MIME_PNG, (err, buffer) => {
      // if(!!err)
      // {
      //     reject(err);
      // }
      // else{
      //     //console.log(buffer);
      //     resolve({ buffer: buffer, mimeType: mimeType });
      // }
      // });
      //.write("lena-small-bw2.jpg");
    } catch (err) {
      reject(err);
    }
  });
};
