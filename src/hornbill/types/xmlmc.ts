export type XmlmcEnvelope<
  TService extends string,
  TMethod extends string,
  TParams extends Record<string, unknown>,
> = {
  '@service': TService;
  '@method': TMethod;
  params: TParams;
};

export type XmlmcParamType = 'xs:string' | 'xs:int' | 'xs:boolean' | 'xs:dateTime';

export type XmlmcParamDefinition = {
  type: XmlmcParamType;
  required: boolean;
};

export type XmlmcValidationError = {
  field: string;
  message: string;
};

export type XmlmcValidationResult<TEnvelope> =
  | {
      ok: true;
      value: TEnvelope;
    }
  | {
      ok: false;
      errors: XmlmcValidationError[];
    };
