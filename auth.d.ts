/* eslint-disable @typescript-eslint/consistent-type-imports */
/// <reference types="lucia" />
declare namespace Lucia {
  type Auth = import('./utils/auth').Auth;
  type DatabaseUserAttributes = {
    username: string;
    networkId: string | null;
  };
  // type DatabaseSessionAttributes = {};
}
