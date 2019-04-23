const SvgConverter = require('./Utils/svgConverter/svgConverter.js');
const svgConverter = new SvgConverter(process.argv[2]);
svgConverter.loadWorld();
