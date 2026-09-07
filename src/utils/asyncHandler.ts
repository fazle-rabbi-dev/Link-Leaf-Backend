/* 
this handler is a higher order function

this handler get called during runtime and receive fn as argument that contains logic
and than this fn return a new fn because:: express need a fn reference to execute the request.

and when express call that new fn then the original fn will get execute
   > actually from this file calling happens on the fn that is located in other file

   > and a sync fn return undefined and async fn return promise
   > we need a way to catch the error thrown from the actuall logic container fn
   > if that fn is an async than we can directly do fn(req, res, next).catch(next);
   > but if that fn is an sync than we cant do that
   > so we wrap the fn call in promise and if it reject than catch(next) will catch the error and pass it to the error handler middleware

   #### Cool thing is that: Promise.resolve() create a new promise when we pass a normal value but when we pass another promise than it just return it back. that's why it works for both scenario ####
*/

import type { NextFunction, Request, Response } from "express";

type ExpressHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

const asyncHandler = (fn: ExpressHandler) => {
	return (req: Request, res: Response, next: NextFunction) => {
		Promise.resolve(fn(req, res, next)).catch(next);
	};
};

export default asyncHandler;
