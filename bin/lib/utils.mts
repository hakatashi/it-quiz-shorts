export const fetchWithRetry = async (
	url: string,
	options: RequestInit = {},
	retries: number = 5,
	delay: number = 1000,
): Promise<Response> => {
	for (let attempt = 0; attempt < retries; attempt++) {
		try {
			const response = await fetch(url, options);
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return response;
		} catch (error) {
			console.error(error);
			if (attempt < retries - 1) {
				await new Promise((resolve) => setTimeout(resolve, delay));
			} else {
				throw error;
			}
		}
	}
	throw new Error('Failed to fetch after multiple retries');
};
