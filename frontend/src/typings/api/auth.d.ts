declare namespace Api {
  namespace Auth {
    type LoginToken = import('../../service/api/openapi').components['schemas']['Tokens'];
    type UserInfo = import('../../service/api/openapi').components['schemas']['Identity'];
  }
}
