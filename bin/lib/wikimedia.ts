export const getCommonsImageInformation = async (image: string) => {
	const query = {
		action: 'query',
		format: 'json',
		uselang: 'en',
		inprop: 'url',
		titles: `File:${image}`,
		prop: 'info|imageinfo|entityterms',
		iiprop: 'url|size|mime|extmetadata',
		iiurlwidth: 2000,
		iiurlheight: 2000,
	};

	const url = new URL('https://commons.wikimedia.org/w/api.php');
	Object.entries(query).forEach(([key, value]) => {
		url.searchParams.append(key, String(value));
	});

	const response = await fetch(url.toString());
	if (!response.ok) {
		throw new Error(
			`Failed to fetch image information: ${response.statusText}`,
		);
	}

	const data = await response.json();
	const pages = data.query?.pages;
	if (!pages || typeof pages !== 'object') {
		throw new Error(
			'Invalid response format: "pages" not found or not an object',
		);
	}

	const page: any = Object.values(pages)?.[0];
	const imageInfo = page?.imageinfo?.[0];
	if (!imageInfo) {
		throw new Error(
			'Invalid response format: "imageinfo" not found or not an array',
		);
	}

	const thumburl = imageInfo.thumburl;
	if (typeof thumburl !== 'string') {
		throw new Error(
			'Invalid response format: "thumburl" not found or not a string',
		);
	}

	const thumbwidth = imageInfo.thumbwidth;
	if (typeof thumbwidth !== 'number') {
		throw new Error(
			'Invalid response format: "thumbwidth" not found or not a number',
		);
	}

	const thumbheight = imageInfo.thumbheight;
	if (typeof thumbheight !== 'number') {
		throw new Error(
			'Invalid response format: "thumbheight" not found or not a number',
		);
	}

	const usageTerms = imageInfo?.extmetadata?.UsageTerms?.value;
	if (typeof usageTerms !== 'string') {
		throw new Error(
			'Invalid response format: "usageTerms" or "license" not found or not a string',
		);
	}

	const license = imageInfo?.extmetadata?.LicenseShortName?.value;
	if (typeof license !== 'string') {
		throw new Error(
			'Invalid response format: "license" not found or not a string',
		);
	}

	const artist = imageInfo?.extmetadata?.Artist?.value;
	if (typeof artist !== 'string') {
		throw new Error(
			'Invalid response format: "artist" not found or not a string',
		);
	}

	const normalizedArtist = artist.replaceAll(/<[^>]+>/g, '');

	return {
		filename: image,
		url: thumburl,
		width: thumbwidth,
		height: thumbheight,
		license: license,
		usageTerms: usageTerms,
		artist: normalizedArtist,
	};
};

const LICENSE_ALLOWLIST = [
	'Public domain',
	'Apache License 2.0',
	'CC BY-SA 4.0',
	'CC BY-SA 3.0',
];

export const getCopyrightText = ({
	filename,
	license,
	usageTerms,
	artist,
}: {
	filename: string;
	license: string;
	usageTerms: string;
	artist: string;
}) => {
	if (!license || !LICENSE_ALLOWLIST.includes(license)) {
		throw new Error(`Unsupported license: ${license}`);
	}

	return [
		`Based on the image “${filename}” on Wikimedia Commons.`,
		`Authored by ${artist} and licenced under ${usageTerms}.`,
	].join('\n');
};

if (require.main === module) {
	getCommonsImageInformation('JetBrains PyCharm Product Logo.svg')
		.then((d) => console.log('Image information fetched successfully:', d))
		.catch((error) =>
			console.error('Error fetching image information:', error),
		);
}
