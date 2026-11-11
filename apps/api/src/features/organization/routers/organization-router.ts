import {
  createOrganizationClinic,
  listOrganizationClinics,
  updateOrganizationClinic,
} from "@api/features/organization/services/organization-clinic-service";
import {
  createOrganization,
  listOrganizations,
  organizationFor,
  requireOrganization,
  updateOrganization,
} from "@api/features/organization/services/organization-service";
import {
  requireAdmin,
  requireOrgAdmin,
  requireStaff,
} from "@api/features/shared/auth/index";
import {
  ClinicCreateSchema,
  ClinicUpdateSchema,
  OrganizationCreateSchema,
  OrganizationUpdateSchema,
} from "@hermes/validators";
import { Type } from "@sinclair/typebox";
import { Elysia } from "elysia";

const authHeader = Type.Object({
  authorization: Type.Optional(Type.String()),
  cookie: Type.Optional(Type.String()),
});

const idParams = Type.Object({ id: Type.String({ minLength: 1 }) });

export const organizationRouter = new Elysia({ prefix: "/organizations" })
  // Platform operator: the full customer list.
  .get(
    "/",
    async ({ headers }) => {
      await requireAdmin(headers);
      return listOrganizations();
    },
    { headers: authHeader },
  )
  .post(
    "/",
    async ({ body, headers }) => {
      await requireAdmin(headers);
      return createOrganization(body);
    },
    { body: OrganizationCreateSchema, headers: authHeader },
  )
  .patch(
    "/:id",
    async ({ params, body, headers }) => {
      await requireAdmin(headers);
      return updateOrganization(params.id, body);
    },
    { params: idParams, body: OrganizationUpdateSchema, headers: authHeader },
  )
  // The signed-in org admin's own organization: clinics and footprint.
  .get(
    "/me",
    async ({ headers, query }) => {
      const staff = await requireOrgAdmin(headers);
      const organizationId = await organizationFor(staff, query.organizationId);
      return requireOrganization(organizationId);
    },
    {
      headers: authHeader,
      query: Type.Object({ organizationId: Type.Optional(Type.String()) }),
    },
  )
  .get(
    "/me/clinics",
    async ({ headers, query }) => {
      const staff = await requireOrgAdmin(headers);
      const organizationId = await organizationFor(staff, query.organizationId);
      return listOrganizationClinics(organizationId);
    },
    {
      headers: authHeader,
      query: Type.Object({ organizationId: Type.Optional(Type.String()) }),
    },
  )
  .post(
    "/me/clinics",
    async ({ body, headers }) => {
      const staff = await requireOrgAdmin(headers);
      const organizationId = await organizationFor(staff);
      return createOrganizationClinic(organizationId, body);
    },
    { body: ClinicCreateSchema, headers: authHeader },
  )
  .patch(
    "/me/clinics/:id",
    async ({ params, body, headers }) => {
      const staff = await requireOrgAdmin(headers);
      const organizationId = await organizationFor(staff);
      return updateOrganizationClinic(organizationId, params.id, body);
    },
    { params: idParams, body: ClinicUpdateSchema, headers: authHeader },
  )
  // Every staff member can see the organization they work for.
  .get(
    "/mine",
    async ({ headers }) => {
      const staff = await requireStaff(headers);
      if (staff.organizationId === null) return null;
      return requireOrganization(staff.organizationId);
    },
    { headers: authHeader },
  );
