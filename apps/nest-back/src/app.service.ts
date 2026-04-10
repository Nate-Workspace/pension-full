import { Injectable } from '@nestjs/common';
import { TestType } from '@repo/types/test-type';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  postHello (createRequest: TestType) : string {
    return "Hello " + createRequest.name + ", your price is " + createRequest.price;
  }
}
