import type { NextFunction, Request, RequestHandler, Response } from "express";

type AsyncRequestHandler<TRequest extends Request = Request> = (
  req: TRequest,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

const asyncHandler = <TRequest extends Request = Request>(
  fn: AsyncRequestHandler<TRequest>
): RequestHandler => {
  return (req, res, next) => {
    void Promise.resolve(fn(req as TRequest, res, next)).catch(next);
  };
};

export default asyncHandler;
