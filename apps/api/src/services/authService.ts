import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { logger } from '../config/logger';
import { TokenPayload } from '../middleware/auth';

interface RegisterInput {
  email: string;
  password: string;
  name: string;
  tenantName: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    tenantId: string;
  };
  tenant: {
    id: string;
    name: string;
    slug: string;
    plan: string;
  };
}

export class AuthService {
  private readonly SALT_ROUNDS = 12;
  private readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '15m';
  private readonly JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN ?? '7d';

  /** Create a new user + tenant */
  async register(input: RegisterInput): Promise<AuthResponse> {
    const { email, password, name, tenantName } = input;
    const lowerEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email: lowerEmail } });
    if (existing) {
      throw new Error('An account with this email already exists');
    }

    const slug = this.slugify(tenantName);
    let uniqueSlug = slug;
    let attempt = 0;
    while (await prisma.tenant.findUnique({ where: { slug: uniqueSlug } })) {
      attempt++;
      uniqueSlug = `${slug}-${attempt}`;
    }

    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

    const [tenant, user] = await prisma.$transaction(async (tx) => {
      const t = await tx.tenant.create({
        data: { name: tenantName, slug: uniqueSlug, plan: 'free', status: 'active' },
      });
      const u = await tx.user.create({
        data: { email: lowerEmail, password: hashedPassword, name, role: 'admin', tenantId: t.id },
      });
      return [t, u];
    });

    logger.info('New registration', { userId: user.id, tenantId: tenant.id });

    const { accessToken, refreshToken } = this.generateTokens(user, tenant.id);
    await this.storeRefreshToken(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, tenantId: tenant.id },
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug, plan: tenant.plan },
    };
  }

  /** Authenticate user and return tokens */
  async login(email: string, password: string): Promise<AuthResponse> {
    const lowerEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: lowerEmail },
      include: { tenant: true },
    });

    if (!user) {
      // Constant-time response to prevent user enumeration
      await bcrypt.hash('dummy', this.SALT_ROUNDS);
      throw new Error('Invalid email or password');
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error('Invalid email or password');
    }

    if (user.tenant.status !== 'active') {
      throw new Error('Account is not active. Please contact support.');
    }

    const { accessToken, refreshToken } = this.generateTokens(user, user.tenantId);
    await this.storeRefreshToken(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, tenantId: user.tenantId },
      tenant: { id: user.tenant.id, name: user.tenant.name, slug: user.tenant.slug, plan: user.tenant.plan },
    };
  }

  /** Invalidate access token (blocklist) and refresh token */
  async logout(accessToken: string, userId: string): Promise<void> {
    if (accessToken) {
      // Blocklist token until it naturally expires (15m)
      await redis.setex(`blocklist:${accessToken}`, 900, '1');
    }
    await redis.del(`refresh:${userId}`);
  }

  /** Issue new access token from refresh token */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const secret = process.env.JWT_REFRESH_SECRET ?? '';
    let payload: TokenPayload;
    try {
      payload = jwt.verify(refreshToken, secret) as TokenPayload;
    } catch {
      throw new Error('Invalid or expired refresh token');
    }

    const stored = await redis.get(`refresh:${payload.sub}`);
    if (!stored || stored !== refreshToken) {
      throw new Error('Refresh token has been revoked');
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub }, include: { tenant: true } });
    if (!user) throw new Error('User not found');

    const tokens = this.generateTokens(user, user.tenantId);
    await this.storeRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  /** Get full user profile */
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, tenantId: true, createdAt: true, tenant: { select: { id: true, name: true, slug: true, plan: true, status: true } } },
    });
    if (!user) throw new Error('User not found');
    return user;
  }

  /** Send password reset email */
  async forgotPassword(email: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return; // Silent no-op

    const token = crypto.randomBytes(32).toString('hex');
    const ttl = 60 * 60; // 1 hour

    await redis.setex(`password-reset:${token}`, ttl, user.id);
    // In production: send email with reset link
    // await emailService.sendPasswordReset(user.email, token);
    logger.info('Password reset token generated', { userId: user.id });
  }

  /** Reset password using token */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const userId = await redis.get(`password-reset:${token}`);
    if (!userId) throw new Error('Invalid or expired reset token');

    const hashed = await bcrypt.hash(newPassword, this.SALT_ROUNDS);
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
    await redis.del(`password-reset:${token}`);
    // Invalidate all refresh tokens for this user
    await redis.del(`refresh:${userId}`);

    logger.info('Password reset successful', { userId });
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  private generateTokens(
    user: { id: string; email: string; role: string },
    tenantId: string,
  ): { accessToken: string; refreshToken: string } {
    const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
      sub: user.id,
      tenantId,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET ?? '',
      { expiresIn: this.JWT_EXPIRES_IN } as unknown as jwt.SignOptions,
    );

    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET ?? '',
      { expiresIn: this.JWT_REFRESH_EXPIRES_IN } as unknown as jwt.SignOptions,
    );

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(userId: string, token: string): Promise<void> {
    const ttl = 7 * 24 * 60 * 60; // 7 days in seconds
    await redis.setex(`refresh:${userId}`, ttl, token);
  }

  private slugify(str: string): string {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50);
  }
}
