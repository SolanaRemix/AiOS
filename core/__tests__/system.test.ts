import {
  Logger,
  Scheduler,
  SecretsManager,
  RateLimiter,
  StorageManager,
  SystemCalls,
  validateEnv,
  SecretsValidationError,
  StorageError,
  SchedulerError,
} from '../system';

// ---------------------------------------------------------------------------
// Logger
// ---------------------------------------------------------------------------

describe('Logger', () => {
  let stdoutSpy: jest.SpyInstance;
  let stderrSpy: jest.SpyInstance;

  beforeEach(() => {
    stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
  });

  it('writes info to stdout as JSON', () => {
    const logger = new Logger('TestCtx');
    logger.info('hello world');
    expect(stdoutSpy).toHaveBeenCalledTimes(1);
    const line = JSON.parse(stdoutSpy.mock.calls[0][0] as string);
    expect(line.level).toBe('info');
    expect(line.message).toBe('hello world');
    expect(line.context).toBe('TestCtx');
    expect(line.timestamp).toMatch(/^\d{4}-/);
  });

  it('writes error and warn to stderr', () => {
    const logger = new Logger('ErrCtx', 'debug');
    logger.error('boom', { code: 500 });
    logger.warn('careful');
    expect(stderrSpy).toHaveBeenCalledTimes(2);
  });

  it('includes structured data in log entry', () => {
    const logger = new Logger('DataCtx');
    logger.debug('with data', { key: 'value', num: 42 });
    const line = JSON.parse(stdoutSpy.mock.calls[0][0] as string);
    expect(line.data).toEqual({ key: 'value', num: 42 });
  });

  it('includes correlationId when set', () => {
    const logger = new Logger('CorrCtx');
    logger.setCorrelationId('corr-123');
    logger.info('traced');
    const line = JSON.parse(stdoutSpy.mock.calls[0][0] as string);
    expect(line.correlationId).toBe('corr-123');
    logger.clearCorrelationId();
  });

  it('suppresses messages below minLevel', () => {
    const logger = new Logger('SuppressCtx', 'error');
    logger.debug('ignored');
    logger.info('ignored');
    logger.warn('ignored');
    expect(stdoutSpy).not.toHaveBeenCalled();
    expect(stderrSpy).not.toHaveBeenCalled();
    logger.error('shown');
    expect(stderrSpy).toHaveBeenCalledTimes(1);
  });

  it('child logger inherits context and minLevel', () => {
    const parent = new Logger('Parent', 'info');
    const child = parent.child('Child');
    child.info('from child');
    const line = JSON.parse(stdoutSpy.mock.calls[0][0] as string);
    expect(line.context).toBe('Parent:Child');
  });

  it('setMinLevel changes behaviour at runtime', () => {
    const logger = new Logger('Dynamic', 'error');
    logger.info('not shown');
    expect(stdoutSpy).not.toHaveBeenCalled();
    logger.setMinLevel('info');
    logger.info('now shown');
    expect(stdoutSpy).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Scheduler
// ---------------------------------------------------------------------------

describe('Scheduler', () => {
  let scheduler: Scheduler;

  beforeEach(() => {
    scheduler = new Scheduler();
    jest.useFakeTimers();
  });

  afterEach(() => {
    scheduler.clear();
    jest.useRealTimers();
  });

  it('scheduleOnce fires after the specified delay', () => {
    const fn = jest.fn();
    scheduler.scheduleOnce('one-shot', 100, fn);
    expect(fn).not.toHaveBeenCalled();
    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('scheduleOnce removes task after firing', () => {
    scheduler.scheduleOnce('auto-remove', 50, () => {});
    jest.advanceTimersByTime(100);
    expect(scheduler.list()).toHaveLength(0);
  });

  it('schedule fires repeatedly', () => {
    const fn = jest.fn();
    scheduler.schedule('repeat', '* * * * *', fn, 200);
    jest.advanceTimersByTime(600);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('cancel stops a recurring task', () => {
    const fn = jest.fn();
    scheduler.schedule('cancelable', '* * * * *', fn, 100);
    jest.advanceTimersByTime(250);
    scheduler.cancel('cancelable');
    jest.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(2); // fired at 100, 200; not after cancel
  });

  it('cancel returns false for unknown task', () => {
    expect(scheduler.cancel('ghost')).toBe(false);
  });

  it('list returns active tasks', () => {
    scheduler.schedule('t1', '* * * * *', () => {}, 1000);
    scheduler.scheduleOnce('t2', 500, () => {});
    const tasks = scheduler.list();
    expect(tasks).toHaveLength(2);
    expect(tasks.map((t) => t.id)).toContain('t1');
    expect(tasks.map((t) => t.id)).toContain('t2');
  });

  it('throws SchedulerError for duplicate task id', () => {
    scheduler.schedule('dup', '* * * * *', () => {}, 1000);
    expect(() => scheduler.schedule('dup', '* * * * *', () => {}, 1000)).toThrow(SchedulerError);
  });

  it('throws SchedulerError for non-positive interval', () => {
    expect(() => scheduler.schedule('bad', '* * * * *', () => {}, 0)).toThrow(SchedulerError);
  });

  it('clear cancels all tasks', () => {
    scheduler.schedule('a', '* * * * *', () => {}, 100);
    scheduler.schedule('b', '* * * * *', () => {}, 200);
    scheduler.clear();
    expect(scheduler.list()).toHaveLength(0);
  });

  it('scheduleOnce task metadata includes nextRunAt', () => {
    const before = Date.now();
    const task = scheduler.scheduleOnce('meta-test', 500, () => {});
    expect(task.nextRunAt).toBeGreaterThanOrEqual(before);
    expect(task.recurring).toBe(false);
    expect(task.active).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// SecretsManager
// ---------------------------------------------------------------------------

describe('SecretsManager', () => {
  let secrets: SecretsManager;

  beforeEach(() => {
    secrets = new SecretsManager();
  });

  it('reads from process.env', () => {
    process.env['TEST_SECRET_KEY'] = 'my-secret-value';
    expect(secrets.get('TEST_SECRET_KEY')).toBe('my-secret-value');
    delete process.env['TEST_SECRET_KEY'];
  });

  it('overrides with set()', () => {
    secrets.set('CUSTOM_KEY', 'custom-value');
    expect(secrets.get('CUSTOM_KEY')).toBe('custom-value');
  });

  it('override takes precedence over process.env', () => {
    process.env['OVERRIDE_KEY'] = 'env-value';
    secrets.set('OVERRIDE_KEY', 'override-value');
    expect(secrets.get('OVERRIDE_KEY')).toBe('override-value');
    delete process.env['OVERRIDE_KEY'];
  });

  it('returns undefined for missing key', () => {
    expect(secrets.get('NONEXISTENT_9999')).toBeUndefined();
  });

  it('validate passes when all keys are present', () => {
    secrets.set('K1', 'v1');
    secrets.set('K2', 'v2');
    expect(() => secrets.validate(['K1', 'K2'])).not.toThrow();
  });

  it('validate throws SecretsValidationError for missing keys', () => {
    expect(() => secrets.validate(['DEFINITELY_MISSING_ABC'])).toThrow(SecretsValidationError);
  });

  it('SecretsValidationError lists all missing keys', () => {
    try {
      secrets.validate(['MISS_A', 'MISS_B']);
      fail('should have thrown');
    } catch (err) {
      expect(err instanceof SecretsValidationError).toBe(true);
      expect((err as SecretsValidationError).message).toMatch(/MISS_A/);
      expect((err as SecretsValidationError).message).toMatch(/MISS_B/);
    }
  });
});

// ---------------------------------------------------------------------------
// RateLimiter
// ---------------------------------------------------------------------------

describe('RateLimiter', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter();
  });

  it('allows requests within the limit', () => {
    expect(limiter.checkLimit('user-1', 10)).toBe(true);
    limiter.consume('user-1', 10);
    expect(limiter.checkLimit('user-1', 10)).toBe(true);
  });

  it('blocks requests when limit is exceeded', () => {
    for (let i = 0; i < 5; i++) limiter.consume('user-2', 5);
    expect(limiter.checkLimit('user-2', 5)).toBe(false);
  });

  it('consume returns false when over limit', () => {
    for (let i = 0; i < 3; i++) limiter.consume('key', 3);
    expect(limiter.consume('key', 3)).toBe(false);
  });

  it('reset clears the counter', () => {
    for (let i = 0; i < 5; i++) limiter.consume('key');
    limiter.reset('key');
    expect(limiter.getUsage('key')).toBe(0);
    expect(limiter.checkLimit('key', 5)).toBe(true);
  });

  it('getUsage returns 0 for unknown key', () => {
    expect(limiter.getUsage('new-key')).toBe(0);
  });

  it('tracks usage per distinct key', () => {
    limiter.consume('a');
    limiter.consume('a');
    limiter.consume('b');
    expect(limiter.getUsage('a')).toBe(2);
    expect(limiter.getUsage('b')).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// StorageManager
// ---------------------------------------------------------------------------

describe('StorageManager', () => {
  let storage: StorageManager;

  beforeEach(() => {
    storage = new StorageManager();
  });

  it('uploads and downloads a buffer', async () => {
    const data = Buffer.from('hello storage');
    await storage.upload('test/file.txt', data);
    const downloaded = await storage.download('test/file.txt');
    expect(downloaded.toString('utf-8')).toBe('hello storage');
  });

  it('uploads a string and downloads it', async () => {
    await storage.upload('text/hello.txt', 'world');
    const downloaded = await storage.download('text/hello.txt');
    expect(downloaded.toString()).toBe('world');
  });

  it('returns correct metadata after upload', async () => {
    const meta = await storage.upload('meta/obj.bin', Buffer.alloc(10), { owner: 'test' });
    expect(meta.key).toBe('meta/obj.bin');
    expect(meta.size).toBe(10);
    expect(meta.lastModified).toMatch(/^\d{4}-/);
    expect(meta.metadata?.['owner']).toBe('test');
  });

  it('throws StorageError when downloading non-existent key', async () => {
    await expect(storage.download('missing/file.txt')).rejects.toThrow(StorageError);
  });

  it('deletes an object', async () => {
    await storage.upload('del/file.txt', 'bye');
    expect(await storage.delete('del/file.txt')).toBe(true);
    await expect(storage.download('del/file.txt')).rejects.toThrow(StorageError);
  });

  it('lists objects with prefix filter', async () => {
    await storage.upload('docs/a.txt', 'a');
    await storage.upload('docs/b.txt', 'b');
    await storage.upload('images/c.png', 'c');
    const docs = await storage.list('docs/');
    expect(docs).toHaveLength(2);
    expect(docs.every((o) => o.key.startsWith('docs/'))).toBe(true);
  });

  it('list() with no prefix returns all objects', async () => {
    await storage.upload('x', 'x');
    await storage.upload('y', 'y');
    expect((await storage.list()).length).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// validateEnv
// ---------------------------------------------------------------------------

describe('validateEnv', () => {
  it('does not throw when all vars are present', () => {
    process.env['VALIDATE_TEST_A'] = 'val-a';
    expect(() =>
      validateEnv({ VALIDATE_TEST_A: 'Test variable A' }),
    ).not.toThrow();
    delete process.env['VALIDATE_TEST_A'];
  });

  it('throws with descriptive message for missing vars', () => {
    expect(() =>
      validateEnv({
        MISSING_VAR_XYZ: 'A required variable',
        ANOTHER_MISSING: 'Another required variable',
      }),
    ).toThrow(/MISSING_VAR_XYZ/);
  });
});

// ---------------------------------------------------------------------------
// SystemCalls
// ---------------------------------------------------------------------------

describe('SystemCalls', () => {
  it('constructs all services', () => {
    const system = new SystemCalls();
    expect(system.logger).toBeInstanceOf(Logger);
    expect(system.scheduler).toBeInstanceOf(Scheduler);
    expect(system.secrets).toBeInstanceOf(SecretsManager);
    expect(system.storage).toBeInstanceOf(StorageManager);
    expect(system.rateLimiter).toBeInstanceOf(RateLimiter);
  });

  it('shutdown cancels all scheduled tasks', () => {
    jest.useFakeTimers();
    const system = new SystemCalls();
    const fn = jest.fn();
    system.scheduler.schedule('task', '* * * * *', fn, 100);
    system.shutdown();
    jest.advanceTimersByTime(500);
    expect(fn).not.toHaveBeenCalled();
    jest.useRealTimers();
  });
});
