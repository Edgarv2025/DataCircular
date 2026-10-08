import { apiFetch } from './client';
import {
  OrganizationDto,
  OrganizationMemberDto,
  CreateOrganizationInput,
  UpdateOrganizationInput,
  AddMemberInput,
  UpdateMemberRoleInput,
  RequestVerificationInput,
  ReviewVerificationInput,
  RoleDto,
} from '@data-circular/shared';
import queryString from 'query-string';

/**
 * Cliente API para el Módulo de Organizaciones, Membresías y Certificación (Fase 7)
 */
export const OrganizationsApi = {
  /**
   * Obtiene la lista de organizaciones a las que pertenece el usuario.
   */
  async getMyOrganizations(filters: Record<string, any> = {}): Promise<OrganizationDto[]> {
    const qs = queryString.stringify(filters, { skipNull: true, skipEmptyString: true });
    return apiFetch<OrganizationDto[]>(`/organizations${qs ? `?${qs}` : ''}`);
  },

  /**
   * Obtiene todas las organizaciones (para administradores de plataforma).
   */
  async getAllOrganizations(filters: Record<string, any> = {}): Promise<OrganizationDto[]> {
    const qs = queryString.stringify({ ...filters, all: true }, { skipNull: true, skipEmptyString: true });
    return apiFetch<OrganizationDto[]>(`/organizations${qs ? `?${qs}` : ''}`);
  },

  /**
   * Obtiene la información detallada de una organización.
   */
  async getById(id: string): Promise<OrganizationDto> {
    return apiFetch<OrganizationDto>(`/organizations/${id}`);
  },

  /**
   * Registra una nueva organización y asocia al usuario actual como OWNER.
   */
  async create(data: CreateOrganizationInput): Promise<OrganizationDto> {
    return apiFetch<OrganizationDto>('/organizations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Actualiza los datos comerciales de una organización.
   */
  async update(id: string, data: UpdateOrganizationInput): Promise<OrganizationDto> {
    return apiFetch<OrganizationDto>(`/organizations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Desactiva lógicamente una organización.
   */
  async delete(id: string): Promise<OrganizationDto> {
    return apiFetch<OrganizationDto>(`/organizations/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Lista los miembros vinculados a una organización.
   */
  async getMembers(orgId: string): Promise<OrganizationMemberDto[]> {
    return apiFetch<OrganizationMemberDto[]>(`/organizations/${orgId}/members`);
  },

  /**
   * Invita o vincula un nuevo miembro por correo.
   */
  async addMember(orgId: string, data: AddMemberInput): Promise<OrganizationMemberDto> {
    return apiFetch<OrganizationMemberDto>(`/organizations/${orgId}/members`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Actualiza el rol o estado de un miembro de la organización.
   */
  async updateMemberRole(
    orgId: string,
    memberId: string,
    data: UpdateMemberRoleInput
  ): Promise<OrganizationMemberDto> {
    return apiFetch<OrganizationMemberDto>(`/organizations/${orgId}/members/${memberId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Desvincula un miembro de la organización.
   */
  async removeMember(orgId: string, memberId: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(`/organizations/${orgId}/members/${memberId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Radica solicitud formal de certificación o verificación ambiental/institucional.
   */
  async requestVerification(
    orgId: string,
    data: RequestVerificationInput
  ): Promise<OrganizationDto> {
    return apiFetch<OrganizationDto>(`/organizations/${orgId}/verification`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Dictamina y califica la verificación institucional (exclusivo administradores de plataforma).
   */
  async reviewVerification(
    orgId: string,
    data: ReviewVerificationInput
  ): Promise<OrganizationDto> {
    return apiFetch<OrganizationDto>(`/organizations/${orgId}/verification/review`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Consulta el catálogo de roles del sistema y sus permisos configurados.
   */
  async listRoles(): Promise<RoleDto[]> {
    return apiFetch<RoleDto[]>('/organizations/roles/available');
  },
};
