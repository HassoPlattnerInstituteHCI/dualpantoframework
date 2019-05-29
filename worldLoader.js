const SvgConverter = require('./Utils/svgConverter/svgConverter.js');
const svgConverter = new SvgConverter(process.argv[2],
    __dirname.substring(0, __dirname.lastIndexOf('/')));
svgConverter.loadWorld();
