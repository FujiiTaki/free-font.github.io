import fs from 'fs-extra';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { openSync } from 'fontkit';
import pinyin from 'pinyin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const outputDir = path.join(__dirname, '../docs/');

const pinyinFn = pinyin.default || pinyin;

/** CJK Unified Ideographs (incl. common traditional forms) */
const CJK_PATTERN = /[\u3400-\u9fff]/;

/* 是否存在汉字 */
function containsNoChineseCharacters(str) {
  // 正则表达式匹配中文汉字范围
  const chineseCharacterPattern = /[\u4e00-\u9fa5]/;
  // 测试字符串中是否包含中文汉字
  return !chineseCharacterPattern.test(str);
}

/**
 * Convert a font/display name to a filesystem-safe image base name.
 * Chinese characters become pinyin letters; Latin/digits/symbols are kept.
 * e.g. "多彩立直麻将字体" -> "duocailizhimajiangziti"
 *      "Aa剑豪体" -> "Aajianhaoti"
 *      "FiraCode-Bold" -> "FiraCode-Bold"
 * @param {string} name
 * @returns {string}
 */
export function toImageName(name) {
  if (!name) return name;
  if (!CJK_PATTERN.test(name)) return name;
  return pinyinFn(name, { style: pinyinFn.STYLE_NORMAL, heteronym: false })
    .flat()
    .join('')
    .replace(/\s+/g, '');
}

const chineseCharacterContent = `
        <article>
          <div class="poem">
            <div class="poem-title">《江雪》<i class="poet">柳宗元</i></div>
            <div class="poem-content">
              千山鸟飞绝，万径人踪灭。<br/>
              孤舟蓑笠翁，独钓寒江雪。
            </div>
          </div>
        </article>
        <article>
          <div class="poem">
            <div class="poem-title">《江雪》<i class="poet">柳宗元</i></div>
            <div class="poem-content">
              千山鳥飛絕，萬徑人蹤滅。<br/>
              孤舟蓑笠翁，獨釣寒江雪。
            </div>
          </div>
        </article>
`;

const englishCharacterContent = `<div class="poem-content" style="font-size: 24px;">The quick brown fox jumps over the lazy dog.</div>`
const mahjongCharacterContent = `
        <article>
          <div class="poem">
            <div class="poem-content" style="font-size: 83px;">
              1m 2m 3m 4m 5m 6m 7m 8m 9m<br/>
              1p 2p 3p 4p 5p 6p 7p 8p 9p<br/>
              1s 2s 3s 4s 5s 6s 7s 8s 9s<br/>
              1z 2z 3z 4z 5z 6z 7z<br/>
              1. 2. 3. 4. 5. 6. 
            </div>
          </div>
        </article>
        <article>
          <div class="poem">
            <div class="poem-content" style="font-size: 83px;">
              0m 0p 0s 0z<br/>
              5m* 5p* 5s*<br/><br/>
              2m= &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              5s= &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              1z=<br/>
              1m=*_2m= &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 
              3m= &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 
              4m= &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 
              5m= 6m= 7m= 8m= 9m=
            </div>
          </div>
        </article>
`;
const alphabet = `
      <section>
        <pre>A B C D E F G H I J K L M N O P Q R S T U V W X Y Z</pre>
        <pre>a b c d e f g h i j k l m n o p q r s t u v w x y z</pre>
        <pre>0 1 2 3 4 5 6 7 8 9</pre>
      </section>
`;
/** 动态生成字体预览 HTML 内容 */
const generatePreviewHTMLContent = (fontPath, fileName, character = chineseCharacterContent, footer = alphabet) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @font-face {
      font-family: 'CustomFont';
      src: url('${fontPath}') format('truetype');
      /*src: url('../docs/fonts/美績点陣體/美績点陣體.ttf') format('truetype');*/
    }
    html { height: 100%; }
    body, pre, .poem { font-family: 'CustomFont', sans-serif; }
    body { margin: 0; display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; background-color: #282828;}
    .poem { text-align: center; line-height: 1.5; margin: 20px auto; }
    .poet { font-size: 0.65em; margin-bottom: 6px; color: #838383; position: absolute; margin-top: 6px;}
    .poem-title { font-size: 0.96em; margin-bottom: 3px; }
    .poem-content { font-size: 0.96em; line-height: 1; }
    .poster { text-align: center; font-size: 42px; color: #ffffff; width: 1200px; height: 630px; display: flex; flex-direction: column; justify-content: center; overflow: hidden; }
    .poster pre { margin: 0; padding: 0 1em; font-size: 0.95em; line-height: 1; white-space: pre-wrap; }
    .poster main { display: flex; justify-content: center; gap: 24px; }
    .poster > div { display: flex; flex-direction: column; gap: 12px; }
    .poster section { display: flex; flex-direction: column; gap: 0.3em; }
  </style>
  <title>Font Preview</title>
</head>
<body>
  <div class="poster">
    <div>
      <div>「${fileName}」</div>
      <main>${character}</main>
      ${footer}
    </div>
  </div>
</body>
</html>

`;

/** 动态生成 HTML 内容 */
export const generateHTMLContent = (fontPath, fileName, demo) => `<!DOCTYPE html><html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @font-face {
      font-family: 'CustomFont';
      src: url('${fontPath}') format('truetype');
      /*src: url('../docs/fonts/美績点陣體/美績点陣體.ttf') format('truetype');*/
    }
    html { height: 100%; }
    body {
      margin: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
      background-color: #141414;
      font-family: 'CustomFont', sans-serif;
    }
    .poster > div:first-child { line-height: 1; padding: 0 12px; }
    .poster > div:last-child { font-size: 28px; padding-top: 6px; }
    .poster { text-align: center; font-size: 42px; color: #ffffff; }
  </style>
  <title>Font Preview</title>
</head>
<body>
  <div class="poster">
    <div>${fileName}</div>
    <div>${demo != "" ? demo : "Hello World! 123"}</div>
  </div>
</body>
</html>
`;

/**
 * @param {import('puppeteer').Browser} browser
 * @param {string} filePath font file path
 * @param {string} fontName display / data name (may contain Chinese)
 */
export async function createPosterImage(browser, filePath, fontName = "") {
  const page = await browser.newPage();
  const fontPath = path.relative(__dirname, path.resolve(filePath)).split(path.sep).join("/");
  const htmlFilePath = path.join(__dirname, 'poster.html');
  /// 英文字体
  const isEnglish = fontPath.split(path.sep).includes("english");
  const fontText = isEnglish ? fontName : (containsNoChineseCharacters(fontName) ? `${fontName}字体` : fontName);
  /// 图片文件名：中文转拼音字母，避免 URL 含中文
  const fileBaseName = toImageName(fontName) || fontName;
  let demo = "<div>Hello World! 123</div>";
  if (fontPath.includes("麻将字体")) {
    demo = "<div style=\"font-size: 43px;\">7m7m7m2p3p4p8p8p8p4s</div>";
  }
  const htmlContent = generateHTMLContent(fontPath, fontText.replace(/-/g, " "), demo);
  fs.writeFileSync(htmlFilePath, htmlContent);

  const fileHTMLPath = `file:${htmlFilePath}`;
  try {
    await page.goto(fileHTMLPath, { waitUntil: 'networkidle2' });
    const width = 420;
    const height = 180;
    const deviceScaleFactor = 1;
    await page.setViewport({ width: width, height: height, deviceScaleFactor });
    const buffer = await page.screenshot({ type: 'jpeg' });
    const fileName = `docs/images/${fileBaseName}-poster.jpg`;
    fs.writeFileSync(fileName, buffer);
    console.log(`Image created and saved as \x1b[32;1m${fileName}\x1b[0m! ${filePath}`);

    const htmlPreviewFilePath = path.join(__dirname, 'preview.html');

    let demoContent = "";
    let demoAlphabetContent = alphabet;
    if (isEnglish) {
      demoContent = englishCharacterContent;
    } else if (fontPath.includes("麻将字体")) {
      demoContent = mahjongCharacterContent;
      demoAlphabetContent = "";
    } else {
      demoContent = chineseCharacterContent;
    }

    const htmlPreviewContent = generatePreviewHTMLContent(fontPath, fontText.replace(/-/g, " "), demoContent, demoAlphabetContent);
    fs.writeFileSync(htmlPreviewFilePath, htmlPreviewContent);
    const filePreviewHTMLPath = `file:${htmlPreviewFilePath}`;
    await page.goto(filePreviewHTMLPath, { waitUntil: 'networkidle2' });
    const previewWidth = isEnglish ? 800 : 1200;
    const previewHeight = isEnglish ? 450 : 675;
    const previewDeviceScaleFactor = 2;
    await page.setViewport({ width: previewWidth, height: previewHeight, deviceScaleFactor: previewDeviceScaleFactor});
    const previewBuffer = await page.screenshot({ type: 'jpeg' });
    const filePreviewName = `docs/images/${fileBaseName}-preview.jpg`;
    fs.writeFileSync(filePreviewName, previewBuffer);
    console.log(`Image created and saved as \x1b[32;1m${filePreviewName}\x1b[0m! ${filePath}`);
  } finally {
    await page.close();
  }
}

export async function getFontFiles(dirPath) {
  let fontFiles = [];
  const fontExtensions = ['.ttf', '.otf', 'ttc'];
  async function traverseDirectory(currentPath) {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });
    for (let entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        await traverseDirectory(fullPath);
      } else if (fontExtensions.includes(path.extname(entry.name).toLowerCase())) {
        fontFiles.push(fullPath);
      }
    }
  }
  await traverseDirectory(dirPath);
  return fontFiles;
}

export function removeRootPathSegment(filePath, outputDir = "") {
  if (outputDir) {
    filePath = path.relative(outputDir, filePath);
  }
  return filePath.split(path.sep).join("/");
}

/**
 * Convert a TrueType Collection (TTC) version number to a more readable format.
 * version: `65536` -> `1.0`
 * @param {number} version 
 * @returns {string}
 */
function convertTTCVersion(version) {
  const major = version >> 16;   // 高16位
  const minor = version & 0xFFFF;  // 低16位
  return `${major}.${minor}`;
}

/**
 * 版本号获取函数
 * ```
 * "Version 1.000;beta"
 * "Version 1.000;Glyphs 3.1.1 (3148)"
 * "Version 2.0.1"
 * "Version 4.56; 4.5.6.0"
 * "Version 1.00;January 14, 2021;FontCreator 12.0.0.2552 32-bit"
 * "Version 1.015;June 12, 2024;FontCreator 14.0.0.2901 64-bit"
 * null,
 * "Version 3.12"
 * "Version 0.0.1 "
 * ```
 */
export function extractVersion(versionString) {
  // 如果输入是 null 或 undefined，则返回 null
  if (!versionString) return null;
  
  // 使用正则表达式匹配 "Version " 后面的版本号
  const match = versionString.match(/Version\s([\d.]+)/);
  
  // 如果匹配成功，返回第一个捕获组（即版本号），否则返回 null
  return match ? match[1] : null;
}

/** 
 * 版本号转换
 * @param {number | string} version
 * @param {boolean} isTTC
 * @returns {string | null}
 */
export function convertVersion(version, isTTC = false) {
  if (isTTC) {
    return convertTTCVersion(version);
  }
  return extractVersion(version)
}

/**
 * 获取 TTC 文件中所有字体的信息
 * @param {string} ttcPath - TTC 文件路径
 * @returns {Array} 字体信息数组
 */
export function getTTCFontsInfo(ttcPath) {
  const collection = openSync(ttcPath);
  const fontsInfo = collection.fonts.map(f => {
    return {
      familyName: f.familyName,
      subfamilyName: f.subfamilyName,
      fullName: f.fullName,
      postscriptName: f.postscriptName,
      numGlyphs: f.numGlyphs,
      copyright: f.copyright,
      version: f.version
    };
  });
  return fontsInfo;
}


export function copyrightFormat(copyright) {
  return copyright ? copyright.replace(/[<&"]/g, (c) => (({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c])) : null;
}