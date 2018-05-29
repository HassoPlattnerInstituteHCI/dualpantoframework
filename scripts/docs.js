'use strict';

const fs = require('fs');
const {resolve} = require('path');
const {promisify} = require('util');

const documentation = require('documentation');
const {LinkerStack} = documentation.util;
const {walk} = require('documentation/lib/walk');
const GithubSlugger = require('github-slugger');

const writeFile = promisify(fs.writeFile);

const DOCS = resolve(__dirname, '..', 'docs');

const getFilename = doc => `${(doc.name[0] + doc.name.slice(1).replace(/[-_ ](.)|([A-Z])/g, '-$1$2')).toLowerCase()}.md`;

const paths = {};
const addNamespacesToPaths = docs => {
	const linkerStack = new LinkerStack({});

	linkerStack.namespaceResolver(docs, namespace => {
		const slugger = new GithubSlugger();
		return `#${slugger.slug(namespace)}`;
	});

	for(const doc of docs) {
		walk([doc], data => {
			const res = linkerStack.link(data.namespace);
			paths[data.namespace] = getFilename(doc) + res;
		});
	}
};

(async () => {
	const options = {
		config: resolve(DOCS, 'documentation.config.yml'),
		markdownToc: true,
		paths,
	};

	const docs = await documentation.build('lib/dualpantoframework.js', options);
	addNamespacesToPaths(docs);

	for(const doc of docs) {
		/* eslint-disable no-await-in-loop */
		const newDocs = [];
		for(const key of Object.keys(doc.members))
			newDocs.push(...doc.members[key]);

		const data = await documentation.formats.md(newDocs, options);
		let md = `# ${doc.name}\n\n`;
		try {
			md += doc.description.children[0].children[0].value;
			// eslint-disable-next-line
		} catch(err) {}
		md += data;
		await writeFile(resolve(DOCS, getFilename(doc)), md);
	}
})().catch(err => {
	console.error(err);
	process.exit(1);
});
