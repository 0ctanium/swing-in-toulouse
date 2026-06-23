export {};

// Create a type for the Roles
export type Roles = "admin";

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: Roles;
    };
  }
}
