import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { RegisterDto } from './dto';
import { Role, AuthProvider, NotificationType } from '../../common/enums';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshTokensRepository: Repository<RefreshToken>,
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }

  async register(dto: RegisterDto) {
    const existing = await this.usersRepository.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException({ errorCode: 'EMAIL_ALREADY_EXISTS', message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepository.create({
      ...dto,
      password: hashedPassword,
      authProvider: AuthProvider.EMAIL,
      role: Role.USER,
    });
    const saved = await this.usersRepository.save(user);
    const tokens = await this.generateTokens(saved);

    // Send welcome notification
    await this.createWelcomeNotification(saved.id);

    return {
      user: { id: saved.id, email: saved.email, name: saved.name, role: saved.role },
      tokens,
    };
  }

  async login(user: User) {
    const tokens = await this.generateTokens(user);
    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      tokens,
    };
  }

  async guestLogin() {
    const guest = this.usersRepository.create({
      name: 'Guest',
      authProvider: AuthProvider.GUEST,
      role: Role.GUEST,
    });
    const saved = await this.usersRepository.save(guest);
    const tokens = await this.generateTokens(saved);

    return {
      user: { id: saved.id, role: saved.role, name: saved.name },
      tokens,
    };
  }

  async googleAuth(idToken: string) {
    // In production: verify idToken with Google's tokeninfo endpoint
    // For now: decode the token payload to get user info
    // Google verification would use: https://oauth2.googleapis.com/tokeninfo?id_token=...
    const decoded = this.jwtService.decode(idToken) as any;
    if (!decoded || !decoded.email) {
      throw new BadRequestException('Invalid Google ID token');
    }

    const email = decoded.email;
    const name = decoded.name || decoded.email.split('@')[0];

    // Check if user already exists
    let user = await this.usersRepository.findOne({ where: { email } });

    let isNewUser = false;
    if (!user) {
      user = this.usersRepository.create({
        email,
        name,
        authProvider: AuthProvider.GOOGLE,
        role: Role.USER,
        isVerified: true,
      });
      user = await this.usersRepository.save(user);
      isNewUser = true;
    }

    const tokens = await this.generateTokens(user);

    if (isNewUser) {
      await this.createWelcomeNotification(user.id);
    }

    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      tokens,
    };
  }

  async appleAuth(identityToken: string, authorizationCode: string) {
    // In production: verify identityToken with Apple's public keys
    // Apple verification: https://appleid.apple.com/auth/keys
    const decoded = this.jwtService.decode(identityToken) as any;
    if (!decoded || !decoded.sub) {
      throw new BadRequestException('Invalid Apple identity token');
    }

    const email = decoded.email || `${decoded.sub}@privaterelay.appleid.com`;
    const name = decoded.name || 'Apple User';

    let user = await this.usersRepository.findOne({ where: { email } });

    let isNewUser = false;
    if (!user) {
      user = this.usersRepository.create({
        email,
        name,
        authProvider: AuthProvider.APPLE,
        role: Role.USER,
        isVerified: true,
      });
      user = await this.usersRepository.save(user);
      isNewUser = true;
    }

    const tokens = await this.generateTokens(user);

    if (isNewUser) {
      await this.createWelcomeNotification(user.id);
    }

    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      tokens,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.usersRepository.findOne({ where: { email } });
    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'If the email exists, a reset link has been sent.' };
    }

    // Generate a short-lived reset token (15 min)
    const resetToken = this.jwtService.sign(
      { sub: user.id, type: 'password-reset' },
      {
        secret: this.configService.get<string>('app.jwt.secret'),
        expiresIn: '15m',
      },
    );

    // In production: send resetToken via email using a mail service
    // For dev: return the token directly for testing
    return {
      message: 'If the email exists, a reset link has been sent.',
      // DEV ONLY — remove in production
      resetToken,
    };
  }

  async resetPassword(token: string, newPassword: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('app.jwt.secret'),
      });
    } catch {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (payload.type !== 'password-reset') {
      throw new BadRequestException('Invalid token type');
    }

    const user = await this.usersRepository.findOne({ where: { id: payload.sub } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await this.usersRepository.save(user);

    return { message: 'Password reset successful' };
  }

  async refreshToken(refreshTokenStr: string) {
    const stored = await this.refreshTokensRepository.findOne({
      where: { token: refreshTokenStr, isRevoked: false },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.usersRepository.findOne({ where: { id: stored.userId } });
    if (!user) {
      throw new UnauthorizedException();
    }

    // Revoke old token
    stored.isRevoked = true;
    await this.refreshTokensRepository.save(stored);

    return this.generateTokens(user);
  }

  private async generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('app.jwt.secret'),
      expiresIn: this.configService.get<string>('app.jwt.expiration') as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('app.jwt.refreshSecret'),
      expiresIn: this.configService.get<string>('app.jwt.refreshExpiration') as any,
    });

    // Store refresh token
    const refreshTokenEntity = this.refreshTokensRepository.create({
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
    await this.refreshTokensRepository.save(refreshTokenEntity);

    return { accessToken, refreshToken };
  }

  private async createWelcomeNotification(userId: string): Promise<void> {
    const notification = this.notificationsRepository.create({
      userId,
      type: NotificationType.WELCOME,
      title: 'Welcome to REKI! 🎉',
      message: "Start exploring Manchester's best vibes. Save your favourite venues to get live alerts!",
      icon: '🎉',
    });
    await this.notificationsRepository.save(notification);
  }
}
