//import { allowedRoles } from "../interfaces/IUser";

import { allowedRoles } from "../interfaces/IUser";

const userRoles = [...allowedRoles] as const; //allowedRoles.slice()
type userRoleType = (typeof userRoles)[number];

const roleSet = new Set<string>(userRoles);
export function isRole(value: unknown): value is userRoleType {
  return typeof value === "string" && roleSet.has(value);
}

export function userRoleRanking() {}

type RoleSelector = (
  roles: readonly userRoleType[],
  index: number,
) => readonly userRoleType[];

export const roleIndexMap: Record<userRoleType, number> = Object.fromEntries(
  userRoles.map((role, index) => [role, index]),
) as Record<userRoleType, number>;

export const left: RoleSelector = (r, i) => r.slice(0, i);
export const leftInclusive: RoleSelector = (r, i) => r.slice(0, i + 1);
export const right: RoleSelector = (r, i) => r.slice(i);

export const setRoles = (role: userRoleType, selector: RoleSelector = right) => {
  const i = roleIndexMap[role];
  return selector(userRoles, i);
};