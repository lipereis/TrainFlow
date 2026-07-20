import { HttpExceptionFilter } from "./http-exception.filter";
import { ArgumentsHost, HttpException, HttpStatus } from "@nestjs/common";

describe("HttpExceptionFilter", () => {
  it("maps HttpException response object with code", () => {
    const filter = new HttpExceptionFilter();
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
      }),
    } as unknown as ArgumentsHost;

    filter.catch(
      new HttpException(
        { code: "CLIENT_NOT_FOUND", message: "Client not found" },
        HttpStatus.NOT_FOUND,
      ),
      host,
    );

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      code: "CLIENT_NOT_FOUND",
      message: "Client not found",
    });
  });
});
