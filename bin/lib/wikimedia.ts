import {z} from 'zod';

// Return type for getCommonsImageInformation
export interface CommonsImageInfo {
	filename: string;
	url: string;
	width: number;
	height: number;
	license: string;
	usageTerms: string;
	artist: string;
}

// Zod schema for Wikimedia Commons API response
const ExtMetadataSchema = z.object({
	UsageTerms: z.object({
		value: z.string(),
	}),
	LicenseShortName: z.object({
		value: z.string(),
	}),
	Artist: z.object({
		value: z.string(),
	}),
});

const ImageInfoSchema = z.object({
	thumburl: z.string(),
	thumbwidth: z.number(),
	thumbheight: z.number(),
	extmetadata: ExtMetadataSchema,
});

const PageSchema = z.object({
	imageinfo: z.array(ImageInfoSchema).min(1),
});

const WikimediaResponseSchema = z.object({
	query: z.object({
		pages: z.record(z.string(), PageSchema),
	}),
});

export const getCommonsImageInformation = async (
	image: string,
): Promise<CommonsImageInfo> => {
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

	const rawData = await response.json();

	// Validate the response data with Zod
	const parseResult = WikimediaResponseSchema.safeParse(rawData);
	if (!parseResult.success) {
		throw new Error(`Invalid response format: ${parseResult.error.message}`);
	}

	const data = parseResult.data;
	const pages = data.query.pages;
	const page = Object.values(pages)[0];

	if (!page) {
		throw new Error('No page data found in response');
	}

	const imageInfo = page.imageinfo[0];
	const {thumburl, thumbwidth, thumbheight, extmetadata} = imageInfo;
	const {UsageTerms, LicenseShortName, Artist} = extmetadata;

	const usageTerms = UsageTerms.value;
	const license = LicenseShortName.value;
	const artist = Artist.value;

	const normalizedArtist = artist.replaceAll(/<[^>]+>/g, '');

	return {
		filename: image,
		url: thumburl,
		width: thumbwidth,
		height: thumbheight,
		license,
		usageTerms,
		artist: normalizedArtist,
	};
};

const LICENSE_ALLOWLIST = [
	'Public domain',
	'GPL',
	'MIT',
	'Apache License 2.0',
	'CC BY-SA 4.0',
	'CC BY-SA 3.0',
	'CC BY-SA 2.0',
	'CC BY 4.0',
	'CC0',
];

export const getCopyrightText = ({
	filename,
	license,
	usageTerms,
	artist,
}: CommonsImageInfo) => {
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
