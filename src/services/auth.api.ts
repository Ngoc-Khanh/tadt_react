import type { LoginDto } from "@/constants/dto";
import type { ICredentialResponse } from "@/constants/interfaces";
import type { SRO } from "@/constants/sro";
import { apiPost } from "@/services/api";

export const AuthAPI = {
  async login(credentials: LoginDto) {
    const res = await apiPost<LoginDto, SRO<ICredentialResponse>>("/api/User/Login", credentials);
    return res.data.Data;
  }
}