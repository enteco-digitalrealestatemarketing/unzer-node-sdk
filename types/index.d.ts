// Type declarations for unzer-node-sdk (CommonJS).

export interface UnzerOptions {
  baseUrl?: string;
  locale?: string;
  fetchImpl?: typeof fetch;
  /** Optional per-request timeout in milliseconds. Unset → no timeout. */
  timeoutMs?: number;
}

export interface TransactionParams {
  amount?: string | number;
  currency?: string;
  returnUrl?: string;
  typeId?: string;
  customerId?: string;
  metadataId?: string;
  basketId?: string;
  orderId?: string;
  paymentReference?: string;
  card3ds?: boolean;
  additionalTransactionData?: Record<string, unknown>;
  [key: string]: unknown;
}

export class UnzerApiError extends Error {
  statusCode?: number;
  errors: Array<Record<string, unknown>>;
  code: string | null;
  merchantMessage: string | null;
  customerMessage: string | null;
  id: string | null;
  body: Record<string, unknown> | null;
}

export class AbstractResource {
  [key: string]: unknown;
  getId(): string | null;
  toApiPayload(): Record<string, unknown>;
}

export class AbstractTransaction extends AbstractResource {
  getPaymentId(): string | null;
  getRedirectUrl(): string | null;
  succeeded(): boolean;
  pending(): boolean;
  errored(): boolean;
}

export class Authorization extends AbstractTransaction {
  charge(amount?: string | number): Promise<Charge>;
  cancel(amount?: string | number): Promise<Cancellation>;
}

export class Charge extends AbstractTransaction {
  cancel(amount?: string | number): Promise<Cancellation>;
}

export class Cancellation extends AbstractTransaction {}

export class Payment extends AbstractResource {
  getPaymentId(): string | null;
  getState(): unknown;
  getAmount(): unknown;
  charge(amount?: string | number): Promise<Charge>;
  cancelAuthorization(amount?: string | number): Promise<Cancellation>;
}

export class Customer extends AbstractResource {}
export class Basket extends AbstractResource {}
export class Metadata extends AbstractResource {}
export class Webhook extends AbstractResource {}

export class BasePaymentType {
  constructor(data?: Record<string, unknown>);
  apiName(): string;
  getId(): string | null;
  toApiPayload(): Record<string, unknown>;
}
export class Card extends BasePaymentType {}
export class Paypal extends BasePaymentType {}
export class Sofort extends BasePaymentType {}
export class Eps extends BasePaymentType {}

export class HttpClient {
  constructor(privateKey: string, options?: UnzerOptions);
  baseUrl: string;
  locale: string;
  timeoutMs?: number;
  buildUrl(path: string): string;
  isSameOrigin(url: string): boolean;
  request(method: string, path: string, body?: unknown): Promise<any>;
  get(path: string): Promise<any>;
  post(path: string, body?: unknown): Promise<any>;
  put(path: string, body?: unknown): Promise<any>;
  delete(path: string): Promise<any>;
}

export class Unzer {
  constructor(privateKey: string, options?: UnzerOptions);
  http: HttpClient;

  authorize(params?: TransactionParams): Promise<Authorization>;
  charge(params?: TransactionParams): Promise<Charge>;
  chargeAuthorization(paymentId: string, amount?: string | number): Promise<Charge>;
  cancelAuthorization(paymentId: string, amount?: string | number): Promise<Cancellation>;
  cancelCharge(paymentId: string, chargeId: string, amount?: string | number): Promise<Cancellation>;

  fetchPayment(paymentId: string): Promise<Payment>;
  fetchAuthorization(paymentId: string): Promise<Authorization>;
  fetchCharge(paymentId: string, chargeId: string): Promise<Charge>;

  createOrUpdateCustomer(customer: Record<string, unknown> | Customer): Promise<Customer>;
  fetchCustomer(customerId: string): Promise<Customer>;
  deleteCustomer(customerId: string): Promise<any>;

  createBasket(basket: Record<string, unknown> | Basket): Promise<Basket>;
  fetchBasket(id: string): Promise<Basket>;

  createMetadata(metadata: Record<string, unknown> | Metadata): Promise<Metadata>;
  fetchMetadata(id: string): Promise<Metadata>;

  createPaymentType(type: BasePaymentType | Record<string, unknown>): Promise<any>;
  fetchPaymentType(typeId: string): Promise<any>;

  createWebhook(url: string, event: string): Promise<Webhook>;
  createWebhooks(url: string, events: string[]): Promise<any>;
  fetchAllWebhooks(): Promise<Webhook[]>;
  fetchWebhook(id: string): Promise<Webhook>;
  deleteWebhook(id: string): Promise<any>;
  deleteAllWebhooks(): Promise<any>;
  fetchResourceFromEvent(event: string | Record<string, unknown>): Promise<any>;
}

declare const _default: typeof Unzer & {
  Unzer: typeof Unzer;
  HttpClient: typeof HttpClient;
  UnzerApiError: typeof UnzerApiError;
  AbstractResource: typeof AbstractResource;
  AbstractTransaction: typeof AbstractTransaction;
  Payment: typeof Payment;
  Authorization: typeof Authorization;
  Charge: typeof Charge;
  Cancellation: typeof Cancellation;
  Customer: typeof Customer;
  Basket: typeof Basket;
  Metadata: typeof Metadata;
  Webhook: typeof Webhook;
  BasePaymentType: typeof BasePaymentType;
  Card: typeof Card;
  Paypal: typeof Paypal;
  Sofort: typeof Sofort;
  Eps: typeof Eps;
  paymentTypes: {
    BasePaymentType: typeof BasePaymentType;
    Card: typeof Card;
    Paypal: typeof Paypal;
    Sofort: typeof Sofort;
    Eps: typeof Eps;
  };
  endpoints: Record<string, unknown>;
  paymentState: Record<string, unknown>;
  webhookEvents: Record<string, string>;
  constants: Record<string, unknown>;
};

export default _default;
export = _default;
