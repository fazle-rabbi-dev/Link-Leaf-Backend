/*

## Benifits of this custom error:

1. Additional properties
2. Custom predefined format

---- rest of the stuff present directly inside default Error class.

*/

type ErrorDetail = string | Record<string, unknown> | Record<string, unknown>[] | unknown[] | null;

type ApiErrorParams = {
	statusCode: number;
	message: string;
	errors?: ErrorDetail;
};

class ApiError extends Error {
	statusCode: number;
	errors: ErrorDetail;

	constructor({ statusCode, message, errors }: ApiErrorParams) {
		super(message);
		this.statusCode = statusCode;
		this.errors = errors ?? null;

		// this is to prevent this constructor fn frame from stack trace
		Error.captureStackTrace(this, this.constructor);
	}
}

export default ApiError;
