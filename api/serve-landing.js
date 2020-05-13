const str = `
# REPKG
REPKG is a service that re-bundles npm packages to different target types
`;

const landingTpl = `
<!doctype html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/4.0.0/github-markdown.min.css">
</head>
<body>
	<div id="md" class="markdown-body">Loading...</div>
	<script src="https://cdn.jsdelivr.net/npm/js-cookie@rc/dist/js.cookie.min.js"></script>
	<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
	<script src="https://unpkg.com/systemjs@6.3.1/dist/system.min.js"></script>
	<script src="https://unpkg.com/systemjs@6.3.1/dist/extras/amd.min.js"></script>
	<script type="text/javascript">	



    const imports = {
        randomfill: '/randomfill',        
    };

    const $s = document.createElement('script');
    $s.type = 'systemjs-importmap';
    $s.innerHTML = JSON.stringify({ imports });
    document.head.append($s);

    System.import('/diffie-hellman@5.0.3/browser.js').then(console.log);
    [
		// 'randomfill@1.0.3',
		// 'randombytes@^2.0.5',
		// 'randombytes@2.0.0',
		// 'create-hash@1.1.0',
		// 'readable-stream@3.6.0',
		// 'readable-stream@3.5.0',
		// 'readable-stream@2.0.2',
		// 'stream-browserify@2.0.1',
		// 'readable-stream@2.0.2/duplex.js',
		// 'readable-stream@2.0.2/passthrough.js',
		// 'readable-stream@2.0.2/writable.js',
		// 'readable-stream@2.0.2/transform.js',
		// 'readable-stream@2.0.2/readable.js',
		// 'better-ajv-errors@0.6.7/lib/modern/index.js',

		// 'brorand@^1.0.1',
		// 'crypto-browserify@^3.11.0',
		// 'uuid@3.2.1/v1',
		// 'miller-rabin@^4.0.0',
		// 'parse-asn1@^5.0.0'
	].forEach((moduleName) => {
	    System.import('/' + moduleName).then(m => console.log(moduleName, m));
	});


	md.innerHTML = marked(${JSON.stringify(str)});
	</script>
</body>
</html>
`;

module.exports = (req, res) => {
	res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
	res.send(landingTpl);
};
