import axios, { AxiosError } from "axios";
import dotenv from "dotenv";
import {
  IXeroClientConfig,
  Organisation,
  TokenSet,
  XeroClient,
} from "xero-node";

import { ensureError } from "../helpers/ensure-error.js";

dotenv.config();

const client_id = process.env.XERO_CLIENT_ID;
const client_secret = process.env.XERO_CLIENT_SECRET;
const bearer_token = process.env.XERO_CLIENT_BEARER_TOKEN;
const refresh_token = process.env.XERO_REFRESH_TOKEN;
const grant_type = "client_credentials";

if (!bearer_token && !refresh_token && (!client_id || !client_secret)) {
  throw Error("Environment Variables not set - please check your .env file");
}

abstract class MCPXeroClient extends XeroClient {
  public tenantId: string;
  private shortCode: string;

  protected constructor(config?: IXeroClientConfig) {
    super(config);
    this.tenantId = "";
    this.shortCode = "";
  }

  public abstract authenticate(): Promise<void>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  override async updateTenants(fullOrgDetails?: boolean): Promise<any[]> {
    await super.updateTenants(fullOrgDetails);
    if (this.tenants && this.tenants.length > 0) {
      this.tenantId = this.tenants[0].tenantId;
    }
    return this.tenants;
  }

  private async getOrganisation(): Promise<Organisation> {
    await this.authenticate();

    const organisationResponse = await this.accountingApi.getOrganisations(
      this.tenantId || "",
    );

    const organisation = organisationResponse.body.organisations?.[0];

    if (!organisation) {
      throw new Error("Failed to retrieve organisation");
    }

    return organisation;
  }

  public async getShortCode(): Promise<string | undefined> {
    if (!this.shortCode) {
      try {
        const organisation = await this.getOrganisation();
        this.shortCode = organisation.shortCode ?? "";
      } catch (error: unknown) {
        const err = ensureError(error);

        throw new Error(
          `Failed to get Organisation short code: ${err.message}`,
        );
      }
    }
    return this.shortCode;
  }
}

class CustomConnectionsXeroClient extends MCPXeroClient {
  private readonly clientId: string;
  private readonly clientSecret: string;

  // Legacy scopes (deprecated but still supported for existing apps)
  private readonly XERO_DEFAULT_AUTH_SCOPES_V1 = [
    "accounting.transactions",
    "accounting.contacts",
    "accounting.settings",
    "accounting.reports.read",
    "accounting.attachments",
    "payroll.settings",
    "payroll.employees",
    "payroll.timesheets",
    "files",
  ].join(" ");

  // Granular scopes (required for new apps)
  private readonly XERO_DEFAULT_AUTH_SCOPES_V2 = [
    "accounting.invoices",
    "accounting.payments",
    "accounting.banktransactions",
    "accounting.manualjournals",
    "accounting.reports.aged.read",
    "accounting.reports.balancesheet.read",
    "accounting.reports.profitandloss.read",
    "accounting.reports.trialbalance.read",
    "accounting.contacts",
    "accounting.settings",
    "accounting.attachments",
    "payroll.settings",
    "payroll.employees",
    "payroll.timesheets",
    "files",
  ].join(" ");

  constructor(config: {
    clientId: string;
    clientSecret: string;
    grantType: string;
  }) {
    super(config);
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
  }

  private formatTokenError(error: unknown, context: string): Error {
    const axiosError = error as AxiosError;
    const data = axiosError.response?.data;
    const message =
      typeof data === "object" ? JSON.stringify(data) : data || axiosError.message;
    return new Error(`Failed to get Xero token${context}: ${message}`);
  }

  public async getClientCredentialsToken(): Promise<TokenSet> {
    // If XERO_SCOPES is set, use that
    if (process.env.XERO_SCOPES) {                                                                                                                                                     
      try {
        return await this.requestToken(process.env.XERO_SCOPES);
      } catch (envError) {
        throw this.formatTokenError(envError, " with XERO_SCOPES");
      }
    }

    // Else if XERO_SCOPES is not set, try V1 scopes first (for existing apps), fallback to V2 scopes (for new apps) only on invalid_scope error
    try {
      return await this.requestToken(this.XERO_DEFAULT_AUTH_SCOPES_V1);
    } catch (error) {
      const axiosError = error as AxiosError;
      const isInvalidScope =
        axiosError.response?.status === 400 &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (axiosError.response?.data as any)?.error === "invalid_scope";

      if (!isInvalidScope) {
        throw this.formatTokenError(error, " with V1 scopes");
      }

      try {
        return await this.requestToken(this.XERO_DEFAULT_AUTH_SCOPES_V2);
      } catch (v2Error) {
        throw this.formatTokenError(v2Error, " with V2 scopes");
      }
    }
  }

  private async requestToken(scope: string): Promise<TokenSet> {
    const credentials = Buffer.from(
      `${this.clientId}:${this.clientSecret}`,
    ).toString("base64");

    const response = await axios.post(
      "https://identity.xero.com/connect/token",
      `grant_type=client_credentials&scope=${encodeURIComponent(scope)}`,
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
      },
    );

    // Get the tenant ID from the connections endpoint
    const token = response.data.access_token;
    const connectionsResponse = await axios.get(
      "https://api.xero.com/connections",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      },
    );

    if (connectionsResponse.data && connectionsResponse.data.length > 0) {
      this.tenantId = connectionsResponse.data[0].tenantId;
    }

    return response.data;
  }

  public async authenticate() {
    const tokenResponse = await this.getClientCredentialsToken();

    this.setTokenSet({
      access_token: tokenResponse.access_token,
      expires_in: tokenResponse.expires_in,
      token_type: tokenResponse.token_type,
    });
  }
}

class BearerTokenXeroClient extends MCPXeroClient {
  private readonly bearerToken: string;

  constructor(config: { bearerToken: string }) {
    super();
    this.bearerToken = config.bearerToken;
  }

  async authenticate(): Promise<void> {
    this.setTokenSet({
      access_token: this.bearerToken,
    });

    await this.updateTenants();
  }
}

class RefreshTokenXeroClient extends MCPXeroClient {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private currentRefreshToken: string;
  private accessTokenExpiresAt: number = 0; // epoch ms

  constructor(config: {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
  }) {
    super();
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.currentRefreshToken = config.refreshToken;
  }

  private async persistRotatedToken(newRefreshToken: string): Promise<void> {
    const renderApiKey = process.env.RENDER_API_KEY;
    const renderServiceId = process.env.RENDER_SERVICE_ID;

    if (!renderApiKey || !renderServiceId) {
      console.error("Warning: RENDER_API_KEY or RENDER_SERVICE_ID not set — rotated refresh token will be lost on restart");
      return;
    }

    try {
      const baseUrl = `https://api.render.com/v1/services/${renderServiceId}/env-vars`;
      const headers = {
        Authorization: `Bearer ${renderApiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      };

      // GET current env vars so we don't wipe them with the PUT
      // Render returns [{ cursor, envVar: { key, value } }] — flatten to [{ key, value }]
      const current = await axios.get(baseUrl, { headers });
      const envVars: Array<{ key: string; value: string }> = (current.data ?? [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((item: any) => item.envVar ?? item)
        .filter((e: { key?: string }) => e.key);

      const updated = envVars.some((e) => e.key === "XERO_REFRESH_TOKEN")
        ? envVars.map((e) =>
            e.key === "XERO_REFRESH_TOKEN" ? { key: e.key, value: newRefreshToken } : e,
          )
        : [...envVars, { key: "XERO_REFRESH_TOKEN", value: newRefreshToken }];

      await axios.put(baseUrl, updated, { headers });
    } catch (err) {
      console.error("Warning: could not persist rotated refresh token to Render:", err);
    }
  }

  async authenticate(): Promise<void> {
    // Skip if access token is still valid (with 60s buffer)
    if (Date.now() < this.accessTokenExpiresAt - 60_000) {
      return;
    }

    const credentials = Buffer.from(
      `${this.clientId}:${this.clientSecret}`,
    ).toString("base64");

    const response = await axios.post(
      "https://identity.xero.com/connect/token",
      `grant_type=refresh_token&refresh_token=${encodeURIComponent(this.currentRefreshToken)}`,
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
      },
    );

    this.setTokenSet({
      access_token: response.data.access_token,
      expires_in: response.data.expires_in,
      token_type: response.data.token_type,
    });

    // Cache expiry: expires_in is in seconds (Xero gives 1800 = 30 min)
    this.accessTokenExpiresAt = Date.now() + (response.data.expires_in ?? 1800) * 1000;

    if (response.data.refresh_token) {
      this.currentRefreshToken = response.data.refresh_token;
      await this.persistRotatedToken(response.data.refresh_token);
    }

    await this.updateTenants();
  }
}

export const xeroClient = bearer_token
  ? new BearerTokenXeroClient({
      bearerToken: bearer_token,
    })
  : refresh_token
    ? new RefreshTokenXeroClient({
        clientId: client_id!,
        clientSecret: client_secret!,
        refreshToken: refresh_token,
      })
    : new CustomConnectionsXeroClient({
        clientId: client_id!,
        clientSecret: client_secret!,
        grantType: grant_type,
      });
