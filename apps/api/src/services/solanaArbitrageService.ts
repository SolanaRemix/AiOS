/**
 * Solana Flashloan Arbitrage Service
 *
 * Provides an interface to the WASM-compiled arbitrage executor.
 * The WASM module handles on-chain swap execution, leverage, and
 * profit routing.  In CI / dev the module is stubbed so the API
 * can start without a compiled binary.
 */

import { logger } from '../config/logger';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ArbitrageConfig {
  /** Max slippage tolerance as a decimal (e.g. 0.005 = 0.5 %) */
  slippageTolerance: number;
  /** Minimum profit in lamports after fees */
  minProfitLamports: number;
  /** Maximum number of hops in the swap route */
  maxHops: number;
  /** Whether to use leverage (borrow > repay within same tx) */
  useLeverage: boolean;
}

export interface ArbitrageOpportunity {
  id: string;
  tokenA: string;
  tokenB: string;
  dexIn: string;
  dexOut: string;
  amountIn: bigint;
  expectedProfit: bigint;
  route: string[];
  timestamp: number;
}

export interface ExecutionResult {
  success: boolean;
  txSignature?: string;
  profitLamports?: bigint;
  feeLamports?: bigint;
  durationMs: number;
  error?: string;
}

export interface AuditEntry {
  timestamp: number;
  opportunityId: string;
  executed: boolean;
  profitLamports: bigint;
  txSignature?: string;
  riskScore: number;
}

// ─── WASM Module interface stub ───────────────────────────────────────────────

interface WasmArbitrageModule {
  scan_opportunities(configJson: string): string;
  execute_arbitrage(opportunityJson: string, rpcUrl: string, keypairBytes: Uint8Array): string;
  audit_transaction(txSignature: string, rpcUrl: string): string;
}

let wasmModule: WasmArbitrageModule | null = null;

const WASM_MODULE_PATH = '../../wasm/solana_arbitrage.js';

/**
 * Lazily loads the WASM module.  Falls back to a mock stub when the
 * compiled binary is not present (development / CI environments).
 */
async function loadWasmModule(): Promise<WasmArbitrageModule> {
  if (wasmModule) return wasmModule;

  try {
    // Dynamic import so the server starts even without the binary
    const wasm = await import(
      /* webpackIgnore: true */ WASM_MODULE_PATH as string
    ) as WasmArbitrageModule;
    wasmModule = wasm;
    logger.info('Solana arbitrage WASM module loaded');
    return wasmModule;
  } catch {
    logger.warn('WASM module not found – using mock arbitrage stub');
    wasmModule = createMockModule();
    return wasmModule;
  }
}

function createMockModule(): WasmArbitrageModule {
  return {
    scan_opportunities: (_configJson: string) => {
      const opportunities: ArbitrageOpportunity[] = [
        {
          id: `opp_${Date.now()}`,
          tokenA: 'SOL',
          tokenB: 'USDC',
          dexIn: 'Orca',
          dexOut: 'Raydium',
          amountIn: BigInt(1_000_000_000),
          expectedProfit: BigInt(25_000),
          route: ['SOL', 'USDC', 'SOL'],
          timestamp: Date.now(),
        },
      ];
      return JSON.stringify(opportunities, (_k, v) =>
        typeof v === 'bigint' ? v.toString() : v
      );
    },
    execute_arbitrage: (_oppJson: string, _rpc: string, _kp: Uint8Array) => {
      const result: Omit<ExecutionResult, 'profitLamports' | 'feeLamports'> & {
        profitLamports: string;
        feeLamports: string;
      } = {
        success: true,
        txSignature: `mock_tx_${Math.random().toString(36).slice(2)}`,
        profitLamports: '25000',
        feeLamports: '5000',
        durationMs: 420,
      };
      return JSON.stringify(result);
    },
    audit_transaction: (txSignature: string, _rpc: string) => {
      const entry = {
        txSignature,
        slot: Math.floor(Math.random() * 300_000_000),
        fee: 5000,
        status: 'confirmed',
        auditedAt: Date.now(),
        riskScore: 0.12,
      };
      return JSON.stringify(entry);
    },
  };
}

// ─── Service class ────────────────────────────────────────────────────────────

export class SolanaArbitrageService {
  private readonly rpcUrl: string;
  private auditLog: AuditEntry[] = [];

  constructor() {
    this.rpcUrl =
      process.env.SOLANA_RPC_URL ?? 'https://api.mainnet-beta.solana.com';
  }

  /** Scan on-chain DEX pools for profitable arbitrage windows */
  async scanOpportunities(
    config: Partial<ArbitrageConfig> = {}
  ): Promise<ArbitrageOpportunity[]> {
    const fullConfig: ArbitrageConfig = {
      slippageTolerance: 0.005,
      minProfitLamports: 10_000,
      maxHops: 3,
      useLeverage: false,
      ...config,
    };

    const wasm = await loadWasmModule();
    const raw = wasm.scan_opportunities(JSON.stringify(fullConfig));
    const opps = JSON.parse(raw) as Array<Record<string, unknown>>;

    return opps.map((o) => ({
      id: String(o.id),
      tokenA: String(o.tokenA),
      tokenB: String(o.tokenB),
      dexIn: String(o.dexIn),
      dexOut: String(o.dexOut),
      amountIn: BigInt(String(o.amountIn)),
      expectedProfit: BigInt(String(o.expectedProfit)),
      route: o.route as string[],
      timestamp: Number(o.timestamp),
    }));
  }

  /**
   * Execute a flashloan arbitrage opportunity.
   * The keypair is loaded from env / secrets – never logged.
   */
  async executeArbitrage(opportunity: ArbitrageOpportunity): Promise<ExecutionResult> {
    const start = Date.now();
    try {
      const wasm = await loadWasmModule();

      const keypairBytes = new Uint8Array(
        Buffer.from(process.env.SOLANA_KEYPAIR_BASE64 ?? '', 'base64')
      );

      const raw = wasm.execute_arbitrage(
        JSON.stringify(opportunity, (_k, v) =>
          typeof v === 'bigint' ? v.toString() : v
        ),
        this.rpcUrl,
        keypairBytes
      );

      const res = JSON.parse(raw) as Record<string, unknown>;
      const result: ExecutionResult = {
        success: Boolean(res.success),
        txSignature: res.txSignature as string | undefined,
        profitLamports: res.profitLamports ? BigInt(String(res.profitLamports)) : undefined,
        feeLamports: res.feeLamports ? BigInt(String(res.feeLamports)) : undefined,
        durationMs: Date.now() - start,
        error: res.error as string | undefined,
      };

      this.auditLog.push({
        timestamp: Date.now(),
        opportunityId: opportunity.id,
        executed: result.success,
        profitLamports: result.profitLamports ?? BigInt(0),
        txSignature: result.txSignature,
        riskScore: 0,
      });

      if (result.success) {
        logger.info('Arbitrage executed', {
          opportunityId: opportunity.id,
          txSignature: result.txSignature,
          profitLamports: result.profitLamports?.toString(),
        });
      }

      return result;
    } catch (err) {
      logger.error('Arbitrage execution failed', { error: (err as Error).message });
      return { success: false, error: (err as Error).message, durationMs: Date.now() - start };
    }
  }

  /** On-chain smart audit for a confirmed transaction */
  async auditTransaction(txSignature: string): Promise<Record<string, unknown>> {
    const wasm = await loadWasmModule();
    const raw = wasm.audit_transaction(txSignature, this.rpcUrl);
    return JSON.parse(raw) as Record<string, unknown>;
  }

  /** In-memory audit trail (last 1 000 entries) */
  getAuditLog(): AuditEntry[] {
    return this.auditLog.slice(-1000);
  }
}
