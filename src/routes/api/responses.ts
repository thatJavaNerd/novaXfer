
export interface ResponseBase {
    status: number;
}

export interface SuccessResponse extends ResponseBase {
    data: any;
}

export interface ErrorResponse extends ResponseBase {
    error: { message: string, input: any };
}
