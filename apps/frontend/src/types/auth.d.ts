export interface SignupResponse {
  token: string;
  success: boolean;
  message: string;

  user: User;
}
export interface User {
  email: string;
  username: string;
}
export interface SigninResponse {
  token: string;
  success: boolean;
  message: string;
  user: User;
}
export interface SigninRequest {
  email: string;
  password: string;
}
export interface SignupRequest extends User {
  password: string;
}
