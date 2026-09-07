import type { Response } from "express";

type ApiResponseParams = {
	res: Response;
	statusCode: number;
	message: string;
	data?: object | null;
};

const apiResponse = ({ res, statusCode = 200, message, data }: ApiResponseParams) => {
	return res.status(statusCode).json({
		success: true,
		message: `${message}`,
		...(data && { data }),
	});
};

export default apiResponse;
