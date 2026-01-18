import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('oauth.google.clientId'),
      clientSecret: configService.get<string>('oauth.google.clientSecret'),
      callbackURL: configService.get<string>('oauth.google.callbackURL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, id, photos } = profile;
    const user = {
      googleId: id,
      email: emails[0].value,
      name: name.givenName + ' ' + name.familyName,
      avatar: photos && photos[0] ? photos[0].value : null,
      accessToken,
    };
    done(null, user);
  }
}


