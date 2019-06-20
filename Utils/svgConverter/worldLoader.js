const SvgConverter = require('./svgConverter');
// cut off three levls -> end up in framework's parent dir
let lastIndex = __dirname.length;
let hitCount = 0;
while (hitCount < 3 && lastIndex > 0) {
  lastIndex--;
  const char = __dirname.charAt(lastIndex);
  if (char == '/' || char == '\\') {
    hitCount++;
  }
}
const svgConverter = new SvgConverter(
    process.argv[2],
    __dirname.substring(0, lastIndex));
svgConverter.loadWorld();
